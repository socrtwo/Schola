# Phase 1 Prompt: Architecture + Data Model + Roadmap

## SYSTEM (ChatGPT Codex 5.3)

You are a senior full-stack engineer + database architect. You write secure, maintainable, production-quality code and documentation. When something is ambiguous, you:
(1) choose a reasonable default,
(2) state the assumption explicitly,
(3) design it to be configurable later.

---

## USER

### Project: Open-source Continuing Education Registration + Admin System (Sampleschool School model)

### Goal

Build an open-source, reusable, multi-organization system for continuing education schools that supports:
- Public catalog + registration (conversion-friendly UX)
- Attendance sheets
- Accounting exports (QuickBooks-compatible, Excel, CSV)
- Catalog generation (Web + PDF + Word/DOCX)
- Payments (Square hosted checkout AND Square direct API Orders/Payments)
- Import of Square reports (CSV) for reconciliation and historical data
- Built-in messaging (email + optional SMS): confirmations, waitlist notifications, nudges (see definition below), bulk messaging

### References

- Model school website: https://sampleschoolschool.org
- Legacy Square storefront (performed better historically): https://sampleschoolschool.square.site/
- A prior contractor-built Excel/VBA database existed (cost $25k+) — a copy is in the repo as `Spring-2024-Database VIII.xlsm`. The code/macros are not reusable. Rebuild from scratch, model the functionality, and improve usability/appearance to avoid revenue drops.

---

## Phase 1 Deliverables (this prompt)

This is **Phase 1 of a multi-phase build**. In this phase, produce ONLY:

1. **Step 0: Repository analysis** — Summarize what you find in the repo artifacts (tables, columns, templates, workflows, import formats). Use the embedded reference data below — do NOT attempt to open the binary files.
2. **Step 1: Assumptions list** — List every assumption you are making. State what is configurable per organization.
3. **Step 2: Architecture + Data Model + Permission Model** — Full multi-tenant data model (entities, relationships, constraints, indexes), with multi-tenant enforcement details.
4. **Step 3: Phased Roadmap** — MVP → Phase 2 → Phase 3 with clear scope boundaries.

Do NOT output application code in Phase 1. Code will be requested in subsequent phases following this architecture.

---

## Multi-organization / Multi-tenancy (REQUIRED)

One deployment must support multiple organizations/schools with strict data separation.
- Entities must be scoped to organization (`org_id`) with enforcement at DB + app layer.
- Support org-level configuration: branding, contact info, tax rules, fees, refund policies, messaging provider, Square credentials, catalog templates, pricing tiers, permissions/roles, **workflow steps** (see below).
- Provide a global super-admin role for platform operators, and org-admin roles for each organization.

### Scale

- Typical semester for Sampleschool School: ~400 students, ~35 courses/events, ~35 instructors/speakers
- Must scale to any size (no hard-coded limits)

---

## Repository Contents (Inventory)

The private GitHub repo (Schola) contains:

| File | Description |
|------|-------------|
| `2025FallGrid.xlsx` | Current semester grid workbook (3 sheets: `2025Fall`, `Columns`, `Transportation`). Contains named ranges including `MergeGrid`. |
| `Spring-2024-Database VIII.xlsm` | Legacy Excel/VBA database (~100 sheets) used to process registrations imported from Square. Contains registration matrices, attendance sheets, treasurer reports, imported Square data, resident lists, class lists, and a `2023FallGrid` sheet. |
| `DataNarrative.pdf` | 3-page document describing Sampleschool School information flow (diagram + narrative). |
| `Spring2024CatalogGreatDecisionsFixef.pdf` | 20-page sample catalog showing layout, typography, structure (Front Cover → Front Matter → Evening Events → Day Classes → End Matter → Back Cover). |
| `items-2025-07-01-2025-09-01.csv` | Square Items CSV export (1,687 rows). One row per line item. |
| `transactions-2025-07-01-2025-09-01.csv` | Square Transactions CSV export (396 rows). One row per transaction. |
| `Directory (13).csv` | Samplecommunity community resident directory (1,216 rows, 23 columns). |
| `MergeText.zip` | 14 Word MailMerge template files used to generate all products from the semester grid. |
| `101-125ClassList.xlsx` | Cross-tabulation of 25 evening courses (101-125) showing which residents are enrolled in each. |
| `251 Writing Memoirs, Creating a Legacy Spring 2025 Sampleschool School Class List.xlsx` | Sample day class roster (16 students). |
| `Paper registration pages.pdf` | Sample paper registration forms (printed for hand-fill). |
| `SampleschoolSchoolLinks.docx` | Reference links document for Sampleschool School resources. |

---

## Embedded Reference Data

Since you cannot open binary files, here are the key data structures extracted from the repo.

### A. Semester Grid Column Definitions (from `2025FallGrid.xlsx` → `Columns` sheet)

These are the columns in the semester grid. Each row in the grid is one event.

| Column | Description |
|--------|-------------|
| `ID` | Class ID (e.g., 101, 102, ... for evening; 151, 152, ... for day classes) |
| `Day` | Class day of the week |
| `Date` | Class date |
| `Venue` | Class room |
| `Host` | Host name (First Last) — the Curriculum Committee member who sponsors the speaker |
| `Speaker` | Speaker/performer name (First Last) |
| `Title` | Full event title |
| `Abs` | Checkbox: have abstract? (X = yes) |
| `Bio` | Checkbox: have bio? (X = yes) |
| `Pix` | Checkbox: have catalog graphic? (X = yes) |
| `ShortTitle` | Short title (< 50 characters) |
| `Abstract` | Full abstract text |
| `Profile` | Speaker bio (< 250 words) — called "Profile" in the grid, "Bio" in the narrative |
| `Cost` | **SPEAKER FEE** — the amount paid TO the speaker (expense, NOT the student registration price) |
| `Minimum` | Minimum (and max) enrollment for the class |
| `IsAre` | Grammar helper: "speaker is" (singular) or "speakers are" (plural) |
| `Nudge` | Nudge sequence: "1st", "2nd", "3rd", or "skip" (see Nudge definition below) |
| `Word` | 1-2 word subject keyword |
| `Phrase` | 2-4 word topic phrase |
| `NudgeText` | Short promotional paragraph for nudge emails |
| `Intro` | Expanded bio used for the Dean's spoken introduction |
| `Phone` | Speaker phone |
| `Email` | Speaker email |
| `Mail` | Speaker mailing address |
| `Check` | Make speaker check payable to... |
| `HostEmail` | Host email |
| `HostPhone` | Host 4-digit home phone |
| `HostCell` | Host cell phone |
| `HostUnit` | Host building/unit (e.g., "Diamond 416") |
| `Topic` | Class topic category |
| `TopicLink` | URL link to topic |
| `SpeakLink` | URL link to speaker |
| `BooksLink` | URL link to speaker's materials/books |
| `GraphicLink` | URL link to catalog graphic image |
| `_ID` | Copy of ID (used in formulas) |
| `PreFee` | **PRE-REGISTRATION FEE** — the price charged to students who register in advance |
| `WalkFee` | **WALK-IN FEE** — the price charged to students who register at the door |
| `PreReg` | Number of pre-registered students |
| `WalkIn` | Number of walk-in students |
| `Attend` | Total seated attendance |
| `Income` | Calculated income minus speaker cost |
| `Time` | Class start time |
| `Vimeo` | Calculated Vimeo recording link |
| `Survey` | Survey ID and title |
| `Semester` | Semester name |
| `BuildDate` | Date of first class in semester |
| `IdDayDate` | Formatted "ID day date" compound field |
| `MthDay` | Formatted "month day" |
| `First` | First name of the speaker |
| `FirstHost` | First name of the host |

**IMPORTANT — Pricing Clarification:**
- `Cost` = payment TO the speaker (an expense). This is NOT the student price.
- `PreFee` = fee charged to students for pre-registration.
- `WalkFee` = fee charged to students at the door (walk-in).
- Currently, most evening lectures have a flat $1 PreFee. Musical performances and special events charge $8. Day classes have varying fees.
- The new system should support configurable pricing tiers (Resident, Non-resident, Scholarship, Comped) per event, replacing or extending this flat-fee model.

### B. Monday/Thursday Event Pairing ("x-columns")

The grid has 13 additional columns prefixed with `x`:

| Column | Description |
|--------|-------------|
| `xID` | Thursday event ID (paired with the Monday event in the same row) |
| `xIsAre` | Thursday event's IsAre |
| `xDay` | Thursday event's day |
| `xDate` | Thursday event's date |
| `xVenue` | Thursday event's venue |
| `xHost` | Thursday event's host |
| `xTitle` | Thursday event's title |
| `xShortTitle` | Thursday event's short title |
| `xSpeaker` | Thursday event's speaker |
| `xWalkFee` | Thursday event's walk-in fee |
| `xWord` | Thursday event's keyword |
| `xPhrase` | Thursday event's phrase |
| `xNudgeText` | Thursday event's nudge text |

**How this works:** Sampleschool School runs evening events on Mondays and Thursdays. For products that advertise two events together (nudge emails, combined flyers, closing announcements), the Monday event row carries the corresponding Thursday event's data in the x-columns. This is a denormalized pattern from the Excel/MailMerge system.

In the new system, this should be modeled as an **event pairing/grouping relationship** rather than denormalized columns. The template rendering system should be able to reference paired events without requiring x-columns.

### C. MailMerge Template Inventory

The `MergeText.zip` contains 14 Word templates. Each uses `«FieldName»` merge fields that map to grid columns:

| Template | Purpose | Key Merge Fields |
|----------|---------|-----------------|
| `EveningCatalog.docx` | Printed catalog entry for evening events | ID, Title, Day, Date, Time, Venue, Speaker, Abstract, Profile, SpeakLink, BooksLink, Host |
| `DayCatalog.docx` | Printed catalog entry for day classes | ID, Title, Day, Time, Venue, Date, Speaker, Abstract, Profile, Minimum, PreFee |
| `EveningClassHtml.docx` | Web page for evening events | ID, IdDayDate, ShortTitle, Speaker, Venue, Vimeo |
| `DayClassHtml.docx` | Web page for day classes | ID, ShortTitle, Speaker, Venue, Time, Day, Date, PreFee, Host |
| `EveningFlyer.docx` | Printable evening flyer (single event) | ShortTitle, Speaker, Day, Date, Time, Venue, Host, WalkFee, ID |
| `EveningMonThurFllyer.docx` | Combined Mon/Thu flyer (two events) | All base fields + xShortTitle, xSpeaker, xDay, xDate, xVenue, xHost, xWalkFee, xID |
| `DayClassFlyer.docx` | Day class flyer | ID, ShortTitle, Speaker, Day, Time, Date, Venue |
| `Nudges.docx` | Weekly nudge email (Mon + Thu events) | ID, Date, Day, Time, Venue, Host, Title, Speaker, NudgeText, Nudge, Phrase, Word + all x-prefixed equivalents |
| `IntroText.docx` | Dean's spoken introduction script | IdDayDate, Title, IsAre, Speaker, Intro, First |
| `DinnerText.docx` | Dinner announcement (read aloud) | IdDayDate, Venue, Time, ShortTitle, IsAre, Speaker, NudgeText, Host, WalkFee |
| `CloseText.docx` | Closing remarks (previews next event) | IdDayDate, Speaker, FirstHost, Time, xDay, xVenue, xShortTitle, xIsAre, xSpeaker, xNudgeText, xHost |
| `SamplecommunityViewText.docx` | Samplecommunity View display text | ID, ShortTitle, Speaker, NudgeText |
| `SurveyText.docx` | Post-event survey label | ID, ShortTitle |
| `DayCatalogHtml.docx` | HTML catalog for day classes | ID, ShortTitle, Speaker, Venue, Time, Day, Date, PreFee, Minimum |

The complete set of unique merge fields across all templates: `Abstract`, `BooksLink`, `Date`, `Day`, `First`, `FirstHost`, `Host`, `ID`, `IdDayDate`, `Intro`, `IsAre`, `Minimum`, `Nudge`, `NudgeText`, `Phrase`, `PreFee`, `Profile`, `ShortTitle`, `SpeakLink`, `Speaker`, `Time`, `Title`, `Venue`, `Vimeo`, `WalkFee`, `Word`, `xDate`, `xDay`, `xHost`, `xID`, `xIsAre`, `xNudgeText`, `xPhrase`, `xShortTitle`, `xSpeaker`, `xTitle`, `xVenue`, `xWalkFee`, `xWord`

### D. Square CSV Export Formats

**Items CSV** (`items-*.csv`) — 33 columns, one row per line item:

```
Date, Time, Time Zone, Category, Item, Qty, Price Point Name, SKU, Modifiers Applied,
Gross Sales, Discounts, Net Sales, Tax, Transaction ID, Payment ID, Device Name, Notes,
Details, Event Type, Location, Dining Option, Customer ID, Customer Name,
Customer Reference ID, Unit, Count, GTIN, Itemization Type, Fulfillment Note, Channel,
Token, Card Brand, PAN Suffix
```

Key facts:
- `SKU` maps to the class/event ID (e.g., "101", "154", "001" for bundles)
- `Category` classifies items: "Evening Lectures", "Evening Special Performances Inc. Music and Drama", "Daytime Classes", "Shop All Listings"
- `Event Type` is either "Payment" or "Refund"
- `Customer Name` is the registrant name
- `Notes` contains the full event description (long text)
- One transaction may have multiple item rows (multi-course registration)

**Transactions CSV** (`transactions-*.csv`) — 54 columns, one row per transaction:

```
Date, Time, Time Zone, Gross Sales, Discounts, Service Charges, Net Sales,
Gift Card Sales, Tax, Tip, Partial Refunds, Total Collected, Source, Card,
Card Entry Methods, Cash, Square Gift Card, Other Tender, Other Tender Type,
Tender Note, Fees, Net Total, Transaction ID, Payment ID, Card Brand, PAN Suffix,
Device Name, Staff Name, Staff ID, Details, Description, Event Type, Location,
Dining Option, Customer ID, Customer Name, Customer Reference ID, Device Nickname,
Third Party Fees, Deposit ID, Deposit Date, Deposit Details, Fee Percentage Rate,
Fee Fixed Rate, Refund Reason, Discount Name, Transaction Status, Cash App,
Order Reference ID, Fulfillment Note, Free Processing Applied, Channel,
Unattributed Tips, Table Info
```

Key facts:
- `Transaction ID` links to the items CSV
- `Source` includes "Virtual Terminal" and "eCommerce Integrations"
- `Channel` distinguishes between "Sampleschool School" and "The Fall 2025 Semester Sampleschool School Registration Website"
- Refund rows have negative dollar amounts
- `Customer Name` identifies the registrant
- `Fees` shows Square processing fees

### E. Resident Directory Format

`Directory (13).csv` — 23 columns, 1,216 rows (Windows-1252 encoding):

```
First Name, Last Name, Title, Nickname, Move-in Date, DOB, Unit #, Address,
City, State/Province, Postal/Zip Code, Email, Cell Phone Number, Phone Number,
Bio, Interests, Gender, Marital Status, Building, Education, Military Service,
Primary Language, Secondary Language
```

This is the bulk resident import source. `Unit #` values like "Diamond Apt-416", "Trott Apt-209" identify the building and unit. Many fields use "-" as a null placeholder.

### F. Named Ranges in Grid Workbooks

From `2025FallGrid.xlsx`:
- `MergeGrid` = `2025Fall!$A$1:$BK$36` (all active columns and rows)
- `Booking` = `2025Fall!$A$1:$J34` (core booking fields: ID through Pix)
- `Preview` = `2025Fall!$A$1:$G$36` (ID, Day, Date, Venue, Host, Speaker, Title)
- `Rooms` = `2025Fall!$A$1:$S$36`
- `Paul` = `2025Fall!$A$1:$AP$36`

From `Spring-2024-Database VIII.xlsm`:
- `MergeGrid` = `2023FallGrid!$A$1:$AV$35`
- `BookingGrid` = `2023FallGrid!$A$1:$O$35`
- `_xlnm.Database` = `Database!$A$3:$AQ$884` (the main registration database)
- `Schedule` = `2023FallGrid!$A$1:$G$35`

---

## Sampleschool School Workflow (CONFIGURABLE per organization)

The following workflow is specific to Sampleschool School but must be modeled as **configurable workflow steps** that other organizations can customize or disable. The system should allow each org to define their own event lifecycle stages and gate conditions.

### Sampleschool School Event Lifecycle

1. **Candidate identification**: Curriculum Committee members, residents, or outside organizations identify speaker/performer candidates. All candidates are sponsored by a Host (a Curriculum Committee member).
2. **Candidate vetting**: The Host verifies the candidate is a qualified public speaker via video or interview (personal, video, or phone). Email-only exchange does NOT qualify. The Host confirms Speaker, Title, Date/Time, Email, and Cellphone.
3. **Committee review**: The Host presents the candidate to the Curriculum Committee.
4. **Tentative booking**: If accepted, the Dean assigns an event ID on the date and the event enters the grid as **Tentative**. At this point the grid has: ID, Day, Date, Host, Speaker, Title, Email, Phone.
5. **Arrangements**: The Arrangements committee uses tentative booking data to assign a Venue.
6. **Booked**: When Abstract, Bio (< 250 words), Graphic, and Fee are collected from the speaker, the event becomes **Booked**.
7. **Published**: The event is published to the catalog and website.
8. **Archived**: After the semester ends.

Gate conditions for Tentative → Booked:
- Abstract provided (Abs = X)
- Bio/Profile provided (Bio = X)
- Graphic provided (Pix = X)
- Speaker fee agreed (Cost field populated)
- Venue assigned (Venue field populated)

### Migration Bridge

Implement BOTH:
- **Option A**: Export a "MergeGrid-compatible" Excel view for legacy MailMerge (for migration period)
- **Option B**: Built-in template rendering that replaces MailMerge (the long-term default). Templates should support the same merge field names listed in Section C above.

---

## Definition: "Nudge" System

A **nudge** is a weekly promotional reminder email sent to registered community members previewing the upcoming week's evening events (Monday + Thursday). Each nudge covers TWO events (the paired Monday and Thursday event).

How nudges work:
- The `Nudge` column in the grid contains a sequence value: "1st", "2nd", "3rd", etc., or "skip" (meaning this event should not get its own nudge and is promoted within the prior event's nudge).
- The nudge email template uses fields from both the Monday event (base fields) and the paired Thursday event (x-prefixed fields).
- Content includes: event title, speaker, date/day/time/venue, host, and `NudgeText` (a short promotional summary of the event).
- Nudges are sent on a schedule defined by the org (typically weekly before each Monday event).
- The system should support configurable nudge schedules, audience targeting, and template customization per organization.

---

## Core Functional Requirements

### A) People / Accounts / Imports

- Support BOTH guest registration and account-based registration.
- Maintain People records (PII): name, address, phone, email; optionally household grouping.
- Support bulk import of resident lists (CSV/Excel) matching the format in Section E above.
- Re-import must safely update (idempotent):
  - Match primarily on email
  - Secondary matching strategy (configurable)
  - Conflict detection with admin review UI (do not silently overwrite ambiguous matches)
- People may exist without accounts; allow invite/claim flows.

### B) Roles / Permissions (RBAC + configurable)

Built-in roles (per organization):
- Admin
- Catalog Editor
- Host
- Instructor
- Registrar
- Assistant Registrar (paper/check registration)
- Treasurer
- Assistant Treasurer

Plus custom roles with configurable permissions.

Requirements:
- Least-privilege RBAC now (module/action permissions).
- Clean extension path toward field-level access control later.
- Admin audit log for changes affecting: PII, financial data, publication/catalog content, role/permission changes.

### C) Courses/Events, Terms, Venues

- Term/semester management (per org).
- Event lifecycle states must support the configurable workflow described above. Default states: Draft → Tentative → Booked → Published → Archived.
- **Event type/category field** (required for bundle classification): e.g., "Evening Lecture", "Evening Performance (Music/Drama/Dance)", "Daytime Class". Configurable per org.
- Venues/rooms, scheduling (date/time), and seat capacity.
- Instructor/speaker and host relationships (distinct roles).
- **Event pairing** — support grouping events (e.g., Monday + Thursday pairs for nudges and combined flyers) as a relationship, not as denormalized columns.

### D) Registration + Pricing Tiers

- Students can register for multiple events per term.
- Capacity limits + waitlist.
- Support add/drop, cancellations, refunds, partial payments (policy configurable).
- Pricing tiers must be supported:
  - Resident
  - Non-resident
  - Scholarship
  - Comped seat
- Pricing may vary per event, per tier, and may be time-based (e.g., early-bird pricing — optional if easy).

### E) Bundles + Discounts (feature-flagged per organization)

Support bundles and discount rules even if some orgs disable them.

Bundle types are **configurable per organization**. For Sampleschool School, the bundles are:
- All evening events (all courses in the 100-series)
- Evening lectures only (events categorized as "Evening Lecture")
- Evening performances only (events categorized as "Evening Performance (Music/Drama/Dance)")

Custom bundle definitions should be supported (arbitrary grouping by event type/category).

Discounting:
- Allow percentage or fixed discounts
- Allow conditional discounts (bundle-only, tier-specific, early registration, promo code)
- **Note:** Sampleschool School currently does not offer discounts on bundles (bundles are full price), but the system must support discounts for other organizations.

Design as a simple rules/policy engine or configurable tables (keep it maintainable).

### F-1) Accounting Exports — QuickBooks + Excel + CSV

The system must support multiple export formats for accounting/bookkeeping:

- **QuickBooks IIF** (Intuit Interchange Format) — tab-delimited journal entry imports
- **QuickBooks QBO** (Web Connect / OFX-based) — bank-feed-style imports
- **Customizable CSV** — user-definable column layouts for any accounting system
- **Excel (.xlsx)** — with configurable column selection and formatting

Each organization should be able to configure which export format(s) they use and customize the column mapping for CSV exports. The system must correctly itemize: registration fees, processing/service fees, taxes (if applicable), refunds, and speaker expense payments.

### F-2) Taxes & Fees (configurable per organization)

- Support tax-exempt and taxable scenarios. (Sampleschool School is currently tax-exempt; all Square data shows $0 tax.)
- Support configurable taxes (rate-based, optional per product category).
- Support configurable processing/service fees (fixed or percentage; included or added on checkout).
- Ensure exports and receipts itemize taxes/fees correctly.

### G) Payments + Square + Offline Checks

- Never store raw card data.
- Support Square integration in BOTH modes:
  1. Hosted checkout links
  2. Direct API Orders/Payments (more integrated)
- Support offline payments: checks/cash with admin entry and reconciliation workflow.
- Support refunds aligned with configured refund policies:
  - full refund before date X
  - partial after
  - admin-only
  - fully manual
- These must be configurable per organization and overridable per registration with audit logging.

### H) Square CSV Import (reconciliation + historical import)

- Provide robust import tooling supporting BOTH Square CSV formats:
  1. **Items CSV** (33 columns, format in Section D above) — line-item level
  2. **Transactions CSV** (54 columns, format in Section D above) — transaction level
- Link items to transactions via `Transaction ID`
- Map `SKU` to event ID, `Customer Name` to People records, `Category` to event type
- Requirements:
  - Column mapping + validation
  - Idempotency (safe to re-run; detect already-imported transactions by Transaction ID)
  - Error reporting (row-level errors + warnings)
  - Linking payments to registrations/people even with imperfect identifiers (fuzzy name matching with admin review)

### I) Messaging (built-in)

- Built-in messaging for:
  - Registration confirmations
  - Payment receipts
  - Waitlist notifications
  - Cancellations/changes
  - **Nudges**: weekly promotional emails covering paired events (see Nudge definition above)
  - Bulk messaging (role-gated)
- Email provider selection per organization:
  - SMTP
  - Mailgun
  - SendGrid
- SMS support should be architected as a provider interface (email + SMS adapters). Implement the interface and stub SMS provider with clear TODO.

### J) Catalog Generation (Web + PDF + DOCX) with configurable typography/layout

- Generate:
  1. Web catalog pages
  2. PDF catalog (print-friendly)
  3. Word/DOCX catalog
- Catalog structure (based on Sampleschool School model):
  - Front Matter: Officers, Title Page, Education Awards, Contents
  - Main Body: Evening Events section, Day Classes section
  - End Matter: Directions, Other Education, Registration Instructions, Paper Registration
- Catalog must be template-driven and support configurable fonts, spacing, and layout rules per organization (theme system).
- Support editorial workflow: drafts, revisions, approvals, final export.
- Must be able to render the same merge fields used in the existing templates (Section C).

---

## Non-functional Requirements

- Security: OWASP basics, CSRF, secure sessions, rate limiting on auth endpoints, least-privilege permissions.
- Privacy: protect PII, audit logs, scoped access per org.
- Accessibility: aim for WCAG 2.1 AA on public pages.
- Performance: indexes, pagination, avoid N+1, scalable multi-tenant filtering.

---

## Implementation Defaults (choose to reduce churn)

- PostgreSQL.
- Django 5.x backend with server-rendered templates for MVP (fast to ship, easy to host).
- openpyxl for Excel import/export + MergeGrid compatibility.
- python-docx for DOCX generation.
- Pick ONE for PDF:
  - HTML→PDF (e.g., WeasyPrint) recommended for CSS-based typography control
  - OR ReportLab
  Explain your choice and keep it consistent.

---

## Hosting / Deployment

- Start with managed hosting support (Render/Fly/Heroku-style), but allow self-hosting.
- Provide docker-compose for local dev (web + db).
- Environment-based configuration; do not commit secrets.
- Structured logging + basic observability hooks.
- Admin audit trails.

---

## Full Project Deliverables (across ALL phases)

For reference, here is the complete scope. Phase 1 (this prompt) produces items 1-4 only.

**Phase 1 (this prompt): Architecture**
1. Repository analysis summary
2. Assumptions list
3. Architecture + data model + permission model
4. Phased roadmap

**Phase 2 (next prompt): Data model + core backend**
5. Django models + migrations + seed/demo data
6. Multi-org CRUD, term management, event lifecycle
7. Registration (guest + account), capacity + waitlist
8. Pricing tiers, offline payment entry

**Phase 3: Import + export + messaging**
9. Square CSV import tool (both formats)
10. Exports: CSV + Excel + QuickBooks (IIF + QBO + customizable CSV)
11. Attendance sheets (printable HTML + PDF)
12. Messaging: email confirmations + waitlist notifications + nudges

**Phase 4: Catalog generation + deployment**
13. Web catalog
14. PDF catalog (WeasyPrint)
15. DOCX catalog
16. Template rendering system (replacing MailMerge)
17. docker-compose + deployment guide + CI

**Phase 5: Documentation**
18. ARCHITECTURE.md, DATA_MODEL.md, WORKFLOWS.md, IMPORT_SQUARE.md, EXPORTS.md, CATALOG_GENERATION.md, MESSAGING.md, SECURITY.md

---

## Required Response Format for Phase 1

**Step 0:** Analyze the embedded reference data above. Summarize findings in a structured table: entities discovered, column mappings, template products, import/export formats, workflow states.

**Step 1:** List every assumption. For each, state what is configurable per organization. Call out any remaining ambiguities.

**Step 2:** Full architecture and data model:
- Entity-relationship diagram (text-based)
- All tables with columns, types, constraints, and indexes
- Multi-tenant enforcement strategy (DB-level + app-level)
- Permission model (RBAC tables, role definitions, audit log schema)
- How the legacy grid columns map to the normalized schema

**Step 3:** Phased roadmap with:
- Clear scope for each phase
- Dependencies between phases
- Estimated complexity (S/M/L) per feature
- What can be parallelized

If anything is unclear, state the ambiguity, choose a reasonable default, and proceed.
