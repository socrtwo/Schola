"""Square CSV and Directory CSV import tools.

Handles both Square CSV formats (Items and Transactions) as well as
bulk resident directory imports.
"""
import csv
import io
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .models import (
    Event,
    EventCategory,
    Organization,
    Payment,
    Person,
    PricingTier,
    Registration,
    Term,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_currency(value):
    """Parse a currency string like '$1.00' or '1.00' to Decimal."""
    if not value or value == "-":
        return Decimal("0.00")
    cleaned = re.sub(r"[^\d.\-]", "", str(value))
    try:
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return Decimal("0.00")


def _parse_date(value, fmt="%Y-%m-%d"):
    """Parse a date string. Returns None if unparseable."""
    if not value or value == "-":
        return None
    try:
        return datetime.strptime(value.strip(), fmt).date()
    except (ValueError, TypeError):
        return None


def _parse_datetime(date_str, time_str, tz_str=""):
    """Parse date + time strings into a timezone-aware datetime."""
    if not date_str or not time_str:
        return None
    try:
        dt = datetime.strptime(f"{date_str.strip()} {time_str.strip()}", "%Y-%m-%d %H:%M:%S")
        return timezone.make_aware(dt)
    except (ValueError, TypeError):
        return None


def _clean_value(value):
    """Strip whitespace, treat '-' as empty."""
    if value is None:
        return ""
    v = str(value).strip()
    return "" if v == "-" else v


# ---------------------------------------------------------------------------
# Square Items CSV Import
# ---------------------------------------------------------------------------

class SquareItemsImporter:
    """Import Square Items CSV (33 columns, one row per line item).

    SKU maps to event legacy_id. Transaction ID links to payments.
    Customer Name is used for fuzzy person matching.
    """

    REQUIRED_COLUMNS = {"Date", "Transaction ID", "SKU", "Net Sales", "Customer Name"}

    def __init__(self, org, term, default_tier=None):
        self.org = org
        self.term = term
        self.default_tier = default_tier
        self.results = {
            "imported": 0,
            "skipped_duplicate": 0,
            "skipped_no_sku": 0,
            "skipped_no_event": 0,
            "errors": [],
            "needs_review": [],  # ambiguous person matches
        }

    def import_csv(self, file_obj, encoding="utf-8"):
        """Import from a file-like object or path string.

        Returns self.results dict.
        """
        if isinstance(file_obj, str):
            with open(file_obj, "r", encoding=encoding) as f:
                return self._process(f)
        else:
            text = file_obj.read()
            if isinstance(text, bytes):
                text = text.decode(encoding)
            return self._process(io.StringIO(text))

    def _process(self, fileobj):
        reader = csv.DictReader(fileobj)
        headers = set(h.strip() for h in (reader.fieldnames or []))
        missing = self.REQUIRED_COLUMNS - headers
        if missing:
            raise ValidationError(f"Missing required columns: {missing}")

        for row_num, row in enumerate(reader, start=2):
            row = {k.strip(): v.strip() if v else "" for k, v in row.items()}
            try:
                self._process_row(row, row_num)
            except Exception as e:
                self.results["errors"].append({
                    "row": row_num,
                    "error": str(e),
                    "transaction_id": row.get("Transaction ID", ""),
                })
        return self.results

    @transaction.atomic
    def _process_row(self, row, row_num):
        sku = _clean_value(row.get("SKU"))
        txn_id = _clean_value(row.get("Transaction ID"))
        customer_name = _clean_value(row.get("Customer Name"))
        net_sales = _parse_currency(row.get("Net Sales"))
        date_str = _clean_value(row.get("Date"))
        time_str = _clean_value(row.get("Time"))
        category = _clean_value(row.get("Category"))

        if not sku:
            self.results["skipped_no_sku"] += 1
            return

        # Find event by SKU (legacy_id)
        event = Event.objects.filter(
            organization=self.org, term=self.term, legacy_id=sku,
        ).first()
        if not event:
            self.results["skipped_no_event"] += 1
            self.results["errors"].append({
                "row": row_num,
                "error": f"No event found for SKU '{sku}'",
                "transaction_id": txn_id,
            })
            return

        # Idempotency: check if this transaction+SKU already imported
        existing = Payment.objects.filter(
            organization=self.org,
            square_transaction_id=txn_id,
            method="imported",
        ).first()
        if existing and existing.registrations.filter(event=event).exists():
            self.results["skipped_duplicate"] += 1
            return

        # Match person
        person = self._match_person(customer_name, row_num)
        if person is None:
            return  # added to needs_review

        # Create registration + payment
        reg, created = Registration.objects.get_or_create(
            person=person,
            event=event,
            defaults={
                "organization": self.org,
                "term": self.term,
                "tier": self.default_tier,
                "status": "registered",
                "amount_charged": net_sales,
            },
        )
        if not created:
            self.results["skipped_duplicate"] += 1
            return

        paid_at = _parse_datetime(date_str, time_str) or timezone.now()
        payment = Payment.objects.create(
            organization=self.org,
            person=person,
            amount=net_sales,
            method="imported",
            square_transaction_id=txn_id,
            square_payment_id=_clean_value(row.get("Payment ID", "")),
            paid_at=paid_at,
        )
        payment.registrations.add(reg)
        self.results["imported"] += 1

    def _match_person(self, customer_name, row_num):
        """Match customer name to a Person record.

        Exact match first, then fuzzy. Returns Person or None.
        """
        if not customer_name:
            self.results["needs_review"].append({
                "row": row_num,
                "reason": "No customer name provided",
            })
            return None

        parts = customer_name.split(None, 1)
        if len(parts) < 2:
            first_name, last_name = customer_name, ""
        else:
            first_name, last_name = parts[0], parts[1]

        # Exact match
        exact = Person.objects.filter(
            organization=self.org,
            first_name__iexact=first_name,
            last_name__iexact=last_name,
        )
        if exact.count() == 1:
            return exact.first()

        # Try last name only
        by_last = Person.objects.filter(
            organization=self.org,
            last_name__iexact=last_name,
        )
        if by_last.count() == 1:
            return by_last.first()

        # Ambiguous or no match
        if by_last.count() > 1:
            self.results["needs_review"].append({
                "row": row_num,
                "reason": f"Multiple matches for '{customer_name}'",
                "candidates": list(by_last.values_list("id", "first_name", "last_name")),
            })
        else:
            self.results["needs_review"].append({
                "row": row_num,
                "reason": f"No match for '{customer_name}'",
            })
        return None


# ---------------------------------------------------------------------------
# Square Transactions CSV Import
# ---------------------------------------------------------------------------

class SquareTransactionsImporter:
    """Import Square Transactions CSV (54 columns, one row per transaction).

    Creates Payment records for reconciliation.
    """

    REQUIRED_COLUMNS = {"Date", "Transaction ID", "Net Sales", "Total Collected"}

    def __init__(self, org):
        self.org = org
        self.results = {
            "imported": 0,
            "skipped_duplicate": 0,
            "errors": [],
        }

    def import_csv(self, file_obj, encoding="utf-8"):
        if isinstance(file_obj, str):
            with open(file_obj, "r", encoding=encoding) as f:
                return self._process(f)
        else:
            text = file_obj.read()
            if isinstance(text, bytes):
                text = text.decode(encoding)
            return self._process(io.StringIO(text))

    def _process(self, fileobj):
        reader = csv.DictReader(fileobj)
        headers = set(h.strip() for h in (reader.fieldnames or []))
        missing = self.REQUIRED_COLUMNS - headers
        if missing:
            raise ValidationError(f"Missing required columns: {missing}")

        for row_num, row in enumerate(reader, start=2):
            row = {k.strip(): v.strip() if v else "" for k, v in row.items()}
            try:
                self._process_row(row, row_num)
            except Exception as e:
                self.results["errors"].append({
                    "row": row_num,
                    "error": str(e),
                    "transaction_id": row.get("Transaction ID", ""),
                })
        return self.results

    @transaction.atomic
    def _process_row(self, row, row_num):
        txn_id = _clean_value(row.get("Transaction ID"))
        if not txn_id:
            return

        # Idempotency
        if Payment.objects.filter(
            organization=self.org,
            square_transaction_id=txn_id,
        ).exists():
            self.results["skipped_duplicate"] += 1
            return

        total = _parse_currency(row.get("Total Collected"))
        if total <= 0:
            return

        customer_name = _clean_value(row.get("Customer Name", ""))
        person = self._find_person(customer_name)

        paid_at = _parse_datetime(
            _clean_value(row.get("Date")),
            _clean_value(row.get("Time")),
        ) or timezone.now()

        Payment.objects.create(
            organization=self.org,
            person=person,
            amount=total,
            method="imported",
            square_transaction_id=txn_id,
            square_payment_id=_clean_value(row.get("Payment ID", "")),
            paid_at=paid_at,
            reference_note=f"Square import: {_clean_value(row.get('Description', ''))}",
        )
        self.results["imported"] += 1

    def _find_person(self, customer_name):
        """Best-effort person match. Returns Person or None."""
        if not customer_name:
            return None
        parts = customer_name.split(None, 1)
        if len(parts) < 2:
            return None
        first_name, last_name = parts[0], parts[1]
        match = Person.objects.filter(
            organization=self.org,
            first_name__iexact=first_name,
            last_name__iexact=last_name,
        ).first()
        return match


# ---------------------------------------------------------------------------
# Directory CSV Import (Bulk People)
# ---------------------------------------------------------------------------

class DirectoryImporter:
    """Import resident directory CSV (23 columns).

    Idempotent re-import: matches on email (primary), then
    first+last name as fallback. Conflict detection for admin review.
    """

    FIELD_MAP = {
        "First Name": "first_name",
        "Last Name": "last_name",
        "Email": "email",
        "Cell Phone Number": "cell_phone",
        "Phone Number": "phone",
        "Unit #": "unit_number",
        "Address": "address",
        "City": "city",
        "State/Province": "state",
        "Postal/Zip Code": "postal_code",
        "Building": "building",
    }

    def __init__(self, org):
        self.org = org
        self.results = {
            "created": 0,
            "updated": 0,
            "skipped_unchanged": 0,
            "conflicts": [],
            "errors": [],
        }

    def import_csv(self, file_obj, encoding="utf-8"):
        if isinstance(file_obj, str):
            with open(file_obj, "r", encoding=encoding) as f:
                return self._process(f)
        else:
            text = file_obj.read()
            if isinstance(text, bytes):
                text = text.decode(encoding)
            return self._process(io.StringIO(text))

    def _process(self, fileobj):
        reader = csv.DictReader(fileobj)
        for row_num, row in enumerate(reader, start=2):
            try:
                self._process_row(row, row_num)
            except Exception as e:
                self.results["errors"].append({
                    "row": row_num,
                    "error": str(e),
                })
        return self.results

    @transaction.atomic
    def _process_row(self, row, row_num):
        data = {}
        for csv_col, model_field in self.FIELD_MAP.items():
            data[model_field] = _clean_value(row.get(csv_col))

        if not data.get("first_name") or not data.get("last_name"):
            self.results["errors"].append({
                "row": row_num,
                "error": "Missing first or last name",
            })
            return

        data["is_resident"] = True

        # Match strategy: email first, then name
        existing = None
        if data.get("email"):
            existing = Person.objects.filter(
                organization=self.org, email__iexact=data["email"],
            ).first()

        if not existing:
            existing = Person.objects.filter(
                organization=self.org,
                first_name__iexact=data["first_name"],
                last_name__iexact=data["last_name"],
            ).first()

        if existing:
            # Check for conflicts
            changes = {}
            for field, value in data.items():
                if not value:
                    continue
                old = getattr(existing, field, "")
                if old and old != value and field != "is_resident":
                    changes[field] = {"old": old, "new": value}

            if changes:
                self.results["conflicts"].append({
                    "row": row_num,
                    "person_id": existing.pk,
                    "name": f"{existing.first_name} {existing.last_name}",
                    "changes": changes,
                })

            # Update non-conflicting fields
            updated = False
            for field, value in data.items():
                if value and not getattr(existing, field, ""):
                    setattr(existing, field, value)
                    updated = True
            if updated:
                existing.save()
                self.results["updated"] += 1
            else:
                self.results["skipped_unchanged"] += 1
        else:
            Person.objects.create(organization=self.org, **data)
            self.results["created"] += 1
