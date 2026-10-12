# FACTIFY — MASTER BUILD PROMPT (FINAL)

## 0. OPERATING RULES (read first, apply always)

Role: Senior full-stack engineer, product designer and tech lead. Build Factify — Misinformation Origin & Evidence Tracing Assistant (Media Literacy & Digital Safety) as a polished, genuinely functional client-side web app for a six-hour college hackathon. Autonomy: Do not ask questions. When something is ambiguous, pick the simplest reasonable option and log it under the Assumptions section in AGENTS.md. Never block on tooling. Invariants (violating any of these is a bug, even if the app "works"):

1. No verdicts. The UI never shows true/false, fake/real, a truth percentage, a trust score, or a

source reliability rating. No automated truth detection. No chatbot.

2. Checklist completion, claim–source relationships, and the human review status are three

separate things. Adding sources or ticking all boxes never changes the review status automatically.

3. A source that repeats or cites another source is not independent corroboration. A source

with no recorded relationship is "independence not established", never "independent".

4. Date order and wording similarity never prove copying, causation, or origin.

5. One source of truth: the Zustand store holds evidence data; the graph, timeline, gap list,

comparison panel and report are all derived by pure functions. No parallel graph state (view- only node positions excepted).

6. The original submitted text is stored verbatim and is immutable after investigation creation. `setOriginalText` may be used only by the initial create-investigation action; later changes require a new investigation. The initial setup action may set it once; changing it later requires creating a new investigation.

7. Everything works offline and client-side. No API keys, no network calls at runtime.

8. All demo/sample content is fictional, obviously so, and never resembles a real person,

publisher, channel or platform.

9. Every main screen and the report show the disclaimer from one shared constant: "Factify

helps you organize and trace an evidence review. It does not independently prove or disprove a claim."

10. Heuristics are labelled as heuristics ("suggested", "unconfirmed"), editable, and never

presented as findings.

## 1. PRODUCT CONCEPT

Factify helps a reviewer investigate how a claim is supported, repeated, changed and propagated across the records available to the investigation. The central feature is an interactive Claim–Evidence Graph connecting individual claims to source records and showing source-to- source relationships. It helps answer:

What exactly is claimed? What supports, contradicts or contextualizes each claim? Which sources merely repeat, and which might be independent? How does the wording change between records? What is the earliest traceable appearance among the available records? What is still unknown or unsupported? Claim entry, decomposition, checklist, notes, statuses and the report support this graph- centered workflow. Differentiator (state honestly): one explainable, human-reviewed interface combining claim decomposition, provenance, claim-to-evidence links, wording-change comparison and explicit evidence-gap tracking. Do not claim scientific novelty. Do not claim it finds the true origin of any rumour. It cannot crawl the web or read private chats; it only works with user-entered, imported or demo records.

## 2. ORIGINAL PROBLEM-STATEMENT REQUIREMENTS (must all be met)

1. Accept a claim or short text.

2. Identify key phrases and split into checkable statements with simple rule-based processing.

3. Let the user edit, split, merge, add, delete and reorder statements.

4. Structured review checklist: Source, Date, Evidence, Context, Corroboration.

5. Record source notes; statuses: Not checked, Evidence found, Needs more verification.

6. Explicitly state the tool does not independently prove or disprove a claim.

Microcopy for the status selector: "Evidence found means you found material worth reviewing. It does not mean the claim is supported."

## 3. TECH STACK

Mandatory: Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui (Radix), Zustand + persist with createJSONStorage(() => localforage), lucide-react, next-themes, sonner. Decisions made for you (do not re-debate):

Graph: @xyflow/react (React Flow v12), custom nodes/edges. Fallback to SVG only if install or render fails after 20 minutes. IDs: nanoid. Do not use crypto.randomUUID() (undefined on non-HTTPS origins, which breaks phone testing over LAN). Validation: zod (forms and JSON import). Tests: Vitest for /lib/**. Optional Playwright smoke test only if a browser is available. Dates: store as ISO strings (YYYY, YYYY-MM, YYYY-MM-DD). Never store Date objects (they do not survive JSON). shadcn components to install: Button, Card, Checkbox, Badge, Textarea, Input, Label, Select, Tooltip, Popover, AlertDialog, Dialog, Sheet, Tabs, Progress, Collapsible, Alert, ScrollArea, Separator, Sonner. Fonts: Prefer a locally bundled Inter asset if already available. Otherwise use a system-font stack (Inter, system-ui, sans-serif) without next/font/google or any build-time font download. The app must build without network access. Version caution: scaffold with current stable releases. If the CLI defaults to Tailwind v4 or React 19, follow those defaults (do not hand-write a Tailwind v3 config). Record exact versions in AGENTS.md. Zustand v5 gotcha: selectors that return new arrays/objects each call cause infinite re-render loops. Use useShallow or select raw slices and derive in useMemo. Do not use next lint (removed in newer Next); call eslint directly.

## 4. PHASE 0 — SETUP (hard timebox: 20 minutes total)

1. antigravity-workspace-kit: if its README is reachable (in the repo, node_modules, or

documented path), read it and follow its real commands and structure; do not invent commands. If it is not found within 5 minutes, skip it and say so in one line.

**AGENTS.md:** write the invariants from section 0, the stack decisions, the folder structure, the

verify command, and an ## Assumptions list.

3. Google Stitch MCP: try once for the three main screens (Enter Claim, Break Down,

Workspace) at mobile and desktop widths, capped at 15 minutes. If unavailable or slow, write one line ("Stitch unavailable, proceeding with shadcn/ui") and continue.

4. Design direction: calm, trustworthy, editorial-investigation look. Light default plus dark

variant. Inter. One restrained teal/blue accent. Rounded cards, generous spacing, subtle transitions only. No glow, no gradients, no decorative graphs, no fake statistics. Summarize five design decisions, then give a short plan and folder structure, and proceed without waiting. Suggested structure: app/ (page, report route), components/ (steps, graph, panels, ui), lib/analysis/, lib/derive/, lib/export/, lib/copy.ts (disclaimer, labels), store/review- store.ts, data/demo.ts, tests/.

## 5. INFORMATION ARCHITECTURE

Single-page workflow: Step 1 → Step 2 → Step 3 (workspace). A stepper is always visible. Steps 2 and 3 stay reachable after completion. Claims remain editable inside the workspace too, not just in Step 2. Step 1 — Enter claim. Large textarea (headline, post, excerpt, forwarded message). Optional:

source URL, publisher, source type, known publication date; if given, they become the first Source record at Start. Two or three fictional sample claims. Inline validation (non-empty, sensible max length such as 5,000 chars). Disclaimer alert. Privacy line: "Your text stays in this browser." Step 2 — Break down. Original text with rule-detected highlights (spans computed from offsets; original never altered). Legend: numbers, dates, named entities, quotations, absolute/sensational wording. Editable statement cards: edit, split (at cursor), merge with previous/next, add, delete, reorder (up/down buttons required; drag optional). Each card shows its "Things worth checking" questions (editable). Confirm breakdown button. Step 3 — Investigation workspace. The Claim–Evidence Graph is prominent at the top. Contains:

view switcher (Graph | Chain list | Timeline), detail panel, controls to add sources and relationships, per-claim review, filters, progress/unresolved summary, evidence-gap list, wording comparison, earliest-source card, Generate Report. Layout: desktop ≥1024px has graph left and detail panel right. Below that, details open in a bottom Sheet. On mobile (<768px) default to Chain list view; the graph remains available. Chain list is also the keyboard/screen-reader-friendly equivalent of the graph. Required global elements: Saved indicator, Start New Investigation (AlertDialog), Load demo investigation (AlertDialog if it would overwrite work), theme toggle, collapsible How to Use, Limitations section.

## 6. DATA MODEL (implement exactly; extend only if needed)

type PartialISODate = string; // 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD'

type DatePrecision = 'day' | 'month' | 'year' | 'unknown';

type ReviewStatus = 'not_checked' | 'evidence_found' | 'needs_verification';

type SourceType = 'official_record' | 'press_release' | 'news_report' | 'social_post'

| 'messaging_forward' | 'blog_opinion' | 'analysis' | 'other' | 'unknown';

type ClaimLinkType = 'supports' | 'contradicts' | 'contextualizes' | 'repeats'

| 'unrelated' | 'not_established';

type SourceRelType = 'explicitly_cites' | 'quotes' | 'appears_to_repeat'

| 'possible_shared_origin' | 'reviewer_judged_independent' | 'unknown';

type Verification = 'documented' | 'reviewer_suspected' | 'unknown';

interface Investigation { id; originalText: string; createdAt; updatedAt; isDemo:

boolean; schemaVersion: 1 }

interface Claim {

id; investigationId; text: string; order: number; textRevision: number; originSpan?: { start: number; end: number } | null; // null once edited/split status: ReviewStatus; statusHistory: { status: ReviewStatus; at: string }[]; checklist: { source: boolean; date: boolean; evidence: boolean; context: boolean; corroboration: boolean }; notes: string; referenceUrl?: string; // quick note only; "Promote to source record" action questions: { id; ruleId: string; text: string; anchorText?: string; resolved:

boolean; edited: boolean }[]; dismissedGaps: { ruleId: string; sourceId?: string; reason: string; at: string }[]; }

interface Source {

id; title: string; publisher: string; sourceType: SourceType; url?: string; // http/https only publishedAt: PartialISODate | null; datePrecision: DatePrecision; dateNote?:

string; // note conflicting dates accessedAt?: string; excerpt: string; notes: string; isPrimaryMarkedByReviewer: boolean; observations?:

Partial<Record<'authorIdentified'|'primaryLinked'|'dateAvailable'|'citationsPresent'| 'sensationalWording'|'independenceEstablished', boolean | null>>; // optional, tri- state }

interface ClaimSourceLink {

id; claimId; sourceId; type: ClaimLinkType; notes: string; excerptRelevance: 'addresses_claim' | 'partly' | 'unclear' | 'not_assessed'; scopeMismatch: 'none_noted' | 'possible' | 'not_assessed'; assessedAtClaimRevision: number; // link is "stale" if claim.textRevision differs }

interface SourceRelationship {

id; fromSourceId; toSourceId; type: SourceRelType; verification: Verification; explanation: string; } Direction semantics: for explicitly_cites, quotes, appears_to_repeat, from = the source doing the citing/quoting/repeating, to = the upstream source. This says nothing about dates. possible_shared_origin and unknown are undirected (store with canonical ordering). `reviewer_judged_independent` is also an undirected reviewer assessment, stored with canonical ordering. It may count toward the independence result only when explicitly selected by the reviewer; do not let a generic `verification: unknown` state silently render it as an unreviewed/unknown relationship. Enforce valid combinations in the store and JSON validation. In the UI, always label it as a reviewer judgment, not a verified fact. Constraints (enforced in store actions, plus a dev-only assertIntegrity()): no self- relationships; no duplicate (from, to, type); one ClaimSourceLink per (claim, source) pair; deleting a claim deletes its links; deleting a source deletes its links and relationships; URLs validated; dates validated against precision. The same source can link to many claims, and one claim to many sources. Source relationships are stored separately from claim–source links. Disambiguation: "repeats" on a claim–source link means the source restates the claim without adding evidence. "appears_to_repeat" between sources means one source's text seems to restate another's. Label them differently in the UI.

## 7. RULE-BASED ANALYSIS — /lib/analysis/ (pure, typed, unit-tested) All functions work on the original string with character offsets. Use Unicode-aware regex (u flag, \p{Lu}). Provide tests/analysis.*.test.ts covering each rule below.

### 7.1 Statement splitting (splitStatements(text): {text, start, end}[])

1. Protect: quoted spans (straight, curly, « »), URLs, decimals (3.5), initials (A. B.), times

(a.m.), ellipses, and abbreviations (Mr, Mrs, Ms, Dr, Prof, St, vs, No, Inc, Ltd, Co, e.g., i.e., U.S., U.K., Rs.).

2. Split on . ! ? followed by whitespace and an uppercase letter/digit/quote/end, and on

newlines/bullets.

3. Split on semicolons.

4. Split at , but, , while, however,, , and / and only if: the split point is outside quotes;

both sides have ≥4 words; the right side starts with a subject-like token (capitalized word, pronoun, "the/a/this/officials/police/…"); and each side contains a verb-like token (small verb lexicon incl. auxiliaries). Never split enumerations ("A, B and C"). When uncertain, prefer leaving a statement intact and suggesting manual review over a speculative split.

5. Merge fragments under 3 words into the previous statement. Never split inside quotes.

6. If the text is mostly non-Latin script (e.g., Devanagari), show a notice: "Rules are tuned for

English. Review the breakdown manually." Never fail silently.

### 7.2 Highlights (detectFeatures(text): Highlight[], each {kind, start, end, text, ruleId})

numbers, percentages, currency ($ € £ ₹ Rs INR USD; million billion lakh crore) dates and years: 12 March 2031, March 12, 2031, ISO, 12/03/2031. For dd/mm vs mm/dd ambiguity, tag as "ambiguous numeric date" and never guess. quoted text capitalized names / possible organizations / places: multi-word capitalized sequences (allow of/for/the/de inside) and 2–5 letter acronyms. Skip a single capitalized word at sentence start unless followed by another capitalized word. Exclude month and weekday names. absolute/sensational: always, never, 100%, everyone, nobody, proven, shocking, secret, breaking, "they don't want you to know", "confirmed" (as a certainty cue), ALL-CAPS words, repeated !!. Optional virality cues: "share before it's deleted", "forward to everyone". allegation/hedging cues (separate kind): alleged, allegedly, accused, suspected, charged, claims, reportedly, "sources say", investigating, "possible". Overlap resolution priority: quote > date > currency/percent > number > absolute > entity. Highlights are heuristic, not NER.

### 7.3 Suggested questions (suggestQuestions(claimText, highlights): Question[]) — one per

detected feature, as specified:

number → "Where does this figure come from?" date → "Is this the original publication date or a later re-share?" (+ for ambiguous dates: "Is this day/month or month/day?") quotation → "Is the full quotation available in context?" absolute → "Does the cited evidence support such a broad statement?" named entity → "Is the person or organization identified unambiguously?" allegation cue → "Does the source report a suspicion, an accusation, a charge, or an established finding?" Questions are materialized into claim.questions so the user can edit, resolve, or delete them. "Refresh suggestions" adds new ones without deleting edited ones. Never claim the rules determine truth.

## 8. DERIVED LOGIC — /lib/derive/ (pure functions of store state; unit-tested)

### 8.1 buildGraph(state, filters, positions) → nodes and edges for React Flow, the Chain list

and the Timeline. Edge IDs are stable and derived from record IDs. Filters hide elements from the view only; they never delete data, and a "N hidden by filters" chip is shown.

### 8.2 computeIndependence(claimId)

Let S = sources linked to the claim with type `supports`; exclude claim–source links of type `repeats`, `unrelated`, and `not_established`. Build an undirected dependency graph over all source records using `explicitly_cites`, `quotes`, `appears_to_repeat`, and `possible_shared_origin` relationships whose verification is `documented` or `reviewer_suspected`. Dependency paths through non-supporting sources count. Connected components among S represent shared-upstream groups.

Return exactly one result:
- `no_support`: S is empty.
- `single_source`: |S| = 1.
- `one_dependency_chain`: all sources in S belong to one dependency component. Display: “Corroboration has not been established independently; the supporting records are connected by citation, repetition, or suspected shared origin.”
- `independence_unverified`: S spans at least two components, but the reviewer has not explicitly judged a pair in different components to be independent.
- `reviewer_judged_independent`: the reviewer explicitly recorded a `reviewer_judged_independent` relationship between a pair in different components. Display: “Independence judged by reviewer; Factify has not verified it.”

The `reviewer_judged_independent` relationship is an explicit reviewer assessment, not a generic verification state. Enforce valid type/state combinations in store actions and JSON validation; never render it as `unknown`. It is not proof of actual independence. Repeating links never count as supporting sources. This function never writes to claim review status.

### 8.3 computeEarliest(claimId) — earliest relevant record, not the origin

Candidates = sources linked with type supports | contradicts | contextualizes | repeats (not unrelated / not_established). This computes the earliest dated relevant record linked to the claim, not the earliest appearance of the exact claim wording. Label it "Earliest traceable relevant record in this investigation" and show the link type. Do not imply that a contextual mention establishes the stronger claim. Date interval from publishedAt + precision (year = Jan 1–Dec 31, month = whole month). accessedAt is never used.

# Results:

none: no relevant candidates, or no candidates have dates → display "Earliest relevant record not established" and explain why. earliest_among_dated: one candidate whose interval ends before every other dated candidate's interval starts. Label: "Earliest traceable relevant record in this investigation". Show scope: "among N relevant linked records, M dated". Show each candidate’s claim–source relationship type. This is the earliest relevant record, not necessarily the first appearance of the exact claim wording. If undated candidates exist, add: "K record(s) have no date and could be earlier. Treat as provisional." ambiguous: overlapping intervals (same day/month/year precision) or a dateNote flags conflict → list tied candidates, no pick. Always include the caveat: "Oldest relevant record available here, not proof of where the claim began or when this exact wording first appeared." If the earliest relevant source has documented explicitly_cites/quotes relationships to upstream sources, render the source chain with relationship and verification labels. A contextual mention does not establish the full claim. Similar text alone is never shown as a chain link.

### 8.4 computeGaps(state) → Gap { id, ruleId, claimId, sourceId?, message, nextStep, kind:

'rule' | 'heuristic_suggestion' }. No scores or severities that read as truth ratings; show counts of open items only. Gaps can be dismissed with a reviewer reason (stored in claim.dismissedGaps) and are then excluded. Rule Condition Suggested next step

G1 no_source no link other than unrelated/not_established

Find a record that directly addresses this claim

G2 no_primary — Condition: at least one relevant claim–source link exists (supports, contradicts, contextualizes, or repeats), but none of those linked sources is marked primary by the reviewer. Unrelated and not-established links do not count. Next step: locate the original statement, document, or recording.

G3 date_unknown linked source has no date

Look for a publication date or archive timestamp

G4 excerpt_unclear

excerptRelevance = unclear, or heuristic:

key terms of the claim largely absent from the excerpt (suggestion, unconfirmed) Re-read the excerpt against the exact claim wording Rule Condition Suggested next step

G5 scope_mismatch

scopeMismatch = possible, or heuristic:

numbers/entities/dates in the claim absent from the excerpt (suggestion) Check whether the source says the same thing about the same people, place and time

G6 independence

independence result is anything except reviewer_judged_independent and the claim has ≥1 supporting/repeating link Determine whether the reports rely on the same upstream source

G7 contradiction any contradicts link

Examine the contradicting record and reconcile or explain the difference G8 relationship_unknown two sources on the same claim with no relationship or unknown Check whether one cites or reuses the other

G9 stale_assessment link assessedAtClaimRevision ≠ claim

textRevision Re-assess this link against the edited claim text

### 8.5 compareWording(a, b): WordingObservation[] — transparent rules, no ML.

Word-level diff (LCS) with added/removed tokens highlighted. Detectors (each returns the matched tokens and a plain explanation):

hedge → assertion (lexicon: possible, alleged, suspected, reportedly, investigating, may, claims → is, was, confirmed, proven) certainty strengthened or weakened narrow → broad (some/several → many/all/every/everyone; add/remove "always/never") added or removed numbers, dates, entities (from detectFeatures) negation added or removed attribution dropped ("according to", "said", quotes removed) who/where/when changed (entity or date set differences) Each observation: {kind, aText, bText, explanation, reviewState: 'unconfirmed' | 'confirmed' | 'dismissed', note}. Reviewer states are persisted in the store, keyed by a stable hash of (sourceA, sourceB, kind, aText, bText). Comparison pairs: claim ↔ linked source excerpt; source excerpt ↔ source excerpt (default pairs = sources connected by a relationship). Label sides "Wording A / Wording B". Use "earlier / later" only if both dates are documented and their intervals do not overlap, and then add: "Order of dates alone does not show copying." Copy rule: "This change may warrant review." Never "misinformation", "lie", "deliberate".

### 8.6 buildReportModel(state) — the single input for all report renderers (see section 12).

## 9. GRAPH, TIMELINE AND DETAIL UX

Graph (@xyflow/react) Client-only: 'use client', dynamically imported with ssr: false, with explicit container height (≈420px mobile, ≥560px desktop) and @xyflow/react/dist/style.css imported. Layout (deterministic, no layout library): claims in a left column ordered by order; sources in a right region ordered by known date, undated sources in a labelled "Date unknown" lane; source-to-source edges drawn as arcs between source nodes. User-dragged positions are stored in a separate persisted ui.nodePositions map (view data, ignored by the report). Provide Fit view and Reset layout. Add and edit links through forms/dialogs (drag-to-connect optional). Edge interactionWidth ≥ 24 for touch. Selecting a node dims unrelated nodes and opens its details. Clicking an edge opens relationship details. Nodes: claim (rounded rectangle, quote icon, status icon + text, open-gap count) and source (distinct shape, type icon, date or "Date unknown" badge, Primary badge, "FICTIONAL" badge in demo mode). Readable labels, truncated with full text on selection. Edge encoding (never colour alone): line style = certainty: solid = documented, dashed = reviewer-suspected, dotted = unknown / not established. Label chip = icon + text of the relationship type. Source-to-source edges have arrowheads (from = citing source). Colour is a secondary cue. Provide aria-label text for each edge. Visual indicators: claim with no relevant source; source with unknown date; possible scope mismatch; corroboration not established independently; suspected (not documented) relationships; incomplete trail. Chain list view: per claim, list linked sources with relationship chips; nest documented upstream chains. Fully keyboard accessible. This is the mobile default. Timeline view: sources with known dates in order, respecting precision (a year-only source shows "2099" and spans the interval), plus an "Undated" group. Note: "Chronological view. Order of dates alone does not show who copied whom." Filters: by claim, source type, relationship type (both families), review status. Persist the filter state in the non-persisted UI slice only. Detail panel (desktop side panel / mobile Sheet):

Claim: text, checklist (5 items, each with a checkbox and an inline "What to inspect" hint available by tooltip and tap-friendly Popover), progress bar, notes, quick reference URL (+ "Promote to source record"), status selector with the microcopy above, questions, linked sources and relationships, open gaps, independence result, earliest-source card. Source: metadata (type, publisher, dates + precision, URL as a safe link), excerpt, notes, primary toggle, connected claims and relationships, optional source-quality observations (section 13). Edge: type, verification state, explanation/notes; for claim–source edges also excerpt relevance and scope mismatch; for source–source edges the wording comparison. Edit and delete with confirmation or an Undo toast. Edits update graph, timeline, gaps and saved state immediately.

## 10. EVIDENCE GAP MAP

Per claim and overall, show open workflow items from computeGaps with a concrete next step each. Present as "Open review items", with the standing note: "These are workflow indicators, not evidence that a claim is wrong." Heuristic-based items are tagged "suggested (unconfirmed)".

## 11. STATE, PERSISTENCE, SAFETY

One typed store at /store/review-store.ts. Actions: createInvestigation (sets originalText once); setStatements / reorder; add/edit/split/merge/delete claims; add/edit/delete sources, claim–source links, source relationships; toggle checklist; edit notes/URLs; set status (append history); review wording observations; dismiss gaps; reset investigation; load demo; import/export JSON. Persistence: persist with name: 'factify:v1', version: 1, a stub migrate, storage:

createJSONStorage(() => localforage), and partialize for domain data and ui.nodePositions only (no selection, filters, hydration flags or saved timestamps). Hydration: skipHydration: true; rehydrate in a client <StoreHydrator/> effect; expose useHasHydrated() via persist.onFinishHydration. Render a skeleton until hydrated. Seed the demo only if the store is empty and the user has not dismissed it. Guard all browser-only APIs. Add suppressHydrationWarning on <html> for next-themes, and a mounted guard on the theme toggle. Format dates with an explicit locale/timezone to avoid mismatch. Saved indicator: wrap the storage setItem to update a tiny separate, non-persisted store (lastSavedAt). Do not store it inside the persisted store (it would trigger an infinite write loop). On write failure, show a toast ("Couldn't save locally. Storage may be full or blocked.") and offer a JSON export.

# Merge/split semantics:

Merge: text joined; links unioned (on conflicting links to the same source keep the first, append a note and mark stale); checklist = AND of both; notes concatenated; status = the shared value, else needs_verification. Split: first part keeps the id and links (all marked stale); second part is new with no links. Any claim text edit increments textRevision, which makes existing links stale (gap G9). Deleting a claim or source: AlertDialog if it has links or notes, plus an Undo toast (keep an in- memory snapshot). Security: user text is rendered only as text, never as HTML. Source URLs must be http:/https: (reject javascript: and others) and rendered with rel="noopener noreferrer" target="_blank". Do not fetch URLs. Escape content in Markdown and print exports. Validate JSON imports with zod (reject unknown schema versions with a clear message).

## 12. REPORT AND EXPORT (secondary output)

/report route, hydration-safe. All renderers consume buildReportModel(state); there is no separate copy of the evidence. Contents:

1. Prominent limitation statement + disclaimer; "FICTIONAL DEMO" watermark if isDemo.

2. Original submitted content (verbatim).

3. Scope of available records ("N sources, M dated, K undated").

4. Claims with status, checklist progress and notes.

5. Source records with excerpts and metadata.

6. Claim–source relationships (with excerpt relevance and scope flags).

7. Source–source relationships with verification state.

8. Observable wording changes with reviewer state (unconfirmed items labelled as such).

9. Earliest traceable source per claim, or why it is not established. Independence result per

claim.

10. Open evidence gaps with next steps.

Outputs: print-friendly page (@media print), Markdown download, JSON download (includes schemaVersion). JSON import is optional (Priority 3).

## 13. SOURCE-QUALITY OBSERVATIONS (optional, Priority 3)

Tri-state checklist per source (yes / no / not checked): author or publisher identified; primary source linked; publication date available; citations present; sensational wording observed; independence from other sources established. Shown as observations only. No score, no rating, no colour-coded reliability.

## 14. UI, ACCESSIBILITY, RESPONSIVENESS

Use shadcn/ui consistently. Light default, dark toggle. Mobile, tablet, desktop. Touch targets ≥44px; semantic HTML; explicit labels; visible focus rings; keyboard navigation; ARIA where needed; WCAG AA contrast; prefers-reduced-motion respected. Status and relationships always use icon + text + colour. Tooltips are never the only place a hint lives (touch devices have no hover). Helpful empty states (no sources, no claims, no gaps). Collapsible How to Use. Limitations section. Plain-language microcopy. Error boundary around the graph with a "switch to list view" fallback. No user-facing verdict language (enforced in section 17).

## 15. FICTIONAL DEMONSTRATION (seed + "Load demo" button)

A banner on every screen while the demo is loaded: "All records here are fictional, for interface demonstration only." Use invented names (for example "Port Halvren", "Councillor Mara Quillon", "Halvren Harbour Gazette (fictional)"), fictional dates in 2099, and an isDemo: true flag.

# Content:

Claim A (documented event): "Councillor Quillon was arrested on a harbour-permit charge." Claim B (separate allegation): "Councillor Quillon is a foreign spy." S1 Fictional Police press release, 2099-03-03: arrest on suspicion of falsifying harbour permits; says nothing about espionage. Primary marked. Links: supports A; not_established for B. S2 Fictional Gazette report, 2099-03-03: reports the arrest, explicitly cites S1 (documented), and includes an anonymous line: "officials are investigating a possible espionage allegation." Links: supports A; contextualizes B (qualified allegation). S3 Fictional social post, 2099-03-04: "Councillor Quillon was confirmed to be a foreign spy." appears_to_repeat S2 (reviewer-suspected). Wording shift: suspicion → definitive assertion. Link: repeats B. S4 Fictional forwarded message, no date: "BREAKING: spy arrested, they don't want you to know." Relationship to S3: unknown. Link: repeats B. S5 Fictional blog, 2099-03-05: repeats S3's wording and explicitly cites S3 (documented). Link: repeats B. Demonstrates: evidence for the arrest (A) does not support the espionage allegation (B); repeating sources are not independent; wording change is flagged for review, not labelled; earliest source for B is provisional because S4 is undated; unresolved gaps G2, G3, G6 and G8 for B. Statuses preset: A = Evidence found, B = Needs more verification (set by the "reviewer" in the seed, not derived).

## 16. BUILD ORDER, TIMEBOXES AND GATES (total 6:00)

Run the relevant checks at every milestone and record actual results. Do not claim a gate passed unless its command was run and passed. Keep a working vertical slice at all times. If a gate fails, fix it or explicitly record the failure and reduce scope before proceeding. Commit at each milestone if version control is available. # Time Scope Gate

M0 0:00–

0:30 Phase 0, scaffold, AGENTS.md, theme, shared disclaimer component, store skeleton npm run dev renders; strict TS passes

M1 0:30–

1:45 Types, store + persistence + hydration, /lib/analysis with tests, Steps 1–2 UI, demo fixture Claim → breakdown works; refresh keeps data; analysis tests pass

M2 1:45–

3:30 Source CRUD, claim–source links, graph + chain list, detail panel, checklist/notes/status Click node/edge → details; edits update graph; persistence works

M3 3:30–

4:30 Source relationships, independence, earliest source, gaps, wording comparison, timeline Demo shows all differentiators correctly; derive tests pass

M4 4:30–

5:15 Filters, report + Markdown/JSON export, dark mode, mobile pass Report matches graph; mobile usable

M5 5:15–

6:00 QA script, bug fixes, README, DEMO.md, final verify All acceptance criteria below; buffer ≥15 min Cut order if behind schedule (cut in this sequence, never faking functionality): source-quality observations → JSON import → Markdown export → relationship/status filters (keep claim filter) → drag-to-connect and node dragging → Stitch designs → dark-mode polish. If a feature is dropped, implement the simplest functional version and list the limitation in the README and Limitations section.

## 17. TESTING AND ACCEPTANCE

Automated (npm run verify = typecheck + lint + test + language check + build):

tsc --noEmit, ESLint, Vitest, next build pass. Verdict-language check via an ESLint no-restricted-syntax rule on JSXText and string Literal values matching /\b(true|false|fake|real|hoax|debunked|verdict|truth score|trust score|credibility score)\b/i. Overrides allow it only in lib/analysis/lexicons, data/demo.ts, tests/, and docs. Review any hit manually. Required unit tests: splitter (abbreviations, decimals, quotes, A, B and C, conjunction splitting, short fragments); feature detection (overlap priority, ambiguous dates, ₹ /lakh/crore); independence (all five outcomes); earliest source (none, undated provisional, ambiguous overlap, year-precision interval); gaps (each rule, dismissal); wording (hedge→assertion, narrow→broad, A/B vs earlier/later labelling); store integrity (cascades, merge/split, stale links); report model matches store state. Manual / browser (use Playwright if available; otherwise produce a checklist with pass/fail):

1. Start a new investigation from a sample claim.

2. Decompose, then edit, split, merge, add, delete and reorder statements.

3. Add several sources to one claim; add a source relationship and set its verification state.

4. Click claim, source and edge nodes; confirm details; edit and confirm the graph updates.

5. Toggle checklist items, notes and statuses; confirm that status does not change

automatically.

6. Compare wording A/B in the demo; confirm unconfirmed labelling.

7. Earliest-source card shows provisional/not-established states honestly for the demo's

undated source.

8. Refresh: all data persists, no hydration warnings, no console errors.

9. Mobile width (375px) and dark mode; touch targets ≥44px; chain list usable without the

graph.

10. Disclaimer visible on Steps 1–3 and in the report.

11. Report content equals current graph data (change a relationship, regenerate, compare).

12. javascript: URL in a source field is rejected.

## 18. DELIVERABLES

1. Running app (npm install && npm run dev).

**README.md:** setup, features, how each rule works, limitations.

**AGENTS.md:** invariants, versions, assumptions, commands.

**DEMO.md:** a 2-minute walkthrough script for judges: enter claim → breakdown → graph →

click the espionage claim → show repeat chain and unknown relationship → wording change → earliest source provisional → open gaps → report.

5. Final message: what was built, which gates passed, what was cut, known limitations. Be

honest and concise.

## Mandatory six-hour execution strategy

Build in this order and keep each stage runnable:
1. Vertical slice: create investigation, enter original text, create/edit claims, add source records, link sources to claims, set link types, persist, refresh, and inspect the same data.
2. Core differentiators: source-to-source relationships, conservative independence result, earliest relevant record with date uncertainty, evidence gaps, and one transparent wording comparison.
3. Report derived from the same store data, mobile chain list, keyboard access, and required disclaimer.
4. Only then add timeline polish, advanced filters, source-quality observations, JSON import, Markdown export, and visual refinements.

If time is short, cut features in this order: source-quality observations; JSON import; Markdown export; relationship/status filters (retain claim filtering); drag-to-connect and node dragging; advanced splitting heuristics; Stitch-specific refinements; dark-mode polish. Never replace a cut feature with a decorative mockup. Disable unfinished controls and document what is missing.

## Required semantic edge cases

- Define one shared helper for whether a claim–source link is relevant. For G2, unrelated and not-established links do not count as relevant links or as evidence that a primary source is present.
- A source marked primary by the reviewer is only a reviewer-entered classification; it is not automatically authoritative, accurate, or sufficient.
- Independence calculations must consider dependency paths through non-supporting sources, but only supporting links are counted as candidate corroborating sources. A source linked as `repeats` to a claim never increases the supporting-source count.
- If a claim text revision changes, mark existing claim–source assessments stale. Do not silently revalidate them.
- Required contamination test: a source that supports Claim A must not support Claim B unless the reviewer creates a separate Claim B link. A `not_established` link is not support. This must remain true in the graph, derived calculations, and report after refresh.
- Earliest-record calculations must show the relationship type for each candidate and must not describe a contextual mention as evidence for the full claim. If date intervals overlap, or date metadata conflicts, show ambiguity rather than choosing one.
- For source-to-source relationships, enforce allowed type/verification combinations. An explicit `reviewer_judged_independent` assessment is distinct from `unknown`; the interface and independence calculation must agree on its state.
