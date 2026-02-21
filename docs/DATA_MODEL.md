# Data Model

## Entity Relationship Summary

```
Organization ──┬── Term
               ├── Person ── Account (optional)
               ├── Role ── Permission
               ├── EventCategory
               ├── Venue
               ├── WorkflowState
               ├── PricingTier
               ├── BundleDefinition ── BundleRule
               ├── RefundPolicy
               ├── EmailProviderConfig
               └── SquareConfig

Term ──┬── Event ──┬── EventSession (multi-session)
       │           ├── EventSpeaker
       │           ├── EventHost
       │           ├── EventGroupMembership ── EventGroup
       │           └── EventPrice (per tier)
       │
       └── Registration ──┬── Payment
                          ├── WaitlistEntry
                          └── Attendance

AuditLog (global, references any model)
```

## Legacy Grid → Normalized Schema Mapping

| Grid Column | New Table.Field | Notes |
|-------------|----------------|-------|
| `ID` | `Event.legacy_id` | Preserved for migration; new system uses UUID/auto PK |
| `Day`, `Date`, `Time` | `EventSession.day_of_week`, `.date`, `.start_time` | Normalized into sessions |
| `Venue` | `Event.venue` → `Venue` FK | |
| `Host` | `EventHost` (M2M through) | Distinct from speaker |
| `Speaker` | `EventSpeaker` (M2M through) | |
| `Title` | `Event.title` | |
| `ShortTitle` | `Event.short_title` | |
| `Abstract` | `Event.abstract` | |
| `Profile` | `EventSpeaker.bio` | Per-speaker, not per-event |
| `Cost` | `EventSpeaker.fee` | **Speaker expense**, not student price |
| `PreFee` | `EventPrice.amount` (tier=default, timing=pre) | Student registration price |
| `WalkFee` | `EventPrice.amount` (tier=default, timing=walk) | Walk-in student price |
| `Abs`, `Bio`, `Pix` | `Event.has_abstract`, `.has_bio`, `.has_graphic` | Gate condition flags |
| `Nudge` | `Event.nudge_sequence` | "1st", "2nd", "skip", etc. |
| `NudgeText` | `Event.nudge_text` | |
| `Word`, `Phrase` | `Event.keyword`, `Event.phrase` | For nudge/flyer templates |
| `IsAre` | `Event.speaker_verb` | Grammar: "is"/"are" |
| `Intro` | `Event.intro_text` | Dean's spoken introduction |
| `Phone`, `Email`, `Mail`, `Check` | `Person` fields on speaker | |
| `HostEmail/Phone/Cell/Unit` | `Person` fields on host | |
| `Topic`, `TopicLink`, `SpeakLink`, `BooksLink`, `GraphicLink` | `Event` URL fields | |
| `PreReg`, `WalkIn`, `Attend` | Computed from `Registration` + `Attendance` | |
| `Income` | Computed from payments − speaker fees | |
| `Vimeo`, `Survey` | `Event.vimeo_url`, `Event.survey_id` | |
| `Semester`, `BuildDate` | `Term` fields | |
| `xID`, `xDay`, `xDate`, ... | `EventGroupMembership` → `EventGroup` | Denormalized pairing → normalized grouping |

## Core Tables

### Organization
```sql
CREATE TABLE core_organization (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    contact_email   VARCHAR(254),
    contact_phone   VARCHAR(30),
    address         TEXT,
    logo_url        VARCHAR(500),
    timezone        VARCHAR(50) DEFAULT 'America/New_York',
    is_tax_exempt   BOOLEAN DEFAULT TRUE,
    tax_rate        DECIMAL(5,4) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_org_slug ON core_organization(slug);
```

### Person
```sql
CREATE TABLE core_person (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES core_organization(id),
    first_name      VARCHAR(150) NOT NULL,
    last_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(254),
    phone           VARCHAR(30),
    cell_phone      VARCHAR(30),
    address         TEXT,
    unit_number     VARCHAR(50),
    building        VARCHAR(100),
    city            VARCHAR(100),
    state           VARCHAR(50),
    postal_code     VARCHAR(20),
    is_resident     BOOLEAN DEFAULT FALSE,
    household_id    BIGINT REFERENCES core_household(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, email)
);
CREATE INDEX idx_person_org ON core_person(organization_id);
CREATE INDEX idx_person_email ON core_person(organization_id, email);
CREATE INDEX idx_person_name ON core_person(organization_id, last_name, first_name);
```

### Term / Semester
```sql
CREATE TABLE core_term (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES core_organization(id),
    name            VARCHAR(100) NOT NULL,  -- "Fall 2025"
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_active       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_term_org ON core_term(organization_id);
```

### Event
```sql
CREATE TABLE core_event (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES core_organization(id),
    term_id         BIGINT NOT NULL REFERENCES core_term(id),
    category_id     BIGINT REFERENCES core_eventcategory(id),
    venue_id        BIGINT REFERENCES core_venue(id),
    legacy_id       VARCHAR(20),
    title           VARCHAR(500) NOT NULL,
    short_title     VARCHAR(100),
    abstract        TEXT,
    nudge_text      TEXT,
    nudge_sequence  VARCHAR(20),  -- "1st", "2nd", "skip"
    keyword         VARCHAR(50),
    phrase          VARCHAR(100),
    speaker_verb    VARCHAR(20) DEFAULT 'is',  -- "is" or "are"
    intro_text      TEXT,
    topic           VARCHAR(200),
    topic_link      VARCHAR(500),
    speaker_link    VARCHAR(500),
    books_link      VARCHAR(500),
    graphic_link    VARCHAR(500),
    vimeo_url       VARCHAR(500),
    survey_id       VARCHAR(100),
    has_abstract    BOOLEAN DEFAULT FALSE,
    has_bio         BOOLEAN DEFAULT FALSE,
    has_graphic     BOOLEAN DEFAULT FALSE,
    capacity        INTEGER,
    lifecycle_state VARCHAR(50) DEFAULT 'draft',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_event_org ON core_event(organization_id);
CREATE INDEX idx_event_term ON core_event(term_id);
CREATE INDEX idx_event_state ON core_event(organization_id, lifecycle_state);
```

See `core/models.py` for the full Django model definitions including all
relationships, constraints, and methods.
