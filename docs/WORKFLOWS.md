# Workflows

## 1. Event Lifecycle

The event lifecycle is **configurable per organization**. Each org defines its own
set of states and gate conditions. The Sampleschool School defaults are shown below.

### Sampleschool School Default States

```
Draft → Tentative → Booked → Published → Archived
```

| Transition | Gate Conditions | Who |
|-----------|----------------|-----|
| → Draft | None (initial state) | Any admin/host |
| Draft → Tentative | ID assigned, Speaker confirmed, Title, Date, Host | Dean |
| Tentative → Booked | Abstract provided, Bio provided, Graphic provided, Speaker fee agreed, Venue assigned | Host + Arrangements |
| Booked → Published | Catalog editorial approval | Catalog Editor |
| Published → Archived | Semester end date passed | Automatic or Admin |

### How Configurability Works

The `WorkflowState` model stores per-org states:
```
WorkflowState(org, name="tentative", position=2, gate_conditions={
    "has_abstract": false,
    "has_bio": false,
    "venue_id__isnull": true   # venue not yet required
})

WorkflowState(org, name="booked", position=3, gate_conditions={
    "has_abstract": true,
    "has_bio": true,
    "has_graphic": true,
    "venue_id__isnull": false,
    "speakers__fee__isnull": false
})
```

Gate conditions are stored as JSON and evaluated against the event instance.
An org can add, remove, or reorder states. The system validates that all gate
conditions are met before allowing a state transition.

## 2. Registration Flow

```
Browse Catalog → Select Event(s) → Choose Pricing Tier → Checkout → Confirmation
                                                            ↓
                                                   [Square / Check / Cash]
```

1. **Guest or Account**: Guest checkout creates a Person record without an Account.
   Account holders can view history and manage registrations.
2. **Capacity check**: If at capacity, offer waitlist. When a spot opens, the
   next waitlist entry is notified (configurable: auto-register or notify-only).
3. **Bundle detection**: If selected events match a bundle definition, offer the
   bundle price.
4. **Payment**: Square (hosted checkout or direct API) for online. Admin entry
   for checks/cash.
5. **Confirmation**: Email sent via configured provider.

### Add/Drop

- Students can drop events before a configurable cutoff date.
- Refund policy (per org) determines refund amount.
- All changes logged in AuditLog.

## 3. Square CSV Import Flow

```
Upload CSV → Detect Format (Items vs Transactions) → Validate → Preview → Import
```

1. **Format detection**: Items CSV has `SKU` column; Transactions CSV has
   `Transaction ID` + `Description`. Auto-detect or user-select.
2. **Validation**: Check required columns, parse dates/amounts, flag errors.
3. **Idempotency**: Check `Transaction ID` against existing imports. Skip duplicates.
4. **Person matching**: Match `Customer Name` to existing Person records.
   Fuzzy match with confidence scoring. Low-confidence matches flagged for admin review.
5. **SKU → Event**: Map SKU to event legacy_id or ID. Flag unrecognized SKUs.
6. **Preview**: Show matched records, flagged issues, and totals before committing.
7. **Import**: Create Payment and Registration records. Log all actions.

## 4. Catalog Editorial Workflow

```
Generate Draft → Editor Review → Host Verification → Graphic Layout → Final Export
```

1. **Generate draft**: System renders catalog body from event data using templates.
2. **Editor review**: Catalog editors revise text, reorder content, adjust formatting.
3. **Host verification**: Hosts review their events' content for accuracy.
4. **Layout**: PDF/DOCX generation with configured theme (fonts, spacing, layout).
5. **Export**: Final PDF for printer, DOCX for further editing, web pages for site.

Each revision is versioned. Approvals are tracked per-event.

## 5. Nudge Workflow

```
Weekly: Identify upcoming event group → Render nudge template → Send to audience
```

1. **Event grouping**: Find the next event group (e.g., Mon+Thu pair for Sampleschool).
2. **Template rendering**: Use nudge template with base event fields + grouped event fields.
3. **Audience**: Send to the nudge email list (configurable: all registrants,
   all residents, custom list).
4. **Scheduling**: Configurable per org (e.g., "every Sunday before a Monday event").
5. **Tracking**: Log sends, opens (if provider supports), and any bounces.
