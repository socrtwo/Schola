"""Attendance sheet generation (HTML and PDF).

Generates printable attendance/sign-in sheets for events.
"""
import io
from django.template import Context, Template

from .models import Event, EventSession, Registration


# ---------------------------------------------------------------------------
# HTML Template
# ---------------------------------------------------------------------------

ATTENDANCE_SHEET_HTML = """\
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{{ event.title }} — Attendance Sheet</title>
<style>
  @page { size: letter; margin: 0.75in; }
  body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 11pt; }
  h1 { font-size: 16pt; margin-bottom: 4px; }
  .meta { color: #555; font-size: 10pt; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #333; padding: 4px 8px; text-align: left; }
  th { background: #eee; font-size: 10pt; }
  td { font-size: 10pt; height: 22px; }
  .signature { width: 200px; }
  .status { width: 80px; font-size: 9pt; color: #666; }
  .num { width: 30px; text-align: center; }
  .footer { margin-top: 16px; font-size: 9pt; color: #888; }
</style>
</head>
<body>
<h1>{{ event.title }}</h1>
<div class="meta">
  {{ org.name }}{% if session %} &mdash; {{ session.date }}{% if session.start_time %} {{ session.start_time }}{% endif %}{% endif %}
  {% if event.venue %}&mdash; {{ event.venue.name }}{% endif %}
  &mdash; Capacity: {{ event.capacity|default:"Unlimited" }}
  &mdash; Registered: {{ registered_count }}
</div>

<table>
  <thead>
    <tr>
      <th class="num">#</th>
      <th>Name</th>
      <th>Email</th>
      <th class="status">Status</th>
      <th class="signature">Signature</th>
    </tr>
  </thead>
  <tbody>
  {% for reg in registrations %}
    <tr>
      <td class="num">{{ forloop.counter }}</td>
      <td>{{ reg.person.last_name }}, {{ reg.person.first_name }}</td>
      <td>{{ reg.person.email }}</td>
      <td class="status">{{ reg.status }}</td>
      <td class="signature"></td>
    </tr>
  {% endfor %}
  {% for i in blank_rows %}
    <tr>
      <td class="num">{{ registered_count|add:forloop.counter }}</td>
      <td></td>
      <td></td>
      <td class="status"></td>
      <td class="signature"></td>
    </tr>
  {% endfor %}
  </tbody>
</table>

<div class="footer">
  Generated for {{ org.name }}. Total registered: {{ registered_count }}.
  {% if waitlisted_count %}Waitlisted: {{ waitlisted_count }}.{% endif %}
</div>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# Generation functions
# ---------------------------------------------------------------------------

def generate_attendance_html(event, session=None, blank_rows=5):
    """Generate an attendance sheet as HTML string.

    Args:
        event: Event instance
        session: optional EventSession. If None, uses first session.
        blank_rows: number of blank rows for walk-ins
    """
    if session is None:
        session = event.sessions.order_by("date").first()

    registrations = Registration.objects.filter(
        event=event,
        status__in=("registered", "waitlisted"),
    ).select_related("person").order_by("person__last_name", "person__first_name")

    registered_count = registrations.filter(status="registered").count()
    waitlisted_count = registrations.filter(status="waitlisted").count()

    context = Context({
        "event": event,
        "session": session,
        "org": event.organization,
        "registrations": registrations,
        "registered_count": registered_count,
        "waitlisted_count": waitlisted_count,
        "blank_rows": range(blank_rows),
    })

    tpl = Template(ATTENDANCE_SHEET_HTML)
    return tpl.render(context)


def generate_attendance_pdf(event, session=None, blank_rows=5):
    """Generate an attendance sheet as PDF bytes.

    Uses WeasyPrint for HTML-to-PDF conversion.
    """
    html = generate_attendance_html(event, session, blank_rows)

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
        return pdf_bytes
    except ImportError:
        raise ImportError(
            "WeasyPrint is required for PDF generation. "
            "Install it with: pip install weasyprint"
        )


def generate_attendance_sheets_for_term(org, term, session_date=None, blank_rows=5):
    """Generate attendance sheets for all events in a term.

    Returns list of (event, html_string) tuples.
    If session_date is provided, only generates for events with sessions on that date.
    """
    events = Event.objects.filter(organization=org, term=term)

    if session_date:
        events = events.filter(sessions__date=session_date).distinct()

    results = []
    for event in events.order_by("legacy_id", "title"):
        session = None
        if session_date:
            session = event.sessions.filter(date=session_date).first()
        html = generate_attendance_html(event, session, blank_rows)
        results.append((event, html))

    return results
