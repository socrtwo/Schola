"""Catalog generation: web views context, PDF via WeasyPrint, DOCX via python-docx.

Template rendering system that replaces MailMerge with support for the same
39 field names found in the MergeText templates.
"""
import io
from collections import OrderedDict

from django.template import Context, Template

from .models import (
    Event,
    EventCategory,
    EventGroupMembership,
    EventSession,
    EventSpeaker,
    Organization,
    Term,
)


# ---------------------------------------------------------------------------
# Merge Field Mapping
# ---------------------------------------------------------------------------

def get_merge_fields(event):
    """Build a dict of all merge field values for an event.

    Returns the 26 standard fields used by the MailMerge templates.
    """
    session = event.sessions.order_by("date").first()
    speaker_obj = event.eventspeaker_set.select_related("person").first()
    host_obj = event.eventhost_set.select_related("person").first()

    # Get pricing
    pre_price = None
    walk_price = None
    for ep in event.prices.all():
        if ep.timing == "pre" and pre_price is None:
            pre_price = ep.amount
        elif ep.timing == "walk" and walk_price is None:
            walk_price = ep.amount

    speaker_name = ""
    if speaker_obj:
        speaker_name = (
            f"{speaker_obj.person.first_name} {speaker_obj.person.last_name}"
        )

    host_name = ""
    first_host = ""
    if host_obj:
        host_name = (
            f"{host_obj.person.first_name} {host_obj.person.last_name}"
        )
        first_host = host_obj.person.first_name

    date_str = session.date.strftime("%B %d, %Y") if session else ""
    day_str = session.date.strftime("%A") if session else ""
    time_str = session.start_time.strftime("%I:%M %p").lstrip("0") if session and session.start_time else ""

    id_day_date = ""
    if event.legacy_id and day_str and date_str:
        id_day_date = f"{event.legacy_id} {day_str} {date_str}"

    return {
        "ID": event.legacy_id or str(event.pk),
        "Title": event.title,
        "ShortTitle": event.short_title or event.title,
        "Speaker": speaker_name,
        "Host": host_name,
        "FirstHost": first_host,
        "Date": date_str,
        "Day": day_str,
        "Time": time_str,
        "Venue": event.venue.name if event.venue else "",
        "Abstract": event.abstract,
        "Profile": speaker_obj.bio if speaker_obj else "",
        "PreFee": str(pre_price) if pre_price is not None else "",
        "WalkFee": str(walk_price) if walk_price is not None else "",
        "NudgeText": event.nudge_text,
        "Nudge": event.nudge_sequence,
        "Word": event.keyword,
        "Phrase": event.phrase,
        "IsAre": event.speaker_verb,
        "Intro": event.intro_text,
        "IdDayDate": id_day_date,
        "SpeakLink": event.speaker_link,
        "BooksLink": event.books_link,
        "Vimeo": event.vimeo_url,
        "Minimum": "",  # reserved for min enrollment
        "First": first_host,
    }


def get_paired_merge_fields(event):
    """Get x-prefixed merge fields for a paired event.

    These are the 13 x-prefixed fields used for the Thursday event
    in Monday/Thursday pairings (or any grouped event).
    """
    fields = get_merge_fields(event)
    return {
        "xID": fields["ID"],
        "xTitle": fields["Title"],
        "xShortTitle": fields["ShortTitle"],
        "xSpeaker": fields["Speaker"],
        "xHost": fields["Host"],
        "xDate": fields["Date"],
        "xDay": fields["Day"],
        "xVenue": fields["Venue"],
        "xWalkFee": fields["WalkFee"],
        "xNudgeText": fields["NudgeText"],
        "xPhrase": fields["Phrase"],
        "xWord": fields["Word"],
        "xIsAre": fields["IsAre"],
    }


def get_group_merge_fields(event):
    """Get full merge fields for an event including any paired event's x-fields.

    Looks up the event's group memberships and merges fields from
    the next event in the same group.
    """
    fields = get_merge_fields(event)

    # Find paired events in the same group
    memberships = EventGroupMembership.objects.filter(
        event=event,
    ).select_related("group")

    for membership in memberships:
        other_members = (
            EventGroupMembership.objects
            .filter(group=membership.group)
            .exclude(event=event)
            .select_related("event")
            .order_by("position")
        )
        if other_members.exists():
            paired = other_members.first().event
            fields.update(get_paired_merge_fields(paired))
            break

    return fields


# ---------------------------------------------------------------------------
# Web Catalog Context
# ---------------------------------------------------------------------------

def get_catalog_context(org, term):
    """Build context dict for web catalog rendering.

    Returns a dict with sections organized by event category,
    matching the catalog structure: Front Matter, Evening Events,
    Day Classes, End Matter.
    """
    events = (
        Event.objects
        .filter(organization=org, term=term)
        .select_related("category", "venue", "lifecycle_state")
        .prefetch_related(
            "sessions", "eventspeaker_set__person",
            "eventhost_set__person", "prices",
        )
        .order_by("legacy_id")
    )

    # Group by category
    categories = OrderedDict()
    uncategorized = []

    for event in events:
        if event.category:
            cat_name = event.category.name
            if cat_name not in categories:
                categories[cat_name] = []
            categories[cat_name].append({
                "event": event,
                "fields": get_merge_fields(event),
            })
        else:
            uncategorized.append({
                "event": event,
                "fields": get_merge_fields(event),
            })

    return {
        "org": org,
        "term": term,
        "categories": categories,
        "uncategorized": uncategorized,
        "event_count": events.count(),
    }


# ---------------------------------------------------------------------------
# HTML Catalog Template
# ---------------------------------------------------------------------------

CATALOG_HTML_TEMPLATE = """\
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{{ term.name }} Catalog — {{ org.name }}</title>
<style>
  @page { size: letter; margin: 0.75in; }
  body { font-family: Georgia, "Times New Roman", serif; font-size: 11pt;
         line-height: 1.4; color: #222; }
  h1 { font-size: 22pt; text-align: center; margin-bottom: 4px; }
  .subtitle { text-align: center; font-size: 14pt; color: #555; margin-bottom: 24px; }
  h2 { font-size: 16pt; border-bottom: 2px solid #333; padding-bottom: 4px;
       margin-top: 24px; }
  .event { margin-bottom: 18px; page-break-inside: avoid; }
  .event-title { font-size: 13pt; font-weight: bold; margin-bottom: 2px; }
  .event-meta { font-size: 10pt; color: #555; margin-bottom: 4px; }
  .event-abstract { font-size: 10.5pt; margin-bottom: 4px; }
  .event-bio { font-size: 10pt; font-style: italic; color: #444; }
  .event-fee { font-size: 10pt; font-weight: bold; }
  .footer { margin-top: 36px; text-align: center; font-size: 9pt; color: #888; }
</style>
</head>
<body>

<h1>{{ org.name }}</h1>
<div class="subtitle">{{ term.name }} Catalog</div>

{% for cat_name, events in categories.items %}
<h2>{{ cat_name }}</h2>
{% for item in events %}
<div class="event">
  <div class="event-title">{{ item.fields.ID }} — {{ item.fields.Title }}</div>
  <div class="event-meta">
    {{ item.fields.Day }}, {{ item.fields.Date }}
    {% if item.fields.Time %}at {{ item.fields.Time }}{% endif %}
    {% if item.fields.Venue %}— {{ item.fields.Venue }}{% endif %}
  </div>
  <div class="event-meta">
    Speaker: {{ item.fields.Speaker }}
    {% if item.fields.Host %}| Host: {{ item.fields.Host }}{% endif %}
  </div>
  {% if item.fields.Abstract %}
  <div class="event-abstract">{{ item.fields.Abstract }}</div>
  {% endif %}
  {% if item.fields.Profile %}
  <div class="event-bio">{{ item.fields.Profile }}</div>
  {% endif %}
  {% if item.fields.PreFee %}
  <div class="event-fee">Pre-registration: ${{ item.fields.PreFee }}
    {% if item.fields.WalkFee %}| Walk-in: ${{ item.fields.WalkFee }}{% endif %}
  </div>
  {% endif %}
</div>
{% endfor %}
{% endfor %}

{% if uncategorized %}
<h2>Other Events</h2>
{% for item in uncategorized %}
<div class="event">
  <div class="event-title">{{ item.fields.ID }} — {{ item.fields.Title }}</div>
  <div class="event-meta">
    {{ item.fields.Day }}, {{ item.fields.Date }}
    {% if item.fields.Time %}at {{ item.fields.Time }}{% endif %}
    {% if item.fields.Venue %}— {{ item.fields.Venue }}{% endif %}
  </div>
  <div class="event-meta">Speaker: {{ item.fields.Speaker }}</div>
</div>
{% endfor %}
{% endif %}

<div class="footer">
  {{ org.name }} — {{ term.name }} — {{ event_count }} events
</div>

</body>
</html>
"""


def generate_catalog_html(org, term):
    """Generate the full catalog as HTML."""
    ctx = get_catalog_context(org, term)
    tpl = Template(CATALOG_HTML_TEMPLATE)
    return tpl.render(Context(ctx))


def generate_catalog_pdf(org, term):
    """Generate the catalog as PDF bytes via WeasyPrint."""
    html = generate_catalog_html(org, term)
    try:
        from weasyprint import HTML
        return HTML(string=html).write_pdf()
    except ImportError:
        raise ImportError("WeasyPrint is required for PDF catalog generation")


# ---------------------------------------------------------------------------
# DOCX Catalog Generation
# ---------------------------------------------------------------------------

def generate_catalog_docx(org, term):
    """Generate the catalog as a DOCX file. Returns bytes."""
    try:
        from docx import Document
        from docx.shared import Pt, Inches
        from docx.enum.text import WD_ALIGN_PARAGRAPH
    except ImportError:
        raise ImportError("python-docx is required for DOCX catalog generation")

    doc = Document()

    # Title
    title = doc.add_heading(org.name, level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    subtitle = doc.add_paragraph(f"{term.name} Catalog")
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.style = doc.styles["Subtitle"]

    ctx = get_catalog_context(org, term)

    for cat_name, events in ctx["categories"].items():
        doc.add_heading(cat_name, level=1)
        for item in events:
            f = item["fields"]
            # Event title
            p = doc.add_paragraph()
            run = p.add_run(f"{f['ID']} — {f['Title']}")
            run.bold = True
            run.font.size = Pt(12)

            # Meta
            meta_parts = []
            if f["Day"] and f["Date"]:
                meta_parts.append(f"{f['Day']}, {f['Date']}")
            if f["Time"]:
                meta_parts.append(f"at {f['Time']}")
            if f["Venue"]:
                meta_parts.append(f"— {f['Venue']}")
            if meta_parts:
                doc.add_paragraph(" ".join(meta_parts))

            speaker_line = f"Speaker: {f['Speaker']}"
            if f["Host"]:
                speaker_line += f" | Host: {f['Host']}"
            doc.add_paragraph(speaker_line)

            if f["Abstract"]:
                doc.add_paragraph(f["Abstract"])

            if f["Profile"]:
                bio_p = doc.add_paragraph()
                run = bio_p.add_run(f["Profile"])
                run.italic = True

            if f["PreFee"]:
                fee_line = f"Pre-registration: ${f['PreFee']}"
                if f["WalkFee"]:
                    fee_line += f" | Walk-in: ${f['WalkFee']}"
                fee_p = doc.add_paragraph(fee_line)
                fee_p.runs[0].bold = True

    # Uncategorized
    if ctx["uncategorized"]:
        doc.add_heading("Other Events", level=1)
        for item in ctx["uncategorized"]:
            f = item["fields"]
            p = doc.add_paragraph()
            run = p.add_run(f"{f['ID']} — {f['Title']}")
            run.bold = True

    # Footer
    doc.add_paragraph("")
    footer = doc.add_paragraph(
        f"{org.name} — {term.name} — {ctx['event_count']} events"
    )
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# MergeGrid-Compatible Excel Export (Migration Bridge)
# ---------------------------------------------------------------------------

def export_mergegrid_excel(org, term):
    """Export a MergeGrid-compatible Excel file for legacy MailMerge.

    One row per event, columns match the legacy grid format with all
    39 merge field names (26 standard + 13 x-prefixed).
    Returns bytes.
    """
    try:
        import openpyxl
    except ImportError:
        raise ImportError("openpyxl is required for Excel export")

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "MergeGrid"

    # All 39 merge field columns
    columns = [
        "ID", "Title", "ShortTitle", "Speaker", "Host", "FirstHost",
        "Date", "Day", "Time", "Venue", "Abstract", "Profile",
        "PreFee", "WalkFee", "NudgeText", "Nudge", "Word", "Phrase",
        "IsAre", "Intro", "IdDayDate", "SpeakLink", "BooksLink",
        "Vimeo", "Minimum", "First",
        "xID", "xTitle", "xShortTitle", "xSpeaker", "xHost",
        "xDate", "xDay", "xVenue", "xWalkFee", "xNudgeText",
        "xPhrase", "xWord", "xIsAre",
    ]

    # Header
    for col_idx, col_name in enumerate(columns, start=1):
        cell = ws.cell(row=1, column=col_idx, value=col_name)
        cell.font = openpyxl.styles.Font(bold=True)

    # Data rows
    events = (
        Event.objects
        .filter(organization=org, term=term)
        .select_related("category", "venue")
        .prefetch_related(
            "sessions", "eventspeaker_set__person",
            "eventhost_set__person", "prices",
            "group_memberships__group__memberships__event",
        )
        .order_by("legacy_id")
    )

    for row_idx, event in enumerate(events, start=2):
        fields = get_group_merge_fields(event)
        for col_idx, col_name in enumerate(columns, start=1):
            ws.cell(row=row_idx, column=col_idx, value=fields.get(col_name, ""))

    # Auto-width
    for col in ws.columns:
        max_len = max((len(str(cell.value or "")) for cell in col), default=10)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 2, 50)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Template Rendering (replaces MailMerge)
# ---------------------------------------------------------------------------

def render_template_for_event(template_str, event):
    """Render a template string using an event's merge fields.

    Supports all 39 merge field names: {{ ID }}, {{ Title }}, {{ xSpeaker }}, etc.
    Uses Django template engine.
    """
    fields = get_group_merge_fields(event)
    tpl = Template(template_str)
    return tpl.render(Context(fields))


def render_template_for_events(template_str, events):
    """Render a template for multiple events. Returns list of rendered strings."""
    return [render_template_for_event(template_str, event) for event in events]
