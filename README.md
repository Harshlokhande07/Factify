# FACTIFY — Misinformation Origin & Evidence Tracing Assistant

> **Disclaimer:** Factify helps you organize and trace an evidence review. It does not independently prove or disprove a claim.

---

## 1. Overview
**Factify** is an explainable, client-side evidence tracing and provenance assistant designed to help journalists, researchers, and media literacy students examine how claims originate, spread, and transform across available records.

Instead of issuing automated verdicts, truth percentages, or trust scores, Factify provides a **human-in-the-loop investigation workspace** with an interactive **Claim–Evidence Graph**, structured checklists, citation dependency mapping, transparent lexical shift analysis, and explicit evidence gap tracking.

---

## 2. Core Operating Invariants
1. **No verdicts:** Factify never displays true/false, fake/real, truth percentages, or reliability ratings.
2. **Separation of concerns:** Checklist completion, claim–source relationships, and human review status are distinct and never automatically toggle each other.
3. **Conservative independence:** A source repeating or citing another is never counted as independent corroboration. A source without a recorded link is "independence not established", never "independent".
4. **No causal assumptions:** Chronological ordering and phrasing similarities never prove copying or origin.
5. **Single source of truth:** The Zustand store holds evidence records; graph views, timeline, gap lists, and reports are derived via pure mathematical and topological functions.
6. **Immutable original text:** Submitted text is stored verbatim and never altered during breakdown or revision.
7. **Offline & Client-Side:** Operates 100% offline in browser storage (`localforage`). No API keys or remote telemetry.

---

## 3. Getting Started

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Installation & Running Locally
```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verification Suite
Run the full verification pipeline (TypeScript strict check, ESLint, secrets check, Vitest test suites, and Next.js build):
```bash
npm run verify
npm run backend:test
```

---

## 4. Search Prototype Integration (`backend/`)

Factify includes an optional machine-assisted search prototype allowing reviewers to find related web records (news, official records, social posts) without leaving the interface.

### 4.1 Search Setup
1. **Mock Mode (Works offline with no API key):**
   ```bash
   # In terminal 1 (start search backend):
   npm run backend
   # In terminal 2 (start Next.js frontend):
   npm run dev
   # Or run both concurrently:
   npm run dev:all
   ```
   Default provider is `mock` (returns simulated results labelled `[MOCK]`).

2. **Real Search Providers (Keys live ONLY on backend):**
   *Note: Google's Custom Search JSON API is closed to new customers and retires on 1 Jan 2027, so Brave Search API or Serper is used instead.*
   Create `backend/.env`:
   ```bash
   SEARCH_PROVIDER=brave       # or 'serper'
   BRAVE_API_KEY=your_brave_key
   # or SERPER_API_KEY=your_serper_key
   ALLOWED_ORIGINS=http://localhost:3000
   ```
   Never put API keys in the Next.js frontend or commit `.env` files.

3. **Frontend Configuration (`.env.local`):**
   Next.js connects to the backend via a server-only environment variable:
   ```bash
   FACTIFY_SEARCH_URL=http://localhost:8000
   ```

### 4.2 Production Deployment Note
- The Next.js application must run as a **Node.js server** (`next start`), not a static export (`output: 'export'`), because route handlers (`/api/search`, `/api/search/health`) enforce server-side validation, rate-limiting, and credentials isolation.
- Deploy the FastAPI backend separately (e.g. on Fly.io, Railway, or VPS) and point `FACTIFY_SEARCH_URL` to its URL on the Next.js host.
- API keys exist **only** on the backend host environment.

## 4. Key Capabilities & How the Rules Work

### 4.1 Rule-Based Statement Splitter (`/lib/analysis/splitter.ts`)
- **Span Protection:** Protects quotations (`"..."`, `“...”`, `«...»`), URLs, decimals (`3.5`), initials (`A. B.`), times (`3:30 p.m.`), abbreviations (`Dr.`, `Mr.`, `Inc.`), and currency notations.
- **Punctuation Splitting:** Breaks on sentence terminators followed by capitalization and whitespace.
- **Compound Sentence Splitting:** Splits conjunctions (`, but `, `, while `, `, and `) only when both clauses contain $\ge 4$ words, a subject-like token, and an active verb.
- **Enumeration Preservation:** Never splits list enumerations (`A, B and C`).
- **Short Fragment Merging:** Merges fragments under 3 words back into previous sentences.

### 4.2 Feature Highlights & Suggested Inquiries (`/lib/analysis/`)
- Detects numbers, currency (`$`, `€`, `£`, `₹`, `Rs.`), dates (written, ISO, slash dates flagged as ambiguous), quotations, entities, absolutes (`always`, `never`, `100%`), and allegation hedging cues (`alleged`, `suspected`, `claims`).
- Generates targeted critical inquiry questions for reviewers without claiming truth determination.

### 4.3 Conservative Independence Assessment (`/lib/derive/independence.ts`)
- Builds an undirected dependency graph over source records using documented or suspected relationships (`explicitly_cites`, `quotes`, `appears_to_repeat`, `possible_shared_origin`).
- Evaluates connected components among supporting records:
  - `no_support`: No supporting links.
  - `single_source`: Exactly one supporting record.
  - `one_dependency_chain`: All supporting sources belong to a single citation/repetition component.
  - `independence_unverified`: Supporting records span separate branches, but independent field origination has not been confirmed by the reviewer.
  - `reviewer_judged_independent`: Explicit reviewer verification recorded between distinct components.

### 4.4 Earliest Relevant Record (`/lib/derive/earliest.ts`)
- Evaluates date intervals from `publishedAt` and `datePrecision` (year = Jan 1–Dec 31, month = full month, day = single day).
- If undated relevant records exist, flags the outcome as **provisional** with the caveat that undated records could have surfaced earlier.
- If date intervals overlap or conflicts are noted, highlights ambiguity rather than selecting an arbitrary winner.

### 4.5 Transparent Wording Comparison (`/lib/derive/wording.ts`)
- Word-level diff using tokenized longest common subsequence (LCS).
- Detectors:
  - **Hedge $\rightarrow$ Assertion:** Highlights shifts from unverified suspicions (`possible`, `alleged`, `investigating`) to definitive assertions (`confirmed`, `proven`).
  - **Narrow $\rightarrow$ Broad:** Flags scope inflation (`some/several` $\rightarrow$ `all/everyone`).
  - **Negation Shifts:** Identifies addition or dropping of negation markers.
  - **Dropped Attribution:** Flags removal of attribution qualifiers (`according to`, `police said`).

### 4.6 Evidence Gap Map (`/lib/derive/gaps.ts`)
Tracks open workflow items:
- **G1 (no_source):** Statement has no relevant linked evidence.
- **G2 (no_primary):** Relevant sources exist but none is marked primary by reviewer.
- **G3 (date_unknown):** Linked record has no confirmed publication date.
- **G4 (excerpt_unclear):** Excerpt relevance flagged as unclear.
- **G5 (scope_mismatch):** Potential mismatch between statement scope and excerpt.
- **G6 (independence):** Supporting records lack verified independent origination.
- **G7 (contradiction):** Direct contradictory record linked.
- **G8 (relationship_unknown):** Two records linked to the same statement with unknown relationship.
- **G9 (stale_assessment):** Statement edited after initial link evaluation.

Reviewers can dismiss any gap by providing a logged rationale.

---

## 5. Fictional Demonstration Dataset
Factify includes a preset fictional 2099 case study ("Port Halvren" & "Councillor Mara Quillon"):
- Documented police arrest for municipal harbour permits (**Claim A** supported by primary release S1 and Gazette report S2).
- Uncorroborated online espionage rumour (**Claim B** repeated across viral posts S3, S4, and S5 without primary substantiation).
- Demonstrates how evidence for one charge (permits) does not support a separate allegation (espionage).

---

## 6. Known Limitations
1. Factify does not crawl the live internet or ingest private messaging APIs; it operates strictly upon records entered, imported, or loaded by the reviewer.
2. Lexical heuristics are optimized for English syntax.
3. Chronological sorting alone does not prove transmission direction or copying.
