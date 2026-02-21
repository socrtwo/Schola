# Architecture

## Overview

Schola is a multi-tenant continuing education registration and administration system.
One deployment serves multiple organizations, each with isolated data, configurable
workflows, and independent branding.

## Stack

| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL |
| Backend | Django 5.x (server-rendered templates, Django ORM) |
| Excel I/O | openpyxl |
| DOCX generation | python-docx |
| PDF generation | WeasyPrint (HTML → PDF with CSS typography) |
| Task queue | None for MVP (synchronous). Celery-ready interfaces for Phase 2+. |
| Deployment | docker-compose (local dev), managed PaaS (Render/Fly), self-hosted |

## Multi-Tenant Model

### Strategy: Shared Database, Shared Schema with `org_id` Foreign Key

All tenant-scoped tables include an `organization_id` FK to `core_organization`.
Enforcement happens at two levels:

1. **Database level** — FK constraints ensure referential integrity. All queries
   filter by `organization_id`. Future option: PostgreSQL Row-Level Security (RLS).
2. **Application level** — A custom `OrgScopedManager` on all tenant models
   automatically filters querysets by the current org context. Views receive the
   org from URL routing (`/<org_slug>/...`).

### Why not schema-per-tenant?

At the expected scale (tens of orgs, not thousands), shared-schema with FK scoping
is simpler to migrate, query, and maintain. Schema-per-tenant can be adopted later
if needed.

## Django App Structure

```
schola/            # Project settings, URLs, WSGI/ASGI
core/              # Multi-tenant foundation
  models.py        # Organization, Person, Account, Role, Permission, AuditLog
  managers.py      # OrgScopedManager
  middleware.py     # Org context middleware
  admin.py
events/            # (Phase 2) Events, Terms, Venues, Scheduling, Grouping
registration/      # (Phase 2) Registration, Pricing, Bundles, Waitlist
payments/          # (Phase 2) Square integration, offline payments, refunds
imports/           # (Phase 3) Square CSV import, resident directory import
exports/           # (Phase 3) QuickBooks IIF/QBO, Excel, CSV
messaging/         # (Phase 3) Email/SMS confirmations, nudges, bulk
catalog/           # (Phase 4) Web/PDF/DOCX catalog generation, templates
```

## URL Routing

Public pages are scoped by org slug:
```
/<org_slug>/                     # Org landing / catalog
/<org_slug>/catalog/             # Public catalog browse
/<org_slug>/register/<event_id>/ # Registration form
```

Admin pages are scoped similarly:
```
/<org_slug>/admin/events/        # Event management
/<org_slug>/admin/registrations/ # Registration management
```

Platform super-admin uses Django's built-in `/admin/`.

## Configuration Per Organization

The `Organization` model holds or links to:
- Branding (name, logo, colors, contact info)
- Square credentials (encrypted)
- Email provider config (SMTP/Mailgun/SendGrid)
- Tax rules, fee policies, refund policies
- Workflow definitions (lifecycle states + gate conditions)
- Catalog template/theme selection
- Pricing tier definitions
- Bundle/discount rules
- Role/permission overrides

## Security

- OWASP top-10 mitigations (CSRF, XSS, SQLi via ORM, secure sessions)
- Rate limiting on auth endpoints
- PII access scoped to org + role
- Audit log for all sensitive changes
- No raw card data storage (Square handles PCI)
- Environment-based secrets (never committed)

## Deployment

### Local Development
```
docker-compose up    # PostgreSQL + Django dev server
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

### Production
- Managed PaaS (Render, Fly.io, Railway) with managed Postgres
- Or self-hosted with docker-compose + reverse proxy
- Static files served via whitenoise or CDN
- Environment variables for all secrets and config
