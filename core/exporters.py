"""Accounting export tools: CSV, Excel, QuickBooks IIF, QuickBooks QBO.

All exporters take an org and date range, and return either bytes or
write to a file-like object.
"""
import csv
import io
from datetime import date, datetime
from decimal import Decimal
from xml.etree.ElementTree import Element, SubElement, tostring

from django.db.models import Q, Sum

from .models import Organization, Payment, Registration


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_payments(org, start_date=None, end_date=None):
    """Get payments for an org within optional date range."""
    qs = Payment.objects.filter(organization=org).select_related("person")
    if start_date:
        qs = qs.filter(paid_at__date__gte=start_date)
    if end_date:
        qs = qs.filter(paid_at__date__lte=end_date)
    return qs.order_by("paid_at")


def _get_registrations(org, term=None, start_date=None, end_date=None):
    """Get registrations for an org within optional date range / term."""
    qs = Registration.objects.filter(organization=org).select_related(
        "person", "event", "tier",
    )
    if term:
        qs = qs.filter(term=term)
    if start_date:
        qs = qs.filter(registered_at__date__gte=start_date)
    if end_date:
        qs = qs.filter(registered_at__date__lte=end_date)
    return qs.order_by("registered_at")


# ---------------------------------------------------------------------------
# CSV Export
# ---------------------------------------------------------------------------

DEFAULT_CSV_COLUMNS = [
    ("date", "Date"),
    ("person_name", "Name"),
    ("event_title", "Event"),
    ("amount_charged", "Amount Charged"),
    ("amount_refunded", "Amount Refunded"),
    ("status", "Status"),
    ("tier", "Pricing Tier"),
    ("payment_method", "Payment Method"),
]


def export_registrations_csv(org, term=None, start_date=None, end_date=None,
                             columns=None, output=None):
    """Export registrations as CSV.

    Args:
        columns: list of (field_key, header_label) tuples. Defaults to
                 DEFAULT_CSV_COLUMNS.
        output: file-like object. If None, returns string.
    """
    if columns is None:
        columns = DEFAULT_CSV_COLUMNS

    regs = _get_registrations(org, term, start_date, end_date)

    buf = output or io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([label for _, label in columns])

    for reg in regs:
        row = []
        for key, _ in columns:
            row.append(_get_reg_field(reg, key))
        writer.writerow(row)

    if output is None:
        return buf.getvalue()


def _get_reg_field(reg, key):
    """Extract a field value from a Registration for CSV export."""
    if key == "date":
        return reg.registered_at.strftime("%Y-%m-%d")
    elif key == "person_name":
        return f"{reg.person.last_name}, {reg.person.first_name}"
    elif key == "person_email":
        return reg.person.email
    elif key == "event_title":
        return reg.event.title
    elif key == "event_id":
        return reg.event.legacy_id or str(reg.event.pk)
    elif key == "amount_charged":
        return str(reg.amount_charged)
    elif key == "amount_refunded":
        return str(reg.amount_refunded)
    elif key == "net_amount":
        return str(reg.amount_charged - reg.amount_refunded)
    elif key == "status":
        return reg.status
    elif key == "tier":
        return reg.tier.name if reg.tier else ""
    elif key == "payment_method":
        payments = reg.payments.all()
        return ", ".join(p.method for p in payments) if payments else ""
    elif key == "bundle":
        return reg.bundle.name if reg.bundle else ""
    elif key == "term":
        return reg.term.name if reg.term else ""
    else:
        return ""


def export_payments_csv(org, start_date=None, end_date=None, output=None):
    """Export payments as CSV."""
    payments = _get_payments(org, start_date, end_date)

    buf = output or io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "Date", "Person", "Amount", "Method", "Is Refund",
        "Transaction ID", "Check Number", "Reference Note",
    ])

    for p in payments:
        writer.writerow([
            p.paid_at.strftime("%Y-%m-%d"),
            f"{p.person.last_name}, {p.person.first_name}" if p.person else "",
            str(p.amount),
            p.method,
            "Yes" if p.is_refund else "No",
            p.square_transaction_id,
            p.check_number,
            p.reference_note,
        ])

    if output is None:
        return buf.getvalue()


# ---------------------------------------------------------------------------
# Excel Export
# ---------------------------------------------------------------------------

def export_registrations_excel(org, term=None, start_date=None, end_date=None,
                               columns=None):
    """Export registrations as Excel (.xlsx). Returns bytes."""
    try:
        import openpyxl
    except ImportError:
        raise ImportError("openpyxl is required for Excel export")

    if columns is None:
        columns = DEFAULT_CSV_COLUMNS

    regs = _get_registrations(org, term, start_date, end_date)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Registrations"

    # Header row
    for col_idx, (_, label) in enumerate(columns, start=1):
        cell = ws.cell(row=1, column=col_idx, value=label)
        cell.font = openpyxl.styles.Font(bold=True)

    # Data rows
    for row_idx, reg in enumerate(regs, start=2):
        for col_idx, (key, _) in enumerate(columns, start=1):
            ws.cell(row=row_idx, column=col_idx, value=_get_reg_field(reg, key))

    # Auto-width
    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 2, 50)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def export_payments_excel(org, start_date=None, end_date=None):
    """Export payments as Excel (.xlsx). Returns bytes."""
    try:
        import openpyxl
    except ImportError:
        raise ImportError("openpyxl is required for Excel export")

    payments = _get_payments(org, start_date, end_date)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Payments"

    headers = [
        "Date", "Person", "Amount", "Method", "Is Refund",
        "Transaction ID", "Check Number", "Reference Note",
    ]
    for col_idx, h in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=h)
        cell.font = openpyxl.styles.Font(bold=True)

    for row_idx, p in enumerate(payments, start=2):
        ws.cell(row=row_idx, column=1, value=p.paid_at.strftime("%Y-%m-%d"))
        ws.cell(row=row_idx, column=2,
                value=f"{p.person.last_name}, {p.person.first_name}" if p.person else "")
        ws.cell(row=row_idx, column=3, value=float(p.amount))
        ws.cell(row=row_idx, column=4, value=p.method)
        ws.cell(row=row_idx, column=5, value="Yes" if p.is_refund else "No")
        ws.cell(row=row_idx, column=6, value=p.square_transaction_id)
        ws.cell(row=row_idx, column=7, value=p.check_number)
        ws.cell(row=row_idx, column=8, value=p.reference_note)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# QuickBooks IIF Export
# ---------------------------------------------------------------------------

def export_quickbooks_iif(org, start_date=None, end_date=None):
    """Export payments as QuickBooks IIF (tab-delimited journal entries).

    IIF format: tab-delimited text with specific header rows.
    Returns string content.
    """
    payments = _get_payments(org, start_date, end_date)

    lines = []
    # IIF header
    lines.append("!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO")
    lines.append("!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO")
    lines.append("!ENDTRNS")

    for p in payments:
        person_name = (
            f"{p.person.last_name}, {p.person.first_name}" if p.person else "Unknown"
        )
        date_str = p.paid_at.strftime("%m/%d/%Y")
        amount = float(p.amount)

        if p.is_refund:
            trns_type = "JOURNAL"
            # Debit refund expense, credit cash/bank
            lines.append(
                f"TRNS\t{p.pk}\t{trns_type}\t{date_str}\t"
                f"Registration Refunds\t{person_name}\t{amount}\t"
                f"Refund: {p.refund_reason}"
            )
            lines.append(
                f"SPL\t{p.pk}\t{trns_type}\t{date_str}\t"
                f"Cash/Bank\t{person_name}\t{-amount}\t"
                f"Refund: {p.refund_reason}"
            )
        else:
            trns_type = "DEPOSIT" if p.method in ("check", "cash") else "JOURNAL"
            # Debit cash/bank, credit registration income
            memo = f"{p.method}: {p.reference_note}" if p.reference_note else p.method
            lines.append(
                f"TRNS\t{p.pk}\t{trns_type}\t{date_str}\t"
                f"Cash/Bank\t{person_name}\t{amount}\t{memo}"
            )
            lines.append(
                f"SPL\t{p.pk}\t{trns_type}\t{date_str}\t"
                f"Registration Income\t{person_name}\t{-amount}\t{memo}"
            )

            # Speaker fee memo splits (balanced: debit Speaker Expenses, credit Registration Income)
            for reg in p.registrations.select_related("event").all():
                speakers = reg.event.eventspeaker_set.filter(
                    fee__isnull=False, fee__gt=0,
                )
                for spk in speakers:
                    fee = float(spk.fee)
                    lines.append(
                        f"SPL\t{p.pk}\t{trns_type}\t{date_str}\t"
                        f"Speaker Expenses\t{spk.person}\t{fee}\t"
                        f"Speaker fee: {reg.event.title}"
                    )
                    lines.append(
                        f"SPL\t{p.pk}\t{trns_type}\t{date_str}\t"
                        f"Registration Income\t{spk.person}\t{-fee}\t"
                        f"Speaker fee offset: {reg.event.title}"
                    )

        lines.append("ENDTRNS")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# QuickBooks QBO Export (OFX-based bank feed)
# ---------------------------------------------------------------------------

def export_quickbooks_qbo(org, start_date=None, end_date=None, account_id="1000"):
    """Export payments as QuickBooks QBO (OFX XML format).

    QBO is OFX-based and used as a bank feed import in QuickBooks.
    Returns XML string.
    """
    payments = _get_payments(org, start_date, end_date)

    # Build OFX document
    ofx = Element("OFX")

    # Signon response
    signon = SubElement(ofx, "SIGNONMSGSRSV1")
    sonrs = SubElement(signon, "SONRS")
    status = SubElement(sonrs, "STATUS")
    SubElement(status, "CODE").text = "0"
    SubElement(status, "SEVERITY").text = "INFO"
    SubElement(sonrs, "DTSERVER").text = datetime.now().strftime("%Y%m%d%H%M%S")
    SubElement(sonrs, "LANGUAGE").text = "ENG"

    # Bank statement
    bankmsgs = SubElement(ofx, "BANKMSGSRSV1")
    stmttrnrs = SubElement(bankmsgs, "STMTTRNRS")
    SubElement(stmttrnrs, "TRNUID").text = "0"
    stmtrs = SubElement(stmttrnrs, "STMTRS")
    SubElement(stmtrs, "CURDEF").text = "USD"

    bankacctfrom = SubElement(stmtrs, "BANKACCTFROM")
    SubElement(bankacctfrom, "BANKID").text = "999999999"
    SubElement(bankacctfrom, "ACCTID").text = account_id
    SubElement(bankacctfrom, "ACCTTYPE").text = "CHECKING"

    banktranlist = SubElement(stmtrs, "BANKTRANLIST")
    if start_date:
        SubElement(banktranlist, "DTSTART").text = start_date.strftime("%Y%m%d")
    if end_date:
        SubElement(banktranlist, "DTEND").text = end_date.strftime("%Y%m%d")

    total = Decimal("0.00")
    for p in payments:
        stmttrn = SubElement(banktranlist, "STMTTRN")
        if p.is_refund:
            SubElement(stmttrn, "TRNTYPE").text = "DEBIT"
            SubElement(stmttrn, "TRNAMT").text = str(-p.amount)
            total -= p.amount
        else:
            SubElement(stmttrn, "TRNTYPE").text = "CREDIT"
            SubElement(stmttrn, "TRNAMT").text = str(p.amount)
            total += p.amount

        SubElement(stmttrn, "DTPOSTED").text = p.paid_at.strftime("%Y%m%d")
        SubElement(stmttrn, "FITID").text = str(p.pk)
        person_name = (
            f"{p.person.last_name}, {p.person.first_name}" if p.person else "Unknown"
        )
        SubElement(stmttrn, "NAME").text = person_name[:32]
        memo = p.method
        if p.check_number:
            memo += f" #{p.check_number}"
        SubElement(stmttrn, "MEMO").text = memo[:255]

    # Ledger balance
    ledgerbal = SubElement(stmtrs, "LEDGERBAL")
    SubElement(ledgerbal, "BALAMT").text = str(total)
    SubElement(ledgerbal, "DTASOF").text = datetime.now().strftime("%Y%m%d")

    return tostring(ofx, encoding="unicode", xml_declaration=True)
