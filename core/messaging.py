"""Messaging system for email confirmations, waitlist notifications, and nudges.

Uses the email provider abstraction from providers.py.
"""
from django.template import Context, Template
from django.utils import timezone

from .models import (
    Event,
    EventGroup,
    EventGroupMembership,
    EventGroupType,
    Organization,
    Person,
    Registration,
    WaitlistEntry,
)
from .providers import get_email_provider


# ---------------------------------------------------------------------------
# Message Templates (inline defaults, overridable per org in future)
# ---------------------------------------------------------------------------

REGISTRATION_CONFIRMATION_SUBJECT = "Registration Confirmed: {{ event.title }}"
REGISTRATION_CONFIRMATION_BODY = """\
Dear {{ person.first_name }},

Your registration for "{{ event.title }}" has been confirmed.

Event: {{ event.title }}
{% if session %}Date: {{ session.date|date:"l, F j, Y" }}
Time: {{ session.start_time|time:"g:i A" }}{% endif %}
{% if event.venue %}Venue: {{ event.venue.name }}{% endif %}

Amount charged: ${{ registration.amount_charged }}

Thank you for registering!

{{ org.name }}
"""

WAITLIST_NOTIFICATION_SUBJECT = "Waitlisted: {{ event.title }}"
WAITLIST_NOTIFICATION_BODY = """\
Dear {{ person.first_name }},

You have been placed on the waitlist for "{{ event.title }}" at position #{{ position }}.

We will notify you if a spot becomes available.

{{ org.name }}
"""

WAITLIST_PROMOTED_SUBJECT = "Spot Available: {{ event.title }}"
WAITLIST_PROMOTED_BODY = """\
Dear {{ person.first_name }},

A spot has opened up for "{{ event.title }}" and you have been moved from the waitlist to registered!

{% if session %}Date: {{ session.date|date:"l, F j, Y" }}
Time: {{ session.start_time|time:"g:i A" }}{% endif %}
{% if event.venue %}Venue: {{ event.venue.name }}{% endif %}

{{ org.name }}
"""

CANCELLATION_SUBJECT = "Registration Cancelled: {{ event.title }}"
CANCELLATION_BODY = """\
Dear {{ person.first_name }},

Your registration for "{{ event.title }}" has been cancelled.

{% if refund_amount %}A refund of ${{ refund_amount }} will be processed.{% endif %}

{{ org.name }}
"""

NUDGE_SUBJECT = "This Week at {{ org.name }}: {{ events_summary }}"
NUDGE_BODY = """\
Dear {{ person.first_name }},

Here's what's coming up this week:

{% for item in events %}
{{ item.event.title }}
Speaker: {{ item.speaker_name }}
{{ item.event_date }} at {{ item.event_time }}
{{ item.venue_name }}

{{ item.nudge_text }}

{% endfor %}

{{ org.name }}
"""


# ---------------------------------------------------------------------------
# Render helpers
# ---------------------------------------------------------------------------

def _render_template(template_str, context_dict):
    """Render a Django template string with context."""
    tpl = Template(template_str)
    ctx = Context(context_dict)
    return tpl.render(ctx)


def _get_first_session(event):
    """Get the first session of an event."""
    return event.sessions.order_by("date").first()


# ---------------------------------------------------------------------------
# Send functions
# ---------------------------------------------------------------------------

def send_registration_confirmation(registration):
    """Send registration confirmation email."""
    if not registration.person.email:
        return None

    event = registration.event
    org = registration.organization
    session = _get_first_session(event)

    context = {
        "person": registration.person,
        "event": event,
        "registration": registration,
        "session": session,
        "org": org,
    }

    subject = _render_template(REGISTRATION_CONFIRMATION_SUBJECT, context)
    body = _render_template(REGISTRATION_CONFIRMATION_BODY, context)

    provider = get_email_provider(org)
    return provider.send(
        to=registration.person.email,
        subject=subject.strip(),
        body=body,
        from_email=org.contact_email or "noreply@example.com",
    )


def send_waitlist_notification(registration, waitlist_entry):
    """Send waitlist notification email."""
    if not registration.person.email:
        return None

    event = registration.event
    org = registration.organization

    context = {
        "person": registration.person,
        "event": event,
        "position": waitlist_entry.position,
        "org": org,
    }

    subject = _render_template(WAITLIST_NOTIFICATION_SUBJECT, context)
    body = _render_template(WAITLIST_NOTIFICATION_BODY, context)

    provider = get_email_provider(org)
    return provider.send(
        to=registration.person.email,
        subject=subject.strip(),
        body=body,
        from_email=org.contact_email or "noreply@example.com",
    )


def send_waitlist_promoted(registration):
    """Send notification that a waitlisted person has been promoted."""
    if not registration.person.email:
        return None

    event = registration.event
    org = registration.organization
    session = _get_first_session(event)

    context = {
        "person": registration.person,
        "event": event,
        "session": session,
        "org": org,
    }

    subject = _render_template(WAITLIST_PROMOTED_SUBJECT, context)
    body = _render_template(WAITLIST_PROMOTED_BODY, context)

    provider = get_email_provider(org)
    return provider.send(
        to=registration.person.email,
        subject=subject.strip(),
        body=body,
        from_email=org.contact_email or "noreply@example.com",
    )


def send_cancellation_notice(registration, refund_amount=None):
    """Send registration cancellation email."""
    if not registration.person.email:
        return None

    event = registration.event
    org = registration.organization

    context = {
        "person": registration.person,
        "event": event,
        "refund_amount": refund_amount,
        "org": org,
    }

    subject = _render_template(CANCELLATION_SUBJECT, context)
    body = _render_template(CANCELLATION_BODY, context)

    provider = get_email_provider(org)
    return provider.send(
        to=registration.person.email,
        subject=subject.strip(),
        body=body,
        from_email=org.contact_email or "noreply@example.com",
    )


def send_nudge(org, group, recipients=None):
    """Send a nudge email for an event group.

    Args:
        org: Organization
        group: EventGroup (e.g., a weekly nudge group)
        recipients: queryset of Person. If None, sends to all
                    registered people in the org with email.
    """
    memberships = group.memberships.select_related("event").order_by("position")
    events_data = []
    titles = []

    for m in memberships:
        event = m.event
        session = _get_first_session(event)
        speaker = event.eventspeaker_set.select_related("person").first()
        events_data.append({
            "event": event,
            "speaker_name": (
                f"{speaker.person.first_name} {speaker.person.last_name}"
                if speaker else "TBA"
            ),
            "event_date": session.date.strftime("%A, %B %d") if session else "TBD",
            "event_time": session.start_time.strftime("%I:%M %p") if session and session.start_time else "TBD",
            "venue_name": event.venue.name if event.venue else "TBD",
            "nudge_text": event.nudge_text,
        })
        titles.append(event.short_title or event.title)

    if not events_data:
        return []

    if recipients is None:
        recipients = Person.objects.filter(
            organization=org,
        ).exclude(email="").exclude(email__isnull=True)

    events_summary = " & ".join(titles[:3])
    if len(titles) > 3:
        events_summary += f" + {len(titles) - 3} more"

    provider = get_email_provider(org)
    results = []

    for person in recipients:
        context = {
            "person": person,
            "events": events_data,
            "events_summary": events_summary,
            "org": org,
        }
        subject = _render_template(NUDGE_SUBJECT, context)
        body = _render_template(NUDGE_BODY, context)

        result = provider.send(
            to=person.email,
            subject=subject.strip(),
            body=body,
            from_email=org.contact_email or "noreply@example.com",
        )
        results.append(result)

    return results


def send_bulk_message(org, recipients, subject, body_template, context_extra=None):
    """Send a bulk message to a list of people.

    Args:
        recipients: queryset or list of Person objects
        subject: subject line (may contain {{ person.first_name }} etc)
        body_template: body template string
        context_extra: additional context dict
    """
    provider = get_email_provider(org)
    results = []

    for person in recipients:
        context = {"person": person, "org": org}
        if context_extra:
            context.update(context_extra)

        rendered_subject = _render_template(subject, context)
        rendered_body = _render_template(body_template, context)

        result = provider.send(
            to=person.email,
            subject=rendered_subject.strip(),
            body=rendered_body,
            from_email=org.contact_email or "noreply@example.com",
        )
        results.append(result)

    return results
