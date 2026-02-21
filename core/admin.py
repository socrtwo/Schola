from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    Attendance,
    AuditLog,
    BundleDefinition,
    BundlePrice,
    DiscountRule,
    Event,
    EventCategory,
    EventGroup,
    EventGroupMembership,
    EventGroupType,
    EventHost,
    EventPrice,
    EventSession,
    EventSpeaker,
    Household,
    Organization,
    Payment,
    Person,
    PersonRole,
    PricingTier,
    RefundPolicy,
    Registration,
    Role,
    Term,
    User,
    Venue,
    WaitlistEntry,
    WorkflowState,
)


# ---------------------------------------------------------------------------
# User (custom)
# ---------------------------------------------------------------------------

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    pass


# ---------------------------------------------------------------------------
# Organization
# ---------------------------------------------------------------------------

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "contact_email", "is_tax_exempt", "created_at")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")


# ---------------------------------------------------------------------------
# Mixin for org-scoped admin
# ---------------------------------------------------------------------------

class OrgScopedMixin:
    """Mixin that adds organization to list_display/filter/search."""

    def get_list_display(self, request):
        base = list(super().get_list_display(request))
        if "organization" not in base:
            base.insert(0, "organization")
        return base

    def get_list_filter(self, request):
        base = list(super().get_list_filter(request))
        if "organization" not in base:
            base.insert(0, "organization")
        return base


# ---------------------------------------------------------------------------
# People & Roles
# ---------------------------------------------------------------------------

class PersonRoleInline(admin.TabularInline):
    model = PersonRole
    extra = 0


@admin.register(Person)
class PersonAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("last_name", "first_name", "email", "is_resident", "organization")
    list_filter = ("organization", "is_resident")
    search_fields = ("first_name", "last_name", "email")
    inlines = [PersonRoleInline]


@admin.register(Household)
class HouseholdAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("name", "organization")
    search_fields = ("name",)


@admin.register(Role)
class RoleAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("name", "slug", "is_builtin", "organization")
    list_filter = ("organization", "is_builtin")


# ---------------------------------------------------------------------------
# Terms & Venues
# ---------------------------------------------------------------------------

@admin.register(Term)
class TermAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("name", "start_date", "end_date", "is_active", "organization")
    list_filter = ("organization", "is_active")


@admin.register(Venue)
class VenueAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("name", "capacity", "organization")
    list_filter = ("organization",)
    search_fields = ("name",)


# ---------------------------------------------------------------------------
# Workflow
# ---------------------------------------------------------------------------

@admin.register(WorkflowState)
class WorkflowStateAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("name", "slug", "position", "organization")
    list_filter = ("organization",)
    ordering = ("organization", "position")


@admin.register(EventCategory)
class EventCategoryAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("name", "slug", "organization")
    list_filter = ("organization",)
    prepopulated_fields = {"slug": ("name",)}


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

class EventSessionInline(admin.TabularInline):
    model = EventSession
    extra = 1


class EventSpeakerInline(admin.TabularInline):
    model = EventSpeaker
    extra = 0


class EventHostInline(admin.TabularInline):
    model = EventHost
    extra = 0


class EventPriceInline(admin.TabularInline):
    model = EventPrice
    extra = 0


@admin.register(Event)
class EventAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = (
        "title", "legacy_id", "term", "category", "venue",
        "lifecycle_state", "capacity", "organization",
    )
    list_filter = ("organization", "term", "category", "lifecycle_state")
    search_fields = ("title", "short_title", "legacy_id")
    inlines = [EventSessionInline, EventSpeakerInline, EventHostInline, EventPriceInline]
    fieldsets = (
        (None, {
            "fields": (
                "organization", "term", "category", "venue", "lifecycle_state",
                "legacy_id", "title", "short_title", "capacity",
            ),
        }),
        ("Content", {
            "fields": (
                "abstract", "nudge_text", "nudge_sequence", "keyword", "phrase",
                "speaker_verb", "intro_text",
            ),
            "classes": ("collapse",),
        }),
        ("Links", {
            "fields": (
                "topic", "topic_link", "speaker_link", "books_link",
                "graphic_link", "vimeo_url", "survey_id",
            ),
            "classes": ("collapse",),
        }),
        ("Gate Condition Flags", {
            "fields": ("has_abstract", "has_bio", "has_graphic"),
        }),
    )


# ---------------------------------------------------------------------------
# Event Grouping
# ---------------------------------------------------------------------------

class EventGroupMembershipInline(admin.TabularInline):
    model = EventGroupMembership
    extra = 1


@admin.register(EventGroupType)
class EventGroupTypeAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("name", "slug", "organization")
    list_filter = ("organization",)


@admin.register(EventGroup)
class EventGroupAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("name", "group_type", "position", "organization")
    list_filter = ("organization", "group_type")
    inlines = [EventGroupMembershipInline]


# ---------------------------------------------------------------------------
# Pricing & Bundles
# ---------------------------------------------------------------------------

@admin.register(PricingTier)
class PricingTierAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("name", "slug", "is_default", "organization")
    list_filter = ("organization", "is_default")


class BundlePriceInline(admin.TabularInline):
    model = BundlePrice
    extra = 0


@admin.register(BundleDefinition)
class BundleDefinitionAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("name", "slug", "term", "selection_mode", "is_active", "organization")
    list_filter = ("organization", "term", "selection_mode", "is_active")
    inlines = [BundlePriceInline]
    filter_horizontal = ("events",)


@admin.register(DiscountRule)
class DiscountRuleAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("name", "discount_type", "discount_value", "applies_to", "is_active", "organization")
    list_filter = ("organization", "discount_type", "applies_to", "is_active")


# ---------------------------------------------------------------------------
# Refund Policy
# ---------------------------------------------------------------------------

@admin.register(RefundPolicy)
class RefundPolicyAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = (
        "name", "is_default", "full_refund_before_days",
        "partial_refund_percent", "organization",
    )
    list_filter = ("organization", "is_default")


# ---------------------------------------------------------------------------
# Registration & Payments
# ---------------------------------------------------------------------------

class AttendanceInline(admin.TabularInline):
    model = Attendance
    extra = 0


@admin.register(Registration)
class RegistrationAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = (
        "person", "event", "term", "tier", "status",
        "amount_charged", "amount_refunded", "registered_at", "organization",
    )
    list_filter = ("organization", "status", "term", "tier")
    search_fields = ("person__first_name", "person__last_name", "event__title")
    inlines = [AttendanceInline]
    raw_id_fields = ("person", "event")


@admin.register(WaitlistEntry)
class WaitlistEntryAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = ("registration", "position", "notified_at", "expires_at", "organization")
    list_filter = ("organization",)


@admin.register(Payment)
class PaymentAdmin(OrgScopedMixin, admin.ModelAdmin):
    list_display = (
        "person", "amount", "method", "paid_at", "is_refund", "organization",
    )
    list_filter = ("organization", "method", "is_refund")
    search_fields = ("person__first_name", "person__last_name", "square_transaction_id")
    raw_id_fields = ("person",)
    filter_horizontal = ("registrations",)


# ---------------------------------------------------------------------------
# Audit Log
# ---------------------------------------------------------------------------

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "model_name", "object_id", "user", "timestamp", "organization")
    list_filter = ("organization", "action", "model_name")
    search_fields = ("object_id",)
    readonly_fields = (
        "organization", "user", "action", "model_name",
        "object_id", "changes", "timestamp", "ip_address",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
