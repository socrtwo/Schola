"""Views for the core app: public catalog, exports, attendance."""
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render

from .attendance import generate_attendance_html, generate_attendance_pdf
from .catalog import (
    export_mergegrid_excel,
    generate_catalog_docx,
    generate_catalog_html,
    generate_catalog_pdf,
    get_catalog_context,
    get_merge_fields,
)
from .exporters import (
    export_payments_csv,
    export_quickbooks_iif,
    export_quickbooks_qbo,
    export_registrations_csv,
    export_registrations_excel,
)
from .models import Event, Organization, Term


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_org(slug):
    return get_object_or_404(Organization, slug=slug)


def _get_term(org, term_id):
    return get_object_or_404(Term, pk=term_id, organization=org)


# ---------------------------------------------------------------------------
# Public Catalog Views
# ---------------------------------------------------------------------------

def org_home(request, org_slug):
    """Organization home page — lists active terms."""
    org = _get_org(org_slug)
    terms = Term.objects.filter(organization=org).order_by("-start_date")
    return render(request, "core/org_home.html", {
        "org": org,
        "terms": terms,
    })


def catalog_list(request, org_slug):
    """List all terms with catalogs."""
    org = _get_org(org_slug)
    terms = Term.objects.filter(organization=org).order_by("-start_date")
    return render(request, "core/catalog_list.html", {
        "org": org,
        "terms": terms,
    })


def catalog_detail(request, org_slug, term_id):
    """Web catalog for a specific term."""
    org = _get_org(org_slug)
    term = _get_term(org, term_id)
    ctx = get_catalog_context(org, term)
    ctx["request"] = request
    return render(request, "core/catalog_detail.html", ctx)


def catalog_pdf(request, org_slug, term_id):
    """Download catalog as PDF."""
    org = _get_org(org_slug)
    term = _get_term(org, term_id)
    try:
        pdf_bytes = generate_catalog_pdf(org, term)
    except ImportError as e:
        return HttpResponse(str(e), status=501)
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{term.name}_catalog.pdf"'
    return response


def catalog_docx(request, org_slug, term_id):
    """Download catalog as DOCX."""
    org = _get_org(org_slug)
    term = _get_term(org, term_id)
    try:
        docx_bytes = generate_catalog_docx(org, term)
    except ImportError as e:
        return HttpResponse(str(e), status=501)
    response = HttpResponse(
        docx_bytes,
        content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    response["Content-Disposition"] = f'attachment; filename="{term.name}_catalog.docx"'
    return response


def event_detail(request, org_slug, event_id):
    """Public event detail page."""
    org = _get_org(org_slug)
    event = get_object_or_404(
        Event.objects.select_related("venue", "category", "term")
        .prefetch_related("sessions", "eventspeaker_set__person", "eventhost_set__person", "prices"),
        pk=event_id,
        organization=org,
    )
    fields = get_merge_fields(event)
    return render(request, "core/event_detail.html", {
        "org": org,
        "event": event,
        "fields": fields,
    })


# ---------------------------------------------------------------------------
# Export Views (staff-only in production)
# ---------------------------------------------------------------------------

def export_mergegrid(request, org_slug, term_id):
    """Download MergeGrid-compatible Excel."""
    org = _get_org(org_slug)
    term = _get_term(org, term_id)
    xlsx_bytes = export_mergegrid_excel(org, term)
    response = HttpResponse(
        xlsx_bytes,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = f'attachment; filename="MergeGrid_{term.name}.xlsx"'
    return response


def export_registrations_csv_view(request, org_slug, term_id):
    """Download registrations as CSV."""
    org = _get_org(org_slug)
    term = _get_term(org, term_id)
    csv_str = export_registrations_csv(org, term=term)
    response = HttpResponse(csv_str, content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="registrations_{term.name}.csv"'
    return response


def export_registrations_xlsx_view(request, org_slug, term_id):
    """Download registrations as Excel."""
    org = _get_org(org_slug)
    term = _get_term(org, term_id)
    xlsx_bytes = export_registrations_excel(org, term=term)
    response = HttpResponse(
        xlsx_bytes,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = f'attachment; filename="registrations_{term.name}.xlsx"'
    return response


def export_payments_csv_view(request, org_slug):
    """Download payments as CSV."""
    org = _get_org(org_slug)
    csv_str = export_payments_csv(org)
    response = HttpResponse(csv_str, content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="payments.csv"'
    return response


def export_payments_iif_view(request, org_slug):
    """Download payments as QuickBooks IIF."""
    org = _get_org(org_slug)
    iif_str = export_quickbooks_iif(org)
    response = HttpResponse(iif_str, content_type="text/plain")
    response["Content-Disposition"] = 'attachment; filename="payments.iif"'
    return response


def export_payments_qbo_view(request, org_slug):
    """Download payments as QuickBooks QBO."""
    org = _get_org(org_slug)
    qbo_str = export_quickbooks_qbo(org)
    response = HttpResponse(qbo_str, content_type="application/xml")
    response["Content-Disposition"] = 'attachment; filename="payments.qbo"'
    return response


# ---------------------------------------------------------------------------
# Attendance Views
# ---------------------------------------------------------------------------

def attendance_sheet_view(request, org_slug, event_id):
    """View attendance sheet as HTML."""
    org = _get_org(org_slug)
    event = get_object_or_404(Event, pk=event_id, organization=org)
    html = generate_attendance_html(event)
    return HttpResponse(html)


def attendance_pdf_view(request, org_slug, event_id):
    """Download attendance sheet as PDF."""
    org = _get_org(org_slug)
    event = get_object_or_404(Event, pk=event_id, organization=org)
    try:
        pdf_bytes = generate_attendance_pdf(event)
    except ImportError as e:
        return HttpResponse(str(e), status=501)
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = (
        f'attachment; filename="attendance_{event.legacy_id or event.pk}.pdf"'
    )
    return response
