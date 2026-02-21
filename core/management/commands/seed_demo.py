"""Seed the database with Sampleschool School demo data."""
import datetime
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import (
    BundleDefinition,
    BundlePrice,
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
    Person,
    PricingTier,
    RefundPolicy,
    Registration,
    Role,
    Term,
    User,
    Venue,
    WorkflowState,
)


class Command(BaseCommand):
    help = "Seed the database with Sampleschool School demo data"

    def handle(self, *args, **options):
        if Organization.objects.filter(slug="sampleschool").exists():
            self.stdout.write(self.style.WARNING("Demo data already exists. Skipping."))
            return

        # --- Organization ---
        org = Organization.objects.create(
            name="Sampleschool School of Continuing Education",
            slug="sampleschool",
            contact_email="sampleschoolschool@samplecommunity.org",
            contact_phone="301-216-4001",
            address="100 Main Street, Sampletown, MD 99999",
            timezone="America/New_York",
            is_tax_exempt=True,
        )

        # --- Superuser ---
        admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@sampleschoolschool.org",
            password="admin",
        )

        # --- Roles (builtin) ---
        roles = {}
        for slug, name in Role.BUILTIN_ROLES:
            roles[slug] = Role.objects.create(
                organization=org, name=name, slug=slug, is_builtin=True,
            )

        # --- Workflow States ---
        states = {}
        for pos, (slug, name, gates) in enumerate([
            ("draft", "Draft", {}),
            ("tentative", "Tentative", {}),
            ("booked", "Booked", {
                "has_abstract": True,
                "has_bio": True,
                "has_graphic": True,
                "venue_id__isnull": False,
            }),
            ("published", "Published", {}),
            ("archived", "Archived", {}),
        ]):
            states[slug] = WorkflowState.objects.create(
                organization=org, name=name, slug=slug,
                position=pos, gate_conditions=gates,
            )

        # --- Event Categories ---
        cat_lecture = EventCategory.objects.create(
            organization=org, name="Evening Lecture", slug="evening-lecture",
        )
        cat_performance = EventCategory.objects.create(
            organization=org, name="Evening Performance", slug="evening-performance",
        )
        cat_day = EventCategory.objects.create(
            organization=org, name="Daytime Class", slug="daytime-class",
        )

        # --- Pricing Tiers ---
        tier_resident = PricingTier.objects.create(
            organization=org, name="Resident", slug="resident", is_default=True,
        )
        tier_nonresident = PricingTier.objects.create(
            organization=org, name="Non-Resident", slug="non-resident",
        )
        tier_scholarship = PricingTier.objects.create(
            organization=org, name="Scholarship", slug="scholarship",
        )
        tier_comped = PricingTier.objects.create(
            organization=org, name="Comped", slug="comped",
        )

        # --- Venues ---
        rosborough = Venue.objects.create(
            organization=org, name="Rosborough Theater", capacity=300,
        )
        hefner = Venue.objects.create(
            organization=org, name="Hefner Auditorium", capacity=200,
        )
        arts_room = Venue.objects.create(
            organization=org, name="Hefner Arts and Crafts Room", capacity=20,
        )

        # --- Term ---
        term = Term.objects.create(
            organization=org, name="Fall 2025",
            start_date=datetime.date(2025, 9, 8),
            end_date=datetime.date(2025, 12, 4),
            is_active=True,
        )

        # --- People (sample speakers, hosts, students) ---
        dean = Person.objects.create(
            organization=org, first_name="Frank", last_name="Stanton",
            email="demo.dean@samplecommunity.org", is_resident=True,
            unit_number="Diamond 101", building="Diamond",
        )
        host_kate = Person.objects.create(
            organization=org, first_name="Kate", last_name="Harmon",
            email="demo.host1@samplecommunity.org", is_resident=True,
        )
        host_jim = Person.objects.create(
            organization=org, first_name="Jim", last_name="Holloway",
            email="demo.host2@samplecommunity.org", is_resident=True,
        )
        speaker_bobby = Person.objects.create(
            organization=org, first_name="Bobby", last_name="Jasinski",
            email="bobby@bobbyjasinski.com",
        )
        speaker_alice = Person.objects.create(
            organization=org, first_name="Alice", last_name="Winters",
            email="demo.speaker1@samplecommunity.org", is_resident=True,
        )
        speaker_averill = Person.objects.create(
            organization=org, first_name="Avery", last_name="Fielding",
            email="demo.speaker2@samplecommunity.org", is_resident=True,
        )

        # Sample students
        students = []
        for i, (first, last, email) in enumerate([
            ("Doris", "Ashwood", "student.one@verizon.net"),
            ("Jean", "Andrews", "student.two@aol.com"),
            ("Kay", "Allerton", "student.three@gmail.com"),
            ("Brad", "Barton", "student.four@yahoo.com"),
            ("Patricia", "Brooks", "student.five@samplecommunity.org"),
        ]):
            students.append(Person.objects.create(
                organization=org, first_name=first, last_name=last,
                email=email, is_resident=True,
            ))

        # --- Events ---
        evt101 = Event.objects.create(
            organization=org, term=term, category=cat_performance,
            venue=rosborough, lifecycle_state=states["published"],
            legacy_id="101", title="Hot Lanes Presents: A Festive Evening of Jazz",
            short_title="Hot Lanes, an Evening of Jazz",
            abstract="The Hot Lanes jazz ensemble promotes jazz in the DC metropolitan area.",
            nudge_sequence="1st", keyword="Jazz Performance",
            phrase="An Evening of Hot Lanes Jazz",
            nudge_text="The Hot Lanes Jazz ensemble will be performing music for the Duck Jazz Festival.",
            speaker_verb="speaker is",
            has_abstract=True, has_bio=True, has_graphic=True,
            capacity=300,
        )
        EventSession.objects.create(
            organization=org, event=evt101,
            date=datetime.date(2025, 9, 8),
            start_time=datetime.time(19, 30),
            end_time=datetime.time(20, 30),
            day_of_week="Monday",
        )
        EventSpeaker.objects.create(
            organization=org, event=evt101, person=speaker_bobby,
            bio="Leader Bobby Jasinski, a native of New York City, started piano at age five.",
            fee=Decimal("500.00"),
            check_payable_to="Bobby Jasinski",
        )
        EventHost.objects.create(organization=org, event=evt101, person=host_kate)

        evt102 = Event.objects.create(
            organization=org, term=term, category=cat_lecture,
            venue=rosborough, lifecycle_state=states["published"],
            legacy_id="102",
            title="Life is Uncertain - Eat Dessert First -- A 9/11 Sequel",
            short_title="A 9/11 Sequel",
            abstract="Diamond residents will recall their experiences in New York City on September 11, 2001.",
            nudge_sequence="skip", keyword="9-11",
            phrase="9-11 World Trade Center",
            nudge_text="Diamond residents will recall their experiences on September 11, 2001.",
            speaker_verb="speakers are",
            has_abstract=True, has_bio=True, has_graphic=True,
            capacity=300,
        )
        EventSession.objects.create(
            organization=org, event=evt102,
            date=datetime.date(2025, 9, 11),
            start_time=datetime.time(19, 30),
            end_time=datetime.time(20, 30),
            day_of_week="Thursday",
        )
        EventSpeaker.objects.create(
            organization=org, event=evt102, person=speaker_alice, fee=Decimal("0"),
        )
        EventSpeaker.objects.create(
            organization=org, event=evt102, person=speaker_averill, fee=Decimal("0"),
        )
        EventHost.objects.create(organization=org, event=evt102, person=host_jim)

        # A tentative event (missing requirements)
        evt103 = Event.objects.create(
            organization=org, term=term, category=cat_lecture,
            lifecycle_state=states["tentative"],
            legacy_id="103", title="Going to Bat for Bats",
            short_title="Bats: The Unsung Heroes of the Night Sky",
            has_abstract=False, has_bio=False, has_graphic=False,
        )

        # --- Pricing ---
        for evt, pre, walk in [(evt101, 8, 8), (evt102, 1, 1)]:
            EventPrice.objects.create(
                organization=org, event=evt, tier=tier_resident,
                timing="pre", amount=Decimal(str(pre)),
            )
            EventPrice.objects.create(
                organization=org, event=evt, tier=tier_resident,
                timing="walk", amount=Decimal(str(walk)),
            )
            EventPrice.objects.create(
                organization=org, event=evt, tier=tier_comped,
                timing="pre", amount=Decimal("0"),
            )

        # --- Event Grouping (nudge group: Mon 101 + Thu 102) ---
        nudge_type = EventGroupType.objects.create(
            organization=org, name="Nudge", slug="nudge",
        )
        group1 = EventGroup.objects.create(
            organization=org, group_type=nudge_type,
            name="Week 1: Sep 8 + Sep 11", position=1,
        )
        EventGroupMembership.objects.create(group=group1, event=evt101, position=0)
        EventGroupMembership.objects.create(group=group1, event=evt102, position=1)

        # --- Bundles ---
        bundle_all = BundleDefinition.objects.create(
            organization=org, name="All Evening Events", slug="all-evening",
            term=term, selection_mode="manual",
        )
        bundle_all.events.add(evt101, evt102)
        BundlePrice.objects.create(
            organization=org, bundle=bundle_all,
            tier=tier_resident, amount=Decimal("25.00"),
        )

        # --- Refund Policy ---
        RefundPolicy.objects.create(
            organization=org, name="Standard Policy", is_default=True,
            full_refund_before_days=7,
            partial_refund_percent=Decimal("50.00"),
            admin_only_after_days=1,
        )

        # --- Registrations ---
        for student in students[:3]:
            Registration.objects.create(
                organization=org, person=student, event=evt101,
                term=term, tier=tier_resident, status="registered",
                amount_charged=Decimal("8.00"),
            )
            Registration.objects.create(
                organization=org, person=student, event=evt102,
                term=term, tier=tier_resident, status="registered",
                amount_charged=Decimal("1.00"),
            )

        self.stdout.write(self.style.SUCCESS(
            f"Seeded: org={org.slug}, term={term.name}, "
            f"events=3, people={Person.objects.for_org(org).count()}, "
            f"registrations={Registration.objects.for_org(org).count()}"
        ))
