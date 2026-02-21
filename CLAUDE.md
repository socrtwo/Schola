# Schola — Continuing Education Registration + Admin System

## Project Overview

Build an open-source, reusable, **multi-organization** system for continuing education schools.
The reference implementation is modeled on the Sampleschool School (https://sampleschoolschool.org), a
continuing education program at Sample Retirement Community in Sampletown, MD.

A prior contractor-built Excel/VBA database existed (cost $25k+). A copy is in the repo as
`Spring-2024-Database VIII.xlsm` — the macros are not reusable. Rebuild from scratch, model
the functionality, and improve usability/appearance.

Legacy Square storefront: https://sampleschoolschool.square.site/

## Before You Start — Read the Repo

This repo contains real operational data and reference documents. **You must examine them
before designing or writing any code.** Use `openpyxl` (install it) to read the Excel files,
`python-docx` for the Word templates, and standard CSV/PDF tools for everything else.

### File Inventory

| File | What to examine |
|------|-----------------|
| `2025FallGrid.xlsx` | **Start here.** The canonical semester grid. Has 3 sheets: `2025Fall` (one row per event, 63 columns), `Columns` (data dictionary), `Transportation`. Has named ranges including `MergeGrid`. Read the `Columns` sheet to understand every field. |
| `Spring-2024-Database VIII.xlsm` | Legacy database (~100 sheets). Key sheets: `Database` (registration matrix — ~880 rows × ~40 event columns), `Imported Data` (raw Square import), `order2` (processed Square data), `ResidentList`, `Treasurers-Report`, `CoursesRegisteredAndAttended`, `Paper Registrations`, `FinalSpringPreregistered`, numbered sheets `1`–`25` and `51`–`59` (per-class attendance/enrollment), `Nudge-EMail-List`, `Stakeholders`, `2023FallGrid` (older grid with different column order). |
| `DataNarrative.pdf` | 3-page information flow diagram + narrative. Read this for workflow understanding. |
| `Spring2024CatalogGreatDecisionsFixef.pdf` | 20-page sample catalog: Front Cover → Front Matter (Officers, Title, Education Awards) → Evening Events → Day Classes → End Matter (Directions, Other Education, Registration Instructions, Paper Registration) → Back Cover. This is the target output format. |
| `items-2025-07-01-2025-09-01.csv` | Square Items CSV (33 cols, ~1,687 rows). One row per line item. `SKU` maps to event ID. `Category` classifies events. |
| `transactions-2025-07-01-2025-09-01.csv` | Square Transactions CSV (54 cols, ~396 rows). One row per transaction. Links to items via `Transaction ID`. |
| `Directory (13).csv` | Resident directory (23 cols, ~1,216 rows, Windows-1252 encoding). Bulk import source. |
| `MergeText.zip` | 14 Word MailMerge templates. Unzip and extract merge field names with `python-docx`. These define all product output formats. |
| `101-125ClassList.xlsx` | Cross-tabulation: 25 evening courses × enrolled residents. |
| `251 Writing Memoirs, Creating a Legacy Spring 2025 Sampleschool School Class List.xlsx` | Sample day class roster. |
| `Paper registration pages.pdf` | Sample printed paper registration forms. |
| `SampleschoolSchoolLinks.docx` | Reference links for Sampleschool School resources. |

### Critical Data Distinctions (read carefully)

**Pricing columns — do NOT confuse these:**
- `Cost` = payment **TO** the speaker (an expense). This is **NOT** the student registration price.
- `PreFee` = fee charged **to students** for pre-registration.
- `WalkFee` = fee charged **to students** at the door (walk-in).
- Currently: evening lectures = $1 PreFee, musical performances/special events = $8, day classes vary.

**The "x-columns" (Monday/Thursday pairing):**
The grid has 13 columns prefixed with `x` (xID, xDay, xDate, xVenue, xHost, xTitle,
xShortTitle, xSpeaker, xWalkFee, xWord, xPhrase, xNudgeText, xIsAre). These carry a paired
Thursday event's data on the Monday event's row — a denormalized pattern from
Excel/MailMerge for products that advertise two events together (nudges, combined flyers,
closing announcements).

**In the new system:** model this as a generic **event grouping** relationship (not denormalized
columns). Groups can contain any number of events on any days. Sampleschool's Mon/Thu pairing
is one configuration of this general capability.

**"Profile" vs "Bio":** The grid column `Profile` is what the DataNarrative calls "Bio." They are
the same field (speaker bio, < 250 words).

---

## Multi-tenancy (REQUIRED)

One deployment supports multiple organizations with strict data separation.
- All entities scoped to `org_id`, enforced at DB (FK constraints, RLS or middleware) + app layer.
- Org-level config: branding, contact info, tax rules, fees, refund policies, messaging provider,
  Square credentials, catalog templates, pricing tiers, permissions/roles, **workflow steps**.
- Global super-admin role for platform operators. Org-admin roles per organization.

### Scale
- Sampleschool School typical semester: ~400 students, ~35 events, ~35 instructors
- No hard-coded limits.

---

## Sampleschool School Workflow (CONFIGURABLE per org)

These workflow steps are Sampleschool-specific but must be modeled as **configurable stages and
gate conditions** that other orgs can customize, reorder, or disable.

### Event Lifecycle (Sampleschool School defaults)

1. **Candidate identification** — Curriculum Committee members, residents, or outside orgs
   identify speaker candidates. All candidates sponsored by a Host (Committee member).
2. **Candidate vetting** — Host verifies via video or interview (personal, video, phone).
   Email-only does NOT qualify. Host confirms Speaker, Title, Date/Time, Email, Cell.
3. **Committee review** — Host presents candidate to Curriculum Committee.
4. **Tentative booking** — Dean assigns event ID; enters grid with: ID, Day, Date, Host,
   Speaker, Title, Email, Phone.
5. **Arrangements** — Arrangements committee assigns Venue using tentative data.
6. **Booked** — When Abstract, Bio (< 250 words), Graphic, and Fee collected. Gate conditions:
   Abs=X, Bio=X, Pix=X, Cost populated, Venue populated.
7. **Published** — Event visible in catalog and on website.
8. **Archived** — After semester ends.

Other orgs should be able to define different states, different gates, or skip steps entirely.

### Migration Bridge (implement both)

- **Option A:** Export a MergeGrid-compatible Excel view so legacy Word MailMerge still works
  during transition.
- **Option B:** Built-in template rendering that replaces MailMerge (long-term default). Must
  support the same field names found in the MergeText templates.

---

## Definition: "Nudge"

A **nudge** is a weekly reminder email sent to community members discussing the upcoming
week's evening lectures or performances. Each nudge covers the grouped events for that week
(for Sampleschool School: Monday + Thursday).

- Grid column `Nudge` contains sequence: "1st", "2nd", "3rd", or "skip" (skip = promoted
  within prior nudge).
- Template uses base fields (Monday event) + x-prefixed fields (Thursday event).
- Content: title, speaker, date/day/time/venue, host, NudgeText (promotional summary).
- Schedule configurable per org. Audience targeting configurable.

---

## Core Functional Requirements

### A) People / Accounts / Imports
- Support BOTH guest and account-based registration.
- People records (PII): name, address, phone, email; optional household grouping.
- Bulk import of resident lists (CSV/Excel) matching `Directory (13).csv` format.
- Idempotent re-import: match on email (primary), configurable secondary strategy,
  conflict detection with admin review UI (no silent overwrites).
- People may exist without accounts; support invite/claim flows.

### B) Roles / Permissions (RBAC + configurable)
Built-in roles per org: Admin, Catalog Editor, Host, Instructor, Registrar,
Assistant Registrar, Treasurer, Assistant Treasurer. Plus custom roles.

- Least-privilege RBAC (module/action permissions).
- Extension path toward field-level access control.
- Audit log for changes to: PII, financial data, catalog content, role/permission changes.

### C) Courses/Events, Terms, Venues
- Term/semester management per org.
- Configurable event lifecycle (default: Draft → Tentative → Booked → Published → Archived).
- **Event type/category** (e.g., "Evening Lecture", "Evening Performance", "Daytime Class").
  Configurable per org. Required for bundle classification.
- **Flexible scheduling:** Events on any day(s), any time(s), regular or irregular intervals.
  No hard-coded day/time patterns. Support multi-session events (e.g., 12-Friday class)
  with single registration. Sampleschool's Mon/Thu 7:30 PM is just one example.
- Venues/rooms, date/time scheduling, seat capacity.
- Instructor/speaker and host as distinct roles.
- **Event grouping:** Arbitrary grouping of events (not just pairs, not just Mon/Thu).
  Multiple group types per org (nudge group, flyer group, catalog section, etc.).

### D) Registration + Pricing Tiers
- Register for multiple events per term.
- Capacity limits + waitlist.
- Add/drop, cancellations, refunds, partial payments (policy configurable).
- Pricing tiers: Resident, Non-resident, Scholarship, Comped. Configurable per event + tier.
  May be time-based (early-bird) if straightforward.

### E) Bundles + Discounts (feature-flagged per org)
Bundles are **fully configurable**. A bundle can include any combination of offerings — by
event type/category, schedule pattern, tag, or manual selection. Not limited to specific
days or times.

Sampleschool School bundles: all evening events, evening lectures only, evening performances only.
Other orgs might: bundle Saturday workshops, topic areas, pick-any-N packages, etc.

Discounting: percentage or fixed; conditional (bundle-only, tier-specific, early registration,
promo code). Sampleschool currently offers no bundle discounts (full price), but the system must
support discounts for other orgs.

### F) Accounting Exports
- **QuickBooks IIF** (tab-delimited journal entries)
- **QuickBooks QBO** (OFX-based bank feed)
- **Customizable CSV** (user-definable column layouts)
- **Excel (.xlsx)** (configurable columns and formatting)
- Per-org format selection and column mapping config.
- Must itemize: registration fees, processing fees, taxes, refunds, speaker expenses.

### G) Taxes & Fees (configurable per org)
- Tax-exempt and taxable scenarios. Sampleschool is tax-exempt.
- Configurable tax rates, optional per product category.
- Configurable processing/service fees (fixed or %; included or added at checkout).
- Exports and receipts must itemize correctly.

### H) Payments + Square + Offline
- Never store raw card data.
- Square integration in BOTH modes: hosted checkout links AND direct API Orders/Payments.
- Offline payments: checks/cash with admin entry + reconciliation.
- Configurable refund policies per org (full before date X, partial after, admin-only,
  fully manual). Overridable per registration with audit logging.

### I) Square CSV Import
Support BOTH Square CSV formats found in the repo:
1. **Items CSV** (33 cols) — line-item level, one row per item.
2. **Transactions CSV** (54 cols) — transaction level, one row per transaction.

Link via `Transaction ID`. Map `SKU` → event ID, `Customer Name` → People, `Category` → event type.

Requirements: column mapping, validation, idempotency (by Transaction ID), row-level error
reporting, fuzzy name matching with admin review for ambiguous links.

### J) Messaging
- Registration confirmations, payment receipts, waitlist notifications, cancellations,
  nudges (see definition above), bulk messaging (role-gated).
- Email provider per org: SMTP, Mailgun, SendGrid.
- SMS: architect as provider interface; stub SMS adapter with TODO.

### K) Catalog Generation (Web + PDF + DOCX)
- Web catalog pages, print-friendly PDF, Word/DOCX.
- Structure (Sampleschool model): Front Matter → Evening Events → Day Classes → End Matter.
- Template-driven with configurable fonts/spacing/layout per org (theme system).
- Editorial workflow: drafts, revisions, approvals, final export.
- Must render the same merge fields as the existing MailMerge templates.

---

## Non-functional Requirements
- Security: OWASP basics, CSRF, secure sessions, rate limiting, least-privilege.
- Privacy: protect PII, audit logs, scoped access per org.
- Accessibility: WCAG 2.1 AA on public pages.
- Performance: indexes, pagination, no N+1, scalable multi-tenant filtering.

## Tech Stack
- PostgreSQL
- Django 5.x with server-rendered templates for MVP
- openpyxl for Excel import/export
- python-docx for DOCX generation
- WeasyPrint for PDF (HTML→PDF with CSS typography control) — preferred over ReportLab

## Deployment
- docker-compose for local dev (web + db)
- Managed hosting support (Render/Fly/Heroku-style) + self-hosting
- Environment-based config; never commit secrets
- Structured logging + observability hooks

---

## Phased Build Plan

Work iteratively, one phase at a time. Each phase should produce working, tested code
committed to the repo.

### Phase 1: Architecture + Data Model
- Examine all repo files (use openpyxl, python-docx, csv module — actually read them)
- Write `docs/ARCHITECTURE.md` — multi-tenant model, modules, stack, deployment
- Write `docs/DATA_MODEL.md` — entities, relationships, constraints, indexes; map legacy
  grid columns to normalized schema
- Write `docs/WORKFLOWS.md` — event lifecycle, registration flow, editorial catalog process
- Create Django project scaffold with models + migrations
- Seed/demo data: sample org, term, events, users (with roles), registrations, payments
- Tests for: tenant scoping, event lifecycle state transitions

### Phase 2: Core Backend
- Multi-org CRUD, term management
- Event CRUD + configurable lifecycle states + gate conditions
- Registration (guest + account), capacity + waitlist logic
- Pricing tiers (resident/non-resident/scholarship/comped)
- Bundle definitions + discount rules engine
- Offline payment entry + reconciliation
- Tests for: capacity/waitlist, pricing calculations, bundle logic, refund policies

### Phase 3: Import + Export + Messaging
- Square CSV import tool (both Items and Transactions formats from repo)
- Accounting exports: CSV, Excel, QuickBooks IIF, QBO, customizable CSV
- Attendance sheets (printable HTML + PDF)
- Messaging: email confirmations, waitlist notifications, nudges
- Email provider abstraction (SMTP/Mailgun/SendGrid) + SMS stub
- Tests for: Square import idempotency, export accuracy, email rendering

### Phase 4: Catalog + Templates + Deployment
- Web catalog (public browse/filter per org)
- PDF catalog via WeasyPrint
- DOCX catalog via python-docx
- Template rendering system replacing MailMerge (support same field names)
- MergeGrid-compatible Excel export (migration bridge)
- docker-compose + deployment guide + CI (lint/test)
- Write remaining docs: IMPORT_SQUARE.md, EXPORTS.md, CATALOG_GENERATION.md,
  MESSAGING.md, SECURITY.md

---

## How to Work

1. **Always read before writing.** Examine the actual files in the repo before designing
   schemas or writing code. Use Python to parse Excel, CSV, and DOCX files.
2. **Commit after each meaningful unit of work.** Don't batch everything into one commit.
3. **Write tests for critical logic:** tenant scoping, capacity/waitlist, pricing/bundles,
   refund calculations, Square import idempotency, export formats.
4. **When something is ambiguous:** choose a reasonable default, state the assumption in a
   code comment or doc, and make it configurable.
5. **Don't over-engineer.** Start with the simplest working implementation. Add complexity
   only when the requirements demand it.
