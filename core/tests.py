import datetime
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from core.models import (
    Attendance,
    BundleDefinition,
    Event,
    EventCategory,
    EventPrice,
    EventSession,
    Organization,
    Person,
    PricingTier,
    Registration,
    Term,
    Venue,
    WorkflowState,
)


class OrgFactory:
    """Helper to create test orgs and related objects."""

    @staticmethod
    def create_org(slug="test-org", **kwargs):
        defaults = {"name": f"Test Org ({slug})", "slug": slug}
        defaults.update(kwargs)
        return Organization.objects.create(**defaults)

    @staticmethod
    def create_term(org, **kwargs):
        defaults = {
            "organization": org,
            "name": "Fall 2025",
            "start_date": datetime.date(2025, 9, 1),
            "end_date": datetime.date(2025, 12, 15),
        }
        defaults.update(kwargs)
        return Term.objects.create(**defaults)

    @staticmethod
    def create_person(org, first="Jane", last="Doe", **kwargs):
        defaults = {
            "organization": org,
            "first_name": first,
            "last_name": last,
        }
        defaults.update(kwargs)
        return Person.objects.create(**defaults)


# ---------------------------------------------------------------------------
# Tenant Scoping Tests
# ---------------------------------------------------------------------------

class TenantScopingTests(TestCase):

    def setUp(self):
        self.org_a = OrgFactory.create_org("org-a")
        self.org_b = OrgFactory.create_org("org-b")
        self.term_a = OrgFactory.create_term(self.org_a, name="Fall A")
        self.term_b = OrgFactory.create_term(self.org_b, name="Fall B")

    def test_for_org_filters_terms(self):
        """Term.objects.for_org() returns only that org's terms."""
        terms_a = Term.objects.for_org(self.org_a)
        terms_b = Term.objects.for_org(self.org_b)
        self.assertEqual(list(terms_a), [self.term_a])
        self.assertEqual(list(terms_b), [self.term_b])

    def test_for_org_filters_people(self):
        """Person.objects.for_org() returns only that org's people."""
        p_a = OrgFactory.create_person(self.org_a, first="Alice")
        p_b = OrgFactory.create_person(self.org_b, first="Bob")
        self.assertEqual(list(Person.objects.for_org(self.org_a)), [p_a])
        self.assertEqual(list(Person.objects.for_org(self.org_b)), [p_b])

    def test_unique_email_per_org(self):
        """Same email can exist in different orgs but not the same org."""
        OrgFactory.create_person(self.org_a, email="test@example.com")
        # Same email, different org — OK
        OrgFactory.create_person(self.org_b, first="Bob", email="test@example.com")
        # Same email, same org — should fail
        with self.assertRaises(IntegrityError):
            OrgFactory.create_person(self.org_a, first="Dupe", email="test@example.com")

    def test_blank_email_not_unique(self):
        """Multiple people with blank email in the same org is allowed."""
        OrgFactory.create_person(self.org_a, first="No Email 1", email="")
        OrgFactory.create_person(self.org_a, first="No Email 2", email="")
        self.assertEqual(Person.objects.for_org(self.org_a).count(), 2)


# ---------------------------------------------------------------------------
# Event Lifecycle / Workflow Tests
# ---------------------------------------------------------------------------

class EventLifecycleTests(TestCase):

    def setUp(self):
        self.org = OrgFactory.create_org()
        self.term = OrgFactory.create_term(self.org)
        self.venue = Venue.objects.create(
            organization=self.org, name="Main Hall", capacity=100,
        )
        self.draft = WorkflowState.objects.create(
            organization=self.org, name="Draft", slug="draft", position=0,
        )
        self.tentative = WorkflowState.objects.create(
            organization=self.org, name="Tentative", slug="tentative", position=1,
        )
        self.booked = WorkflowState.objects.create(
            organization=self.org, name="Booked", slug="booked", position=2,
            gate_conditions={
                "has_abstract": True,
                "has_bio": True,
                "has_graphic": True,
                "venue_id__isnull": False,
            },
        )
        self.published = WorkflowState.objects.create(
            organization=self.org, name="Published", slug="published", position=3,
        )

    def _create_event(self, **kwargs):
        defaults = {
            "organization": self.org,
            "term": self.term,
            "title": "Test Event",
            "lifecycle_state": self.draft,
        }
        defaults.update(kwargs)
        return Event.objects.create(**defaults)

    def test_transition_draft_to_tentative(self):
        """Draft → Tentative succeeds (no gate conditions)."""
        event = self._create_event()
        event.transition_to(self.tentative)
        event.refresh_from_db()
        self.assertEqual(event.lifecycle_state, self.tentative)

    def test_transition_to_booked_fails_without_requirements(self):
        """Tentative → Booked fails when gate conditions not met."""
        event = self._create_event(lifecycle_state=self.tentative)
        with self.assertRaises(ValidationError) as ctx:
            event.transition_to(self.booked)
        self.assertIn("has_abstract", str(ctx.exception))

    def test_transition_to_booked_succeeds_with_requirements(self):
        """Tentative → Booked succeeds when all gate conditions are met."""
        event = self._create_event(
            lifecycle_state=self.tentative,
            venue=self.venue,
            has_abstract=True,
            has_bio=True,
            has_graphic=True,
        )
        event.transition_to(self.booked)
        event.refresh_from_db()
        self.assertEqual(event.lifecycle_state, self.booked)

    def test_transition_to_booked_fails_without_venue(self):
        """Booked requires a venue (venue_id__isnull: False)."""
        event = self._create_event(
            lifecycle_state=self.tentative,
            has_abstract=True,
            has_bio=True,
            has_graphic=True,
            venue=None,
        )
        with self.assertRaises(ValidationError) as ctx:
            event.transition_to(self.booked)
        self.assertIn("venue_id", str(ctx.exception))

    def test_transition_to_published_no_extra_gates(self):
        """Booked → Published succeeds (no extra gate conditions)."""
        event = self._create_event(
            lifecycle_state=self.booked,
            venue=self.venue,
            has_abstract=True, has_bio=True, has_graphic=True,
        )
        event.transition_to(self.published)
        event.refresh_from_db()
        self.assertEqual(event.lifecycle_state, self.published)


# ---------------------------------------------------------------------------
# Capacity & Waitlist Tests
# ---------------------------------------------------------------------------

class CapacityTests(TestCase):

    def setUp(self):
        self.org = OrgFactory.create_org()
        self.term = OrgFactory.create_term(self.org)
        self.event = Event.objects.create(
            organization=self.org, term=self.term,
            title="Limited Event", capacity=2,
        )
        self.tier = PricingTier.objects.create(
            organization=self.org, name="Resident", slug="resident",
        )

    def test_registration_count(self):
        """Active registrations are correctly counted."""
        for i in range(2):
            p = OrgFactory.create_person(self.org, first=f"Student{i}", email=f"s{i}@test.com")
            Registration.objects.create(
                organization=self.org, person=p, event=self.event,
                term=self.term, tier=self.tier,
                status="registered", amount_charged=Decimal("1.00"),
            )
        active = self.event.registrations.filter(status="registered").count()
        self.assertEqual(active, 2)
        self.assertEqual(active, self.event.capacity)

    def test_cancelled_does_not_count(self):
        """Cancelled registrations don't count toward capacity."""
        p = OrgFactory.create_person(self.org, email="cancel@test.com")
        reg = Registration.objects.create(
            organization=self.org, person=p, event=self.event,
            term=self.term, status="registered", amount_charged=Decimal("1.00"),
        )
        reg.status = "cancelled"
        reg.save()
        active = self.event.registrations.filter(status="registered").count()
        self.assertEqual(active, 0)

    def test_unique_registration_per_person_event(self):
        """A person cannot register twice for the same event."""
        p = OrgFactory.create_person(self.org, email="dupe@test.com")
        Registration.objects.create(
            organization=self.org, person=p, event=self.event,
            term=self.term, status="registered",
        )
        with self.assertRaises(IntegrityError):
            Registration.objects.create(
                organization=self.org, person=p, event=self.event,
                term=self.term, status="registered",
            )


# ---------------------------------------------------------------------------
# Pricing Tests
# ---------------------------------------------------------------------------

class PricingTests(TestCase):

    def setUp(self):
        self.org = OrgFactory.create_org()
        self.term = OrgFactory.create_term(self.org)
        self.event = Event.objects.create(
            organization=self.org, term=self.term, title="Priced Event",
        )
        self.tier_res = PricingTier.objects.create(
            organization=self.org, name="Resident", slug="resident",
        )
        self.tier_nr = PricingTier.objects.create(
            organization=self.org, name="Non-Resident", slug="non-resident",
        )

    def test_different_prices_per_tier(self):
        """Events can have different prices for different tiers."""
        EventPrice.objects.create(
            organization=self.org, event=self.event,
            tier=self.tier_res, timing="pre", amount=Decimal("1.00"),
        )
        EventPrice.objects.create(
            organization=self.org, event=self.event,
            tier=self.tier_nr, timing="pre", amount=Decimal("5.00"),
        )
        res_price = EventPrice.objects.get(
            event=self.event, tier=self.tier_res, timing="pre",
        )
        nr_price = EventPrice.objects.get(
            event=self.event, tier=self.tier_nr, timing="pre",
        )
        self.assertEqual(res_price.amount, Decimal("1.00"))
        self.assertEqual(nr_price.amount, Decimal("5.00"))

    def test_pre_vs_walk_pricing(self):
        """Pre-registration and walk-in prices can differ."""
        EventPrice.objects.create(
            organization=self.org, event=self.event,
            tier=self.tier_res, timing="pre", amount=Decimal("1.00"),
        )
        EventPrice.objects.create(
            organization=self.org, event=self.event,
            tier=self.tier_res, timing="walk", amount=Decimal("2.00"),
        )
        pre = EventPrice.objects.get(event=self.event, tier=self.tier_res, timing="pre")
        walk = EventPrice.objects.get(event=self.event, tier=self.tier_res, timing="walk")
        self.assertLess(pre.amount, walk.amount)

    def test_unique_price_constraint(self):
        """Cannot create duplicate price for same event+tier+timing."""
        EventPrice.objects.create(
            organization=self.org, event=self.event,
            tier=self.tier_res, timing="pre", amount=Decimal("1.00"),
        )
        with self.assertRaises(IntegrityError):
            EventPrice.objects.create(
                organization=self.org, event=self.event,
                tier=self.tier_res, timing="pre", amount=Decimal("2.00"),
            )


# ---------------------------------------------------------------------------
# Bundle Tests
# ---------------------------------------------------------------------------

class BundleTests(TestCase):

    def setUp(self):
        self.org = OrgFactory.create_org()
        self.term = OrgFactory.create_term(self.org)
        self.cat = EventCategory.objects.create(
            organization=self.org, name="Evening Lecture", slug="evening-lecture",
        )
        self.evt1 = Event.objects.create(
            organization=self.org, term=self.term, category=self.cat,
            title="Lecture 1",
        )
        self.evt2 = Event.objects.create(
            organization=self.org, term=self.term, category=self.cat,
            title="Lecture 2",
        )
        self.evt3 = Event.objects.create(
            organization=self.org, term=self.term,
            title="Performance 1",  # no category
        )

    def test_category_bundle(self):
        """Category-based bundle returns all events in that category."""
        bundle = BundleDefinition.objects.create(
            organization=self.org, name="All Lectures", slug="all-lectures",
            term=self.term, selection_mode="category",
            category_filter=self.cat,
        )
        eligible = bundle.get_eligible_events()
        self.assertEqual(set(eligible), {self.evt1, self.evt2})

    def test_manual_bundle(self):
        """Manual bundle returns only explicitly added events."""
        bundle = BundleDefinition.objects.create(
            organization=self.org, name="Custom", slug="custom",
            term=self.term, selection_mode="manual",
        )
        bundle.events.add(self.evt1, self.evt3)
        eligible = bundle.get_eligible_events()
        self.assertEqual(set(eligible), {self.evt1, self.evt3})
