"""Business logic for registration, pricing, waitlist, and refunds.

All functions take explicit parameters (no request objects) so they can be
used from views, admin actions, management commands, and tests.
"""
import datetime
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .models import (
    BundleDefinition,
    BundlePrice,
    DiscountRule,
    Event,
    EventPrice,
    Payment,
    PricingTier,
    RefundPolicy,
    Registration,
    WaitlistEntry,
)


# ---------------------------------------------------------------------------
# Pricing
# ---------------------------------------------------------------------------

def get_event_price(event, tier, timing="pre"):
    """Return the EventPrice amount for an event+tier+timing, or None."""
    try:
        ep = EventPrice.objects.get(event=event, tier=tier, timing=timing)
        return ep.amount
    except EventPrice.DoesNotExist:
        return None


def get_bundle_price(bundle, tier):
    """Return the BundlePrice amount for a bundle+tier, or None."""
    try:
        bp = BundlePrice.objects.get(bundle=bundle, tier=tier)
        return bp.amount
    except BundlePrice.DoesNotExist:
        return None


def calculate_discount(amount, discount_rule):
    """Apply a DiscountRule to a base amount. Returns the discount amount."""
    if not discount_rule or not discount_rule.is_active:
        return Decimal("0.00")
    now = timezone.now()
    if discount_rule.valid_from and now < discount_rule.valid_from:
        return Decimal("0.00")
    if discount_rule.valid_until and now > discount_rule.valid_until:
        return Decimal("0.00")
    if discount_rule.discount_type == "percent":
        return (amount * discount_rule.discount_value / Decimal("100")).quantize(
            Decimal("0.01")
        )
    elif discount_rule.discount_type == "fixed":
        return min(discount_rule.discount_value, amount)
    return Decimal("0.00")


def find_applicable_discounts(org, event=None, bundle=None, tier=None, promo_code=None):
    """Find active discount rules that apply to the given context."""
    qs = DiscountRule.objects.filter(organization=org, is_active=True)
    now = timezone.now()
    qs = qs.filter(
        models_q_valid_from_or_null(now),
    )
    results = []
    for rule in qs:
        if rule.valid_from and now < rule.valid_from:
            continue
        if rule.valid_until and now > rule.valid_until:
            continue
        if rule.applies_to == "bundle" and bundle and rule.bundle_id in (bundle.pk, None):
            results.append(rule)
        elif rule.applies_to == "tier" and tier and rule.tier_id in (tier.pk, None):
            results.append(rule)
        elif rule.applies_to == "early":
            results.append(rule)
        elif rule.applies_to == "promo" and promo_code and rule.promo_code == promo_code:
            results.append(rule)
    return results


def models_q_valid_from_or_null(now):
    """Helper for Q filter on valid_from."""
    from django.db.models import Q
    return Q(valid_from__isnull=True) | Q(valid_from__lte=now)


def calculate_registration_price(event, tier, timing="pre", promo_code=None):
    """Calculate final price for a single event registration.

    Returns (base_price, discount_amount, final_price).
    """
    base_price = get_event_price(event, tier, timing)
    if base_price is None:
        raise ValidationError(
            f"No price defined for {event} / {tier.name} / {timing}"
        )
    discount_amount = Decimal("0.00")
    applicable = DiscountRule.objects.filter(
        organization=event.organization, is_active=True,
    )
    now = timezone.now()
    for rule in applicable:
        if rule.valid_from and now < rule.valid_from:
            continue
        if rule.valid_until and now > rule.valid_until:
            continue
        if rule.applies_to == "tier" and rule.tier_id == tier.pk:
            discount_amount += calculate_discount(base_price, rule)
        elif rule.applies_to == "promo" and promo_code and rule.promo_code == promo_code:
            discount_amount += calculate_discount(base_price, rule)
        elif rule.applies_to == "early":
            discount_amount += calculate_discount(base_price, rule)
    discount_amount = min(discount_amount, base_price)
    final_price = base_price - discount_amount
    return base_price, discount_amount, final_price


def calculate_bundle_price(bundle, tier, promo_code=None):
    """Calculate final price for a bundle purchase.

    Returns (base_price, discount_amount, final_price).
    """
    base_price = get_bundle_price(bundle, tier)
    if base_price is None:
        raise ValidationError(
            f"No price defined for bundle {bundle.name} / {tier.name}"
        )
    discount_amount = Decimal("0.00")
    applicable = DiscountRule.objects.filter(
        organization=bundle.organization, is_active=True,
    )
    now = timezone.now()
    for rule in applicable:
        if rule.valid_from and now < rule.valid_from:
            continue
        if rule.valid_until and now > rule.valid_until:
            continue
        if rule.applies_to == "bundle" and rule.bundle_id in (bundle.pk, None):
            discount_amount += calculate_discount(base_price, rule)
        elif rule.applies_to == "promo" and promo_code and rule.promo_code == promo_code:
            discount_amount += calculate_discount(base_price, rule)
    discount_amount = min(discount_amount, base_price)
    final_price = base_price - discount_amount
    return base_price, discount_amount, final_price


# ---------------------------------------------------------------------------
# Capacity & Waitlist
# ---------------------------------------------------------------------------

def active_registration_count(event):
    """Count registrations with status 'registered' for an event."""
    return event.registrations.filter(status="registered").count()


def is_event_full(event):
    """Return True if the event is at or over capacity."""
    if event.capacity is None:
        return False
    return active_registration_count(event) >= event.capacity


def next_waitlist_position(event):
    """Return the next waitlist position for an event."""
    last = (
        WaitlistEntry.objects
        .filter(registration__event=event)
        .order_by("-position")
        .first()
    )
    return (last.position + 1) if last else 1


@transaction.atomic
def register_person(org, person, event, term, tier, timing="pre",
                    promo_code=None, amount_override=None, bundle=None,
                    allow_waitlist=True):
    """Register a person for an event, handling capacity and waitlist.

    Returns (registration, waitlist_entry_or_none).
    Raises ValidationError if registration is not possible.
    """
    # Check for existing registration
    existing = Registration.objects.filter(person=person, event=event).first()
    if existing:
        if existing.status in ("registered", "waitlisted"):
            raise ValidationError(
                f"{person} is already {existing.status} for {event}"
            )
        # If previously cancelled/dropped, allow re-registration
        existing.delete()

    # Determine amount
    if amount_override is not None:
        amount = amount_override
    elif bundle:
        # Bundle registrations: individual events are charged $0 (bundle price is separate)
        amount = Decimal("0.00")
    else:
        _base, _disc, amount = calculate_registration_price(event, tier, timing, promo_code)

    # Determine status based on capacity
    if is_event_full(event) and event.capacity is not None:
        if not allow_waitlist:
            raise ValidationError(f"{event} is at capacity ({event.capacity})")
        status = "waitlisted"
    else:
        status = "registered"

    reg = Registration.objects.create(
        organization=org,
        person=person,
        event=event,
        term=term,
        tier=tier,
        bundle=bundle,
        status=status,
        amount_charged=amount,
    )

    waitlist_entry = None
    if status == "waitlisted":
        position = next_waitlist_position(event)
        waitlist_entry = WaitlistEntry.objects.create(
            organization=org,
            registration=reg,
            position=position,
        )

    return reg, waitlist_entry


@transaction.atomic
def cancel_registration(registration, cancelled_by_admin=False):
    """Cancel a registration. If waitlisted people exist, promote the first one.

    Returns (cancelled_registration, promoted_registration_or_none).
    """
    if registration.status == "cancelled":
        raise ValidationError("Registration is already cancelled")

    was_registered = registration.status == "registered"
    registration.status = "cancelled"
    registration.save(update_fields=["status", "updated_at"])

    # Remove waitlist entry if exists
    WaitlistEntry.objects.filter(registration=registration).delete()

    # Promote from waitlist if a registered spot was freed
    promoted = None
    if was_registered:
        promoted = promote_from_waitlist(registration.event)

    return registration, promoted


@transaction.atomic
def promote_from_waitlist(event):
    """Promote the first waitlisted person for an event.

    Returns the promoted Registration or None.
    """
    if is_event_full(event):
        return None

    next_entry = (
        WaitlistEntry.objects
        .filter(registration__event=event, registration__status="waitlisted")
        .order_by("position")
        .select_related("registration")
        .first()
    )
    if not next_entry:
        return None

    reg = next_entry.registration
    reg.status = "registered"
    reg.save(update_fields=["status", "updated_at"])
    next_entry.delete()
    return reg


@transaction.atomic
def register_bundle(org, person, bundle, term, tier, timing="pre", promo_code=None):
    """Register a person for all events in a bundle.

    Returns (registrations_list, bundle_amount).
    Raises ValidationError if any event is full and no waitlist.
    """
    events = bundle.get_eligible_events()
    if not events.exists():
        raise ValidationError(f"Bundle {bundle.name} has no eligible events")

    _base, _disc, bundle_amount = calculate_bundle_price(bundle, tier, promo_code)

    registrations = []
    for event in events:
        reg, _ = register_person(
            org=org, person=person, event=event, term=term,
            tier=tier, timing=timing, amount_override=Decimal("0.00"),
            bundle=bundle, allow_waitlist=True,
        )
        registrations.append(reg)

    return registrations, bundle_amount


# ---------------------------------------------------------------------------
# Refunds
# ---------------------------------------------------------------------------

def get_refund_policy(org, event=None):
    """Get the refund policy for an org (or event-specific override in future)."""
    return RefundPolicy.objects.filter(
        organization=org, is_default=True,
    ).first()


def calculate_refund(registration, reference_date=None):
    """Calculate refund amount based on the org's refund policy.

    Returns (refund_amount, refund_type) where refund_type is
    'full', 'partial', 'admin_only', or 'none'.
    """
    policy = get_refund_policy(registration.organization)
    if not policy:
        return registration.amount_charged, "full"

    if reference_date is None:
        reference_date = datetime.date.today()

    # Find earliest session date for the event
    first_session = registration.event.sessions.order_by("date").first()
    if not first_session:
        return registration.amount_charged, "full"

    days_before = (first_session.date - reference_date).days

    if policy.full_refund_before_days is not None and days_before >= policy.full_refund_before_days:
        return registration.amount_charged, "full"

    if policy.admin_only_after_days is not None and days_before < policy.admin_only_after_days:
        return Decimal("0.00"), "admin_only"

    if policy.partial_refund_percent is not None:
        refund = (
            registration.amount_charged * policy.partial_refund_percent / Decimal("100")
        ).quantize(Decimal("0.01"))
        return refund, "partial"

    return Decimal("0.00"), "none"


@transaction.atomic
def process_refund(registration, amount=None, reason="", admin_override=False,
                   reference_date=None):
    """Process a refund for a registration.

    If amount is None, calculates based on refund policy.
    Returns (refund_amount, refund_type, payment_or_none).
    Raises ValidationError if refund not allowed.
    """
    if registration.status != "cancelled":
        raise ValidationError("Registration must be cancelled before refunding")

    if registration.amount_charged == 0:
        return Decimal("0.00"), "none", None

    already_refunded = registration.amount_refunded
    max_refundable = registration.amount_charged - already_refunded
    if max_refundable <= 0:
        raise ValidationError("Registration has already been fully refunded")

    if amount is not None:
        if amount > max_refundable:
            raise ValidationError(
                f"Refund amount ${amount} exceeds refundable balance ${max_refundable}"
            )
        refund_amount = amount
        refund_type = "manual"
    else:
        refund_amount, refund_type = calculate_refund(registration, reference_date)

    if refund_type == "admin_only" and not admin_override:
        raise ValidationError(
            "This refund requires admin approval (event is within admin-only window)"
        )

    if refund_amount <= 0:
        return Decimal("0.00"), refund_type, None

    refund_amount = min(refund_amount, max_refundable)

    registration.amount_refunded += refund_amount
    registration.save(update_fields=["amount_refunded", "updated_at"])

    payment = Payment.objects.create(
        organization=registration.organization,
        person=registration.person,
        amount=refund_amount,
        method="check",  # default; caller can update
        paid_at=timezone.now(),
        is_refund=True,
        refund_reason=reason,
    )
    payment.registrations.add(registration)

    return refund_amount, refund_type, payment


# ---------------------------------------------------------------------------
# Offline Payments
# ---------------------------------------------------------------------------

@transaction.atomic
def record_offline_payment(org, person, amount, method, registrations=None,
                           check_number="", reference_note="", paid_at=None):
    """Record an offline (check/cash) payment.

    Returns the created Payment.
    """
    if method not in ("check", "cash"):
        raise ValidationError(f"Offline payment method must be 'check' or 'cash', got '{method}'")

    if paid_at is None:
        paid_at = timezone.now()

    payment = Payment.objects.create(
        organization=org,
        person=person,
        amount=amount,
        method=method,
        check_number=check_number,
        reference_note=reference_note,
        paid_at=paid_at,
    )
    if registrations:
        payment.registrations.set(registrations)

    return payment


@transaction.atomic
def reconcile_payment(payment, registrations):
    """Link a payment to specific registrations (for reconciliation)."""
    payment.registrations.set(registrations)
    return payment
