# Prompt Review: Continuing Education Database (Codex 5.3)

This document analyzes the ChatGPT Codex 5.3 prompt for completeness, ambiguities,
potential misunderstandings, and missing reference documents in the Schola GitHub repository.

---

## 1. Repository Inventory vs. Prompt Claims

The prompt states that the repo contains four categories of input. Here is what was found:

| Prompt Claim | File Found | Status |
|---|---|---|
| "at least one prior-semester database copy used to process registrations imported from Square reports" | `Spring-2024-Database VIII.xlsm` (4.0 MB, 100+ sheets) | **Present** |
| "A sample catalog file the system must be able to produce" | `Spring2024CatalogGreatDecisionsFixef.pdf` (20 pages) | **Present** |
| "A Data Narrative describing Sampleschool School information flow" | `DataNarrative.pdf` (3 pages) | **Present** |
| "A semester grid Excel workbook with a Columns sheet and MergeGrid named range" | `2025FallGrid.xlsx` (3 sheets: 2025Fall, Columns, Transportation) | **Present** |

All four claimed inputs exist in the repo.

---

## 2. Missing Reference Documents

The following artifacts are **referenced in the prompt or DataNarrative but are NOT in the repo**. An LLM receiving this prompt will not have access to them and will have to guess or ask.

### 2.1 Critical Missing Items

| Missing Artifact | Where Referenced | Impact |
|---|---|---|
| **Standalone Square CSV report file** | Prompt section H: "Must support at least one real report format found in the repo artifacts" | The `Imported Data` and `order2` sheets inside the .xlsm show imported Square data, but there is no actual `.csv` file. The LLM can infer the column structure from those sheets, but column order, encoding, header labels, and multi-row-per-order structure may differ from the raw CSV export. **Recommendation: upload at least one raw Square Orders CSV export.** |
| **MailMerge template files** | DataNarrative page 2: "template files for the products are in the SampleschoolSchoolOrg/MergeText folder" | These Word templates with merge fields define the actual products (flyers, nudges, catalog body, intros, announcements). Without them, the LLM has no specification for what each product looks like. **Recommendation: upload at least the catalog main body template and one nudge/flyer template.** |
| **Sample QuickBooks export format** | Prompt section E (Exports): "QuickBooks-compatible" | The prompt requires generating QuickBooks-compatible exports but provides no example of the expected format (IIF, QBO, or CSV with specific columns). **Recommendation: upload a sample QuickBooks import file or specify the exact format (e.g., IIF journal entry, QBO bank feed, or a specific CSV column layout).** |
| **Sample attendance sheet (formatted)** | Prompt MVP: "Attendance sheets (printable HTML + PDF)" | The database has `201 Attendance Sheet` and `202 Attendance Sheet` tabs with raw data (Name, Reg'd, Address, Phone) but no formatted/printable layout. **Recommendation: upload a sample printed attendance sheet showing the desired layout.** |
| **Paper registration form** | DataNarrative page 3: End Matter includes "Paper Registration sheets" | No sample paper registration form is in the repo. **Recommendation: upload a sample paper registration form.** |
| **Standalone resident list CSV** | Prompt section A: "Support bulk import of resident lists (CSV/Excel)" | The `ResidentList` sheet (1,374 rows) exists inside the .xlsm but no standalone import file. The LLM could extract the format, but a real CSV sample with the expected column headers would reduce guesswork. |

### 2.2 Nice-to-Have Missing Items

| Missing Artifact | Impact |
|---|---|
| **Sample flyer, nudge email, announcement, or intro** | The DataNarrative lists ~10 product types but provides no samples of any except the catalog PDF. |
| **"Sampleschool School Links" page** | DataNarrative page 2 says "Current read-only documentation is available at Sampleschool School Links" — this URL is not provided and would give additional workflow context. |
| **Sample cover artwork** | DataNarrative page 3: "Semester unique Front and Back catalog covers are created by Lori Schulman" — no sample covers included. |
| **Prior semester grid** | `2023FallGrid` exists as a sheet inside the .xlsm but is an older format (different column ordering). Having a separate clean prior grid file would help validate migration logic. |
| **Historical registration/financial summary** | Useful for validating that import/export logic produces correct totals. |

---

## 3. Ambiguities and Potential Misunderstandings

### 3.1 Data Model Confusions (HIGH RISK)

**A. "Cost" column vs. student registration fees.**
The Grid column `Cost` (column N) is the **speaker fee** paid TO the speaker (e.g., $500, $200, $0 for volunteer speakers). The **student registration fees** are in the `PreFee` and `WalkFee` columns (columns AJ-AK). In the actual data, most events show a registration fee of `$1` (symbolic/nominal) and `$8` for musical performances. The prompt's pricing tier discussion (Resident, Non-resident, Scholarship, Comped) does not map to anything in the existing data — the current system appears to have a single flat fee per event plus a performance surcharge. An LLM may confuse speaker cost with student price, leading to an incorrect data model.

**Recommendation:** Add a paragraph clarifying:
- `Cost` = payment to speaker (expense)
- `PreFee` = pre-registration fee charged to student
- `WalkFee` = walk-in fee charged to student
- How the pricing tier system (Resident/Non-resident/Scholarship/Comped) maps to or replaces the current flat-fee model

**B. The Monday/Thursday "x-column" pairing pattern.**
The Grid has 13 columns prefixed with `x` (xID, xDay, xDate, xVenue, xHost, xTitle, xShortTitle, xSpeaker, xWalkFee, xWord, xPhrase, xNudgeText). The Columns sheet says "xKey is Thursday paired with Monday." This appears to be a pattern where Monday and Thursday events are paired for nudge emails and flyers — each Monday event row also carries the corresponding Thursday event data in the x-columns.

This pairing pattern is nowhere mentioned in the prompt. An LLM will see these columns and either ignore them or make incorrect assumptions. If this pairing is important for nudge/flyer generation, it should be explicitly described.

**C. Event ID numbering convention.**
The data shows evening events numbered in the 100s (101-125 range) and day classes in the 150s+ (151-157). This convention is implicit, not documented. If the new system should preserve or replicate this scheme, it should be stated.

**D. The `Imported Data` sheet has a multi-row-per-order structure.**
Each Square order spans multiple rows: the first row has customer info (name, email, order #, date, total) and subsequent rows have line-item details (product name, quantity, price). This is standard for Square CSV exports but the prompt doesn't describe this structure. An LLM that hasn't seen Square exports may build a parser expecting one-row-per-registration.

### 3.2 Workflow Ambiguities (MEDIUM RISK)

**E. "Nudge" system is under-specified.**
The prompt mentions "nudges" five times but never defines them. From the data:
- The `Nudge` column contains values like "1st", "2nd", "3rd", "skip"
- `NudgeText` is a short promotional paragraph (~50 chars per the Columns sheet, though actual content is longer)
- The `Word` column is a 1-2 word subject; `Phrase` is 2-4 word topic
- Nudges appear to be scheduled promotional emails sent before events in sequence

Without a definition, the LLM may implement nudges as a simple reminder system rather than the structured sequential promotion workflow they actually are.

**F. Multi-tenancy scope vs. Sampleschool-specific workflow.**
The prompt requires "multi-organization" support but then specifies highly Sampleschool-specific workflows:
- Curriculum Committee vetting with video/interview requirement
- Dean assigns event ID
- Arrangements committee assigns venue
- Specific Tentative → Booked state transition tied to collecting Abstract, Bio, Graphic, Fee

It is unclear whether:
1. These workflow steps should be **hardcoded** features available to all orgs
2. They should be **configurable/optional** per org
3. They represent one org's configuration of a **generic workflow engine**

Option 3 is the most architecturally sound but dramatically increases scope. The prompt should state which approach is intended.

**G. Catalog editorial workflow vs. catalog generation.**
The prompt describes two distinct processes that may be conflated:
1. **Catalog generation** from Grid data via templates (automated, the MailMerge process)
2. **Catalog editorial process** (human: editors review drafts, hosts verify content, graphic layout iterations)

The prompt asks for both but doesn't clarify how they interact. Does the system generate a draft catalog that then enters the editorial workflow? Or does it generate the final catalog directly? The DataNarrative describes multiple rounds of editor review → graphic layout → editor review, which implies a substantial editorial workflow beyond simple template rendering.

**H. "ORGTV Vimeo" and "Samplecommunity View" products are referenced but not in the prompt.**
The DataNarrative information flow diagram shows "ORGTV Vimeo" as an output, and the products list includes "Samplecommunity View" and "Semester survey." These are not mentioned in the prompt requirements. If they should be supported, they need requirements. If not, the inconsistency between the DataNarrative and the prompt may confuse the LLM.

### 3.3 Technical Ambiguities (MEDIUM RISK)

**I. Square integration: which mode when?**
The prompt requires support for both Square hosted checkout and Square direct API. It doesn't specify:
- When each should be used (admin choice? per-event? per-org?)
- Whether both must work in MVP or one can be Phase 2
- How the checkout flow differs from the user's perspective

**J. "Guest registration" vs. People records.**
The prompt says "Support BOTH guest registration and account-based registration" and separately says "People may exist without accounts." The relationship between these concepts is unclear:
- Does a guest registration create a People record? (Presumably yes, for attendance tracking)
- What data is collected from guests vs. account holders?
- Can a guest later "claim" their registration history?

**K. "Conversion-friendly UX" is subjective.**
The prompt says the public catalog should have "conversion-friendly UX" but provides no wireframes, user flow diagrams, or conversion metrics. This will be interpreted differently by every LLM or developer.

**L. Household grouping.**
Mentioned once ("optionally household grouping") with no elaboration. The data shows married couples at the same address (e.g., "Brown, Catherine" and "Brown, William" both at "V - 442"). Should the system:
- Auto-detect households by address?
- Allow manual grouping?
- Support household-level pricing or billing?
- Show household members on the same attendance entry?

**M. The $25k prior contractor database.**
The prompt says "A prior contractor-built database existed (cost $25k+) but code is unavailable." It's unclear whether `Spring-2024-Database VIII.xlsm` IS this database (an Excel/VBA workbook) or something separate. The .xlsm file has VBA macros, 100+ sheets, and substantial logic for importing Square reports and generating per-class registration/attendance sheets. Clarifying the relationship would help the LLM understand what to replicate.

### 3.4 Scope/Prioritization Ambiguities (LOW-MEDIUM RISK)

**N. Bundle types reference content categories not in the data.**
The prompt defines bundles:
- "All evening courses"
- "Evening lectures only"
- "Evening performances only (music/drama/dance)"

But the Grid data has no column that classifies events as "lecture" vs. "performance." The `Word` column (e.g., "Jazz Performance", "9-11", "Maryland Bats", "Queen Elizabeth I") is a topic keyword, not a category. The system would need an event category/type field that doesn't currently exist. This should be called out.

**O. Tax-exempt vs. taxable.**
The existing Square data shows `Tax Total = 0` and `Tax Rate = 0` for all visible records, suggesting Sampleschool School currently operates tax-exempt. The prompt adds tax support for multi-org generalization, which is fine, but the LLM has no sample taxed data to test against.

**P. Refund policy configurability.**
The prompt specifies "full refund before date X, partial after, admin-only, fully manual" as configurable per org and overridable per registration. This is a non-trivial policy engine. The prompt doesn't specify whether refund calculations should handle:
- Prorated refunds (by percentage of course completed)
- Bundle refunds (what happens when dropping one course from a bundle?)
- Payment method constraints (refund to original payment method vs. credit)

**Q. Day classes have different registration patterns.**
The data shows day classes (150s series) have multi-session schedules (e.g., "5 Mondays Feb 7, 14, 21, 28, Mar 7"), materials options ("With or Without Materials"), and facilitators rather than speakers. The prompt doesn't distinguish day class requirements from evening event requirements, but they're structurally different.

---

## 4. Structural Issues with the Prompt Itself

### 4.1 Prompt Length and Cognitive Load
At ~3,000 words, this prompt is very dense. ChatGPT Codex 5.3 will process it, but there is a real risk of:
- Later sections being given less weight than earlier ones
- Contradictory requirements being resolved inconsistently
- Subtle details (like the x-column pairing) being overlooked

**Recommendation:** Consider splitting into a master prompt + separate reference documents for:
- Data dictionary (Grid columns + Database sheet structures)
- Workflow specifications (with state diagrams)
- Square import format specification
- Export format specifications

### 4.2 "Step 0" Creates an Impossible Task
The prompt says: "Step 0 of your response MUST summarize what you found in the repo + attachments." But ChatGPT Codex cannot inspect .xlsm files with VBA, read named ranges, or parse 100-sheet Excel workbooks the way the analysis above does. It will either:
- Hallucinate the contents based on the prompt description
- State it cannot access the files and proceed with assumptions

**Recommendation:** Pre-extract the key data structures and include them as text in the prompt:
- Grid column definitions (the Columns sheet content)
- Square import column headers (from the `Imported Data` sheet row 1)
- Database sheet structure (the `Database` sheet column headers)
- Named range definitions (MergeGrid, BookingGrid, etc.)

### 4.3 Deliverable Scope vs. Single Response
The prompt asks for 8 documentation files, a full data model with migrations, seed data, a working MVP application, Docker deployment, and tests — all in a single response. This exceeds what any LLM can produce in one turn at production quality. The code will be skeletal at best.

**Recommendation:** Use the prompt as an iterative plan. Request Step 0-3 (analysis, architecture, data model, roadmap) first, then request code generation module by module in subsequent sessions.

---

## 5. Factual/Consistency Issues

| Issue | Detail |
|---|---|
| **Catalog filename typo** | `Spring2024CatalogGreatDecisionsFixef.pdf` — "Fixef" appears to be "Fixed" with a typo. Not a prompt issue but could cause file-not-found errors if referenced by name. |
| **Grid is labeled "2025Fall" but the prompt says "currently used as canonical source"** | This is a future semester grid. The prompt should clarify whether this is an active/in-progress grid or an example of the format. |
| **The .xlsm contains a `2023FallGrid` sheet (not a separate file)** | The prompt says the grid is a "semester grid Excel workbook" (singular). There are actually two grids: the standalone `2025FallGrid.xlsx` and the embedded `2023FallGrid` sheet inside the database. The column structures differ slightly between them (different column ordering, the 2023 version has columns like `Announce` that the 2025 version doesn't). |
| **Profile vs. Bio naming** | The Grid uses `Profile` for what the prompt calls "Bio." The Columns sheet says Profile = "Bio < 250 words". This naming inconsistency may cause field mapping confusion. |
| **"NudgeText" described as "< 50 char" in Columns sheet but actual content is 200+ characters** | The Columns sheet says NudgeText is "Reduced abstract < 50 char" but the actual NudgeText values in the Grid are full paragraphs. This inconsistency will confuse the data model. |

---

## 6. Summary of Recommendations

### Must-Do Before Sending to Codex
1. **Upload a raw Square Orders CSV file** (or paste the exact column headers and 3-5 sample rows as text in the prompt)
2. **Upload at least one MailMerge template file** (catalog body or nudge template)
3. **Pre-extract and embed the Grid column definitions** as text in the prompt (Codex cannot read .xlsm files)
4. **Clarify Cost vs. PreFee vs. WalkFee** — explicitly distinguish speaker fees from student registration fees
5. **Define "nudge"** — add 2-3 sentences explaining the sequential promotional email system
6. **Specify multi-tenancy approach for Sampleschool-specific workflows** — hardcoded, configurable, or generic engine?
7. **Specify the QuickBooks export format** — IIF, QBO, or specific CSV layout

### Should-Do for Better Results
8. Upload a sample formatted attendance sheet
9. Upload a sample paper registration form
10. Explain the Monday/Thursday x-column pairing pattern
11. Add an event category/type field to support bundle classification
12. Clarify the relationship between the $25k database and the .xlsm file
13. Split the prompt into a master prompt + reference documents to reduce cognitive overload
14. Request architecture/data model first, then code in subsequent sessions

### Nice-to-Do
15. Upload sample flyer, nudge email, and announcement
16. Provide wireframes or user flow diagrams for "conversion-friendly UX"
17. Document the event ID numbering convention
18. Specify day class requirements separately from evening events
