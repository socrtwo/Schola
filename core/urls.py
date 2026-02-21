"""URL configuration for the core app."""
from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    # Public catalog
    path(
        "<slug:org_slug>/",
        views.org_home,
        name="org_home",
    ),
    path(
        "<slug:org_slug>/catalog/",
        views.catalog_list,
        name="catalog_list",
    ),
    path(
        "<slug:org_slug>/catalog/<int:term_id>/",
        views.catalog_detail,
        name="catalog_detail",
    ),
    path(
        "<slug:org_slug>/catalog/<int:term_id>/pdf/",
        views.catalog_pdf,
        name="catalog_pdf",
    ),
    path(
        "<slug:org_slug>/catalog/<int:term_id>/docx/",
        views.catalog_docx,
        name="catalog_docx",
    ),
    path(
        "<slug:org_slug>/event/<int:event_id>/",
        views.event_detail,
        name="event_detail",
    ),
    # Exports (staff only)
    path(
        "<slug:org_slug>/export/mergegrid/<int:term_id>/",
        views.export_mergegrid,
        name="export_mergegrid",
    ),
    path(
        "<slug:org_slug>/export/registrations/<int:term_id>/csv/",
        views.export_registrations_csv_view,
        name="export_registrations_csv",
    ),
    path(
        "<slug:org_slug>/export/registrations/<int:term_id>/xlsx/",
        views.export_registrations_xlsx_view,
        name="export_registrations_xlsx",
    ),
    path(
        "<slug:org_slug>/export/payments/csv/",
        views.export_payments_csv_view,
        name="export_payments_csv",
    ),
    path(
        "<slug:org_slug>/export/payments/iif/",
        views.export_payments_iif_view,
        name="export_payments_iif",
    ),
    path(
        "<slug:org_slug>/export/payments/qbo/",
        views.export_payments_qbo_view,
        name="export_payments_qbo",
    ),
    # Attendance sheets
    path(
        "<slug:org_slug>/attendance/<int:event_id>/",
        views.attendance_sheet_view,
        name="attendance_sheet",
    ),
    path(
        "<slug:org_slug>/attendance/<int:event_id>/pdf/",
        views.attendance_pdf_view,
        name="attendance_pdf",
    ),
]
