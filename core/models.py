from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models

from .managers import OrgScopedManager


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class TimestampMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class OrgScoped(TimestampMixin):
    """Abstract base for all organization-scoped models."""
    organization = models.ForeignKey(
        "Organization",
        on_delete=models.CASCADE,
        related_name="%(class)ss",
    )
    objects = OrgScopedManager()

    class Meta:
        abstract = True


# ---------------------------------------------------------------------------
# Organization
# ---------------------------------------------------------------------------

class Organization(TimestampMixin):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    logo_url = models.URLField(max_length=500, blank=True)
    timezone = models.CharField(max_length=50, default="America/New_York")

    # Financials
    is_tax_exempt = models.BooleanField(default=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    processing_fee_percent = models.DecimalField(
        max_digits=5, decimal_places=4, default=0,
        help_text="Processing fee as decimal (e.g., 0.029 for 2.9%)",
    )
    processing_fee_fixed = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text="Fixed processing fee in dollars (e.g., 0.30)",
    )

    # Square
    square_app_id = models.CharField(max_length=200, blank=True)
    square_access_token = models.CharField(max_length=200, blank=True)
    square_location_id = models.CharField(max_length=200, blank=True)
    square_environment = models.CharField(
        max_length=20, default="sandbox",
        choices=[("sandbox", "Sandbox"), ("production", "Production")],
    )

    # Email provider
    email_provider = models.CharField(
        max_length=20,
        default="smtp",
        choices=[("smtp", "SMTP"), ("mailgun", "Mailgun"), ("sendgrid", "SendGrid")],
    )
    email_config = models.JSONField(
        default=dict, blank=True,
        help_text="Provider-specific config (host, api_key, domain, etc.)",
    )

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Accounts & People
# ---------------------------------------------------------------------------

class User(AbstractUser):
    """Platform user (authentication). May be linked to a Person in an org."""
    pass


class Household(OrgScoped):
    name = models.CharField(max_length=255, help_text="e.g., 'The Smiths'")

    def __str__(self):
        return self.name


class Person(OrgScoped):
    """A person known to an organization. May or may not have a User account."""
    user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="person_profiles",
    )
    household = models.ForeignKey(
        Household, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="members",
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    cell_phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    unit_number = models.CharField(max_length=50, blank=True)
    building = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    is_resident = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "email"],
                condition=~models.Q(email=""),
                name="unique_person_email_per_org",
            ),
        ]
        indexes = [
            models.Index(fields=["organization", "last_name", "first_name"]),
        ]

    def __str__(self):
        return f"{self.last_name}, {self.first_name}"


# ---------------------------------------------------------------------------
# Roles & Permissions
# ---------------------------------------------------------------------------

class Role(OrgScoped):
    BUILTIN_ROLES = [
        ("admin", "Admin"),
        ("catalog_editor", "Catalog Editor"),
        ("host", "Host"),
        ("instructor", "Instructor"),
        ("registrar", "Registrar"),
        ("assistant_registrar", "Assistant Registrar"),
        ("treasurer", "Treasurer"),
        ("assistant_treasurer", "Assistant Treasurer"),
    ]
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    is_builtin = models.BooleanField(default=False)
    permissions = models.JSONField(
        default=list, blank=True,
        help_text='List of permission strings, e.g. ["events.edit", "catalog.publish"]',
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "slug"],
                name="unique_role_slug_per_org",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.organization.slug})"


class PersonRole(OrgScoped):
    """Assignment of a role to a person within an org."""
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="role_assignments")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="assignments")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "person", "role"],
                name="unique_person_role",
            ),
        ]


# ---------------------------------------------------------------------------
# Audit Log
# ---------------------------------------------------------------------------

class AuditLog(models.Model):
    organization = models.ForeignKey(
        Organization, null=True, on_delete=models.SET_NULL,
    )
    user = models.ForeignKey(
        User, null=True, on_delete=models.SET_NULL,
    )
    action = models.CharField(max_length=50)  # create, update, delete, state_change
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    changes = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["organization", "timestamp"]),
            models.Index(fields=["model_name", "object_id"]),
        ]

    def __str__(self):
        return f"{self.action} {self.model_name}#{self.object_id} at {self.timestamp}"


# ---------------------------------------------------------------------------
# Terms & Venues
# ---------------------------------------------------------------------------

class Term(OrgScoped):
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "name"],
                name="unique_term_name_per_org",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.organization.slug})"


class Venue(OrgScoped):
    name = models.CharField(max_length=200)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Event Category & Workflow
# ---------------------------------------------------------------------------

class EventCategory(OrgScoped):
    """e.g., 'Evening Lecture', 'Evening Performance', 'Daytime Class'"""
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=100)

    class Meta:
        verbose_name_plural = "event categories"
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "slug"],
                name="unique_category_slug_per_org",
            ),
        ]

    def __str__(self):
        return self.name


class WorkflowState(OrgScoped):
    """Configurable lifecycle state for events within an org."""
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    position = models.PositiveIntegerField(default=0)
    gate_conditions = models.JSONField(
        default=dict, blank=True,
        help_text="JSON dict of field conditions required to enter this state.",
    )

    class Meta:
        ordering = ["organization", "position"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "slug"],
                name="unique_workflow_slug_per_org",
            ),
        ]

    def __str__(self):
        return f"{self.name} (pos {self.position})"


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

class Event(OrgScoped):
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name="events")
    category = models.ForeignKey(
        EventCategory, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="events",
    )
    venue = models.ForeignKey(
        Venue, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="events",
    )
    lifecycle_state = models.ForeignKey(
        WorkflowState, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="events",
    )

    legacy_id = models.CharField(max_length=20, blank=True, help_text="e.g., '101', '251'")
    title = models.CharField(max_length=500)
    short_title = models.CharField(max_length=100, blank=True)
    abstract = models.TextField(blank=True)
    nudge_text = models.TextField(blank=True)
    nudge_sequence = models.CharField(max_length=20, blank=True, help_text='"1st", "2nd", "skip"')
    keyword = models.CharField(max_length=50, blank=True)
    phrase = models.CharField(max_length=100, blank=True)
    speaker_verb = models.CharField(max_length=20, default="is", help_text='"is" or "are"')
    intro_text = models.TextField(blank=True, help_text="Dean's spoken introduction")

    # Links
    topic = models.CharField(max_length=200, blank=True)
    topic_link = models.URLField(max_length=500, blank=True)
    speaker_link = models.URLField(max_length=500, blank=True)
    books_link = models.URLField(max_length=500, blank=True)
    graphic_link = models.URLField(max_length=500, blank=True)
    vimeo_url = models.URLField(max_length=500, blank=True)
    survey_id = models.CharField(max_length=100, blank=True)

    # Gate-condition flags
    has_abstract = models.BooleanField(default=False)
    has_bio = models.BooleanField(default=False)
    has_graphic = models.BooleanField(default=False)

    capacity = models.PositiveIntegerField(null=True, blank=True)

    speakers = models.ManyToManyField(Person, through="EventSpeaker", related_name="speaking_events")
    hosts = models.ManyToManyField(Person, through="EventHost", related_name="hosting_events")

    class Meta:
        indexes = [
            models.Index(fields=["organization", "term"]),
            models.Index(fields=["organization", "lifecycle_state"]),
        ]

    def __str__(self):
        return f"[{self.legacy_id or self.pk}] {self.short_title or self.title}"

    def check_gate_conditions(self, target_state):
        """Validate that this event meets all gate conditions for target_state."""
        if not target_state or not target_state.gate_conditions:
            return True, []
        errors = []
        for field, expected in target_state.gate_conditions.items():
            if "__isnull" in field:
                base_field = field.replace("__isnull", "")
                actual = getattr(self, base_field, None) is None
                if actual != expected:
                    errors.append(f"{base_field} {'must' if expected else 'must not'} be null")
            else:
                actual = getattr(self, field, None)
                if actual != expected:
                    errors.append(f"{field} must be {expected}, got {actual}")
        return len(errors) == 0, errors

    def transition_to(self, target_state):
        """Attempt to transition to target_state. Raises ValidationError if gates fail."""
        ok, errors = self.check_gate_conditions(target_state)
        if not ok:
            raise ValidationError(
                f"Cannot transition to {target_state.name}: {'; '.join(errors)}"
            )
        self.lifecycle_state = target_state
        self.save(update_fields=["lifecycle_state", "updated_at"])


class EventSession(OrgScoped):
    """A single date/time occurrence of an event. Supports multi-session events."""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="sessions")
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    day_of_week = models.CharField(max_length=15, blank=True)

    class Meta:
        ordering = ["date", "start_time"]

    def __str__(self):
        return f"{self.event} — {self.date}"


class EventSpeaker(OrgScoped):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, help_text="Speaker bio for this event (< 250 words)")
    fee = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text="Amount paid TO the speaker (expense)",
    )
    check_payable_to = models.CharField(max_length=200, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event", "person"],
                name="unique_speaker_per_event",
            ),
        ]

    def __str__(self):
        return f"{self.person} speaks at {self.event}"


class EventHost(OrgScoped):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    person = models.ForeignKey(Person, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event", "person"],
                name="unique_host_per_event",
            ),
        ]


# ---------------------------------------------------------------------------
# Event Grouping (replaces x-columns)
# ---------------------------------------------------------------------------

class EventGroupType(OrgScoped):
    """Types of grouping: 'nudge', 'flyer', 'catalog_section', etc."""
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "slug"],
                name="unique_group_type_slug_per_org",
            ),
        ]

    def __str__(self):
        return self.name


class EventGroup(OrgScoped):
    """A named group of events (e.g., 'Week 1 Nudge: Mon 9/8 + Thu 9/11')."""
    group_type = models.ForeignKey(EventGroupType, on_delete=models.CASCADE, related_name="groups")
    name = models.CharField(max_length=200, blank=True)
    position = models.PositiveIntegerField(default=0, help_text="Ordering within the semester")

    class Meta:
        ordering = ["position"]

    def __str__(self):
        return self.name or f"Group #{self.pk}"


class EventGroupMembership(models.Model):
    group = models.ForeignKey(EventGroup, on_delete=models.CASCADE, related_name="memberships")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="group_memberships")
    position = models.PositiveIntegerField(default=0, help_text="Order within group")

    class Meta:
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(
                fields=["group", "event"],
                name="unique_event_in_group",
            ),
        ]


# ---------------------------------------------------------------------------
# Pricing
# ---------------------------------------------------------------------------

class PricingTier(OrgScoped):
    """e.g., Resident, Non-resident, Scholarship, Comped."""
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    is_default = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "slug"],
                name="unique_tier_slug_per_org",
            ),
        ]

    def __str__(self):
        return self.name


class EventPrice(OrgScoped):
    """Price for a specific event + tier + timing combination."""
    TIMING_CHOICES = [
        ("pre", "Pre-registration"),
        ("walk", "Walk-in"),
    ]
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="prices")
    tier = models.ForeignKey(PricingTier, on_delete=models.CASCADE, related_name="event_prices")
    timing = models.CharField(max_length=10, choices=TIMING_CHOICES, default="pre")
    amount = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event", "tier", "timing"],
                name="unique_price_per_event_tier_timing",
            ),
        ]

    def __str__(self):
        return f"{self.event} / {self.tier} / {self.timing}: ${self.amount}"


# ---------------------------------------------------------------------------
# Bundles & Discounts
# ---------------------------------------------------------------------------

class BundleDefinition(OrgScoped):
    """Defines a purchasable bundle of events."""
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=100)
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name="bundles")
    is_active = models.BooleanField(default=True)
    selection_mode = models.CharField(
        max_length=30,
        choices=[
            ("category", "All events in category"),
            ("tag", "All events with tag"),
            ("manual", "Manually selected events"),
            ("pick_n", "Pick any N events"),
        ],
        default="category",
    )
    category_filter = models.ForeignKey(
        EventCategory, null=True, blank=True, on_delete=models.SET_NULL,
    )
    pick_n_count = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="For pick_n mode: how many events the student selects",
    )
    events = models.ManyToManyField(Event, blank=True, related_name="bundle_definitions")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "slug", "term"],
                name="unique_bundle_slug_per_org_term",
            ),
        ]

    def get_eligible_events(self):
        """Return queryset of events eligible for this bundle."""
        if self.selection_mode == "category" and self.category_filter:
            return Event.objects.filter(
                organization=self.organization,
                term=self.term,
                category=self.category_filter,
            )
        elif self.selection_mode in ("manual", "pick_n"):
            return self.events.all()
        return Event.objects.none()

    def __str__(self):
        return self.name


class BundlePrice(OrgScoped):
    """Price for a bundle + tier combination."""
    bundle = models.ForeignKey(BundleDefinition, on_delete=models.CASCADE, related_name="prices")
    tier = models.ForeignKey(PricingTier, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["bundle", "tier"],
                name="unique_bundle_price_per_tier",
            ),
        ]


class DiscountRule(OrgScoped):
    """Configurable discount rules."""
    name = models.CharField(max_length=200)
    discount_type = models.CharField(
        max_length=20,
        choices=[("percent", "Percentage"), ("fixed", "Fixed Amount")],
    )
    discount_value = models.DecimalField(max_digits=8, decimal_places=2)
    applies_to = models.CharField(
        max_length=30,
        choices=[
            ("bundle", "Bundle purchases"),
            ("tier", "Specific pricing tier"),
            ("early", "Early registration"),
            ("promo", "Promo code"),
        ],
    )
    tier = models.ForeignKey(PricingTier, null=True, blank=True, on_delete=models.SET_NULL)
    bundle = models.ForeignKey(BundleDefinition, null=True, blank=True, on_delete=models.SET_NULL)
    promo_code = models.CharField(max_length=50, blank=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Refund Policy
# ---------------------------------------------------------------------------

class RefundPolicy(OrgScoped):
    """Configurable refund policies per org."""
    name = models.CharField(max_length=200)
    is_default = models.BooleanField(default=False)
    full_refund_before_days = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Full refund if cancelled this many days before event",
    )
    partial_refund_percent = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Partial refund percentage after full-refund window",
    )
    admin_only_after_days = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="After this many days before event, only admin can process refund",
    )
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "refund policies"

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Registration & Payments
# ---------------------------------------------------------------------------

class Registration(OrgScoped):
    STATUS_CHOICES = [
        ("registered", "Registered"),
        ("waitlisted", "Waitlisted"),
        ("cancelled", "Cancelled"),
        ("dropped", "Dropped"),
    ]
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="registrations")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="registrations")
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name="registrations")
    tier = models.ForeignKey(PricingTier, null=True, blank=True, on_delete=models.SET_NULL)
    bundle = models.ForeignKey(
        BundleDefinition, null=True, blank=True, on_delete=models.SET_NULL,
        help_text="If registered as part of a bundle",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="registered")
    registered_at = models.DateTimeField(auto_now_add=True)
    amount_charged = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    amount_refunded = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["person", "event"],
                name="unique_registration_per_person_event",
            ),
        ]
        indexes = [
            models.Index(fields=["organization", "event", "status"]),
        ]

    def __str__(self):
        return f"{self.person} → {self.event} ({self.status})"

    @property
    def is_active(self):
        return self.status in ("registered", "waitlisted")


class WaitlistEntry(OrgScoped):
    registration = models.OneToOneField(
        Registration, on_delete=models.CASCADE, related_name="waitlist_entry",
    )
    position = models.PositiveIntegerField()
    notified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["position"]

    def __str__(self):
        return f"Waitlist #{self.position} for {self.registration}"


class Payment(OrgScoped):
    METHOD_CHOICES = [
        ("square_checkout", "Square Hosted Checkout"),
        ("square_api", "Square Direct API"),
        ("stripe_checkout", "Stripe Checkout"),
        ("stripe_api", "Stripe Direct API"),
        ("paypal", "PayPal"),
        ("check", "Check"),
        ("cash", "Cash"),
        ("imported", "Imported from CSV"),
        ("other", "Other"),
    ]
    person = models.ForeignKey(
        Person, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="payments",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=30, choices=METHOD_CHOICES)
    processor_transaction_id = models.CharField(
        max_length=200, blank=True, db_index=True,
        help_text="Transaction ID from the payment processor",
    )
    processor_payment_id = models.CharField(max_length=200, blank=True)
    # Legacy Square-specific fields kept as aliases
    square_transaction_id = models.CharField(max_length=200, blank=True, db_index=True)
    square_payment_id = models.CharField(max_length=200, blank=True)
    check_number = models.CharField(max_length=50, blank=True)
    reference_note = models.TextField(blank=True)
    paid_at = models.DateTimeField()
    is_refund = models.BooleanField(default=False)
    refund_reason = models.TextField(blank=True)

    registrations = models.ManyToManyField(
        Registration, blank=True, related_name="payments",
    )

    class Meta:
        indexes = [
            models.Index(fields=["organization", "square_transaction_id"]),
            models.Index(fields=["organization", "processor_transaction_id"]),
        ]

    def __str__(self):
        prefix = "Refund" if self.is_refund else "Payment"
        person_str = str(self.person) if self.person else "Unknown"
        return f"{prefix} ${self.amount} by {person_str} via {self.method}"


class Attendance(OrgScoped):
    registration = models.ForeignKey(
        Registration, on_delete=models.CASCADE, related_name="attendance_records",
    )
    session = models.ForeignKey(
        EventSession, on_delete=models.CASCADE, related_name="attendance_records",
    )
    attended = models.BooleanField(default=False)
    notes = models.CharField(max_length=200, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["registration", "session"],
                name="unique_attendance_per_reg_session",
            ),
        ]


# ---------------------------------------------------------------------------
# Payment Processors
# ---------------------------------------------------------------------------

class PaymentProcessor(OrgScoped):
    """Configurable payment processor per organization.

    Supports multiple processors: Square, Stripe, PayPal, or custom.
    Each org can have multiple processors (e.g., Square for online, cash for
    in-person) but only one active primary.
    """
    PROCESSOR_CHOICES = [
        ("square", "Square"),
        ("stripe", "Stripe"),
        ("paypal", "PayPal"),
        ("custom", "Custom"),
    ]
    MODE_CHOICES = [
        ("sandbox", "Sandbox / Test"),
        ("production", "Production / Live"),
    ]

    name = models.CharField(max_length=200, help_text="Display name, e.g. 'Square Online'")
    slug = models.SlugField(max_length=100)
    processor_type = models.CharField(max_length=20, choices=PROCESSOR_CHOICES)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default="sandbox")
    is_active = models.BooleanField(default=True)
    is_primary = models.BooleanField(
        default=False,
        help_text="Primary processor used for new online payments",
    )

    # Credentials (stored as JSON for flexibility across processors)
    credentials = models.JSONField(
        default=dict, blank=True,
        help_text=(
            "Processor-specific credentials. "
            "Square: {app_id, access_token, location_id}. "
            "Stripe: {publishable_key, secret_key, webhook_secret}. "
            "PayPal: {client_id, client_secret}. "
            "Custom: {api_url, api_key, ...}."
        ),
    )

    # Processor-specific config (non-credential settings)
    config = models.JSONField(
        default=dict, blank=True,
        help_text=(
            "Processor-specific settings. "
            "E.g., {currency: 'USD', capture_method: 'automatic', "
            "webhook_url: '...', return_url: '...'}."
        ),
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "slug"],
                name="unique_processor_slug_per_org",
            ),
        ]
        ordering = ["-is_primary", "name"]

    def __str__(self):
        status = "active" if self.is_active else "inactive"
        primary = " [PRIMARY]" if self.is_primary else ""
        return f"{self.name} ({self.get_processor_type_display()}, {self.mode}){primary} [{status}]"
