# 🔍 FACTIFY — Misinformation Origin & Evidence Tracing Assistant

[![Next.js](https://img.shields.io/badge/Next.js-16.4.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-v5-443e38?style=flat)](https://zustand-demo.pmnd.rs/)
[![React Flow](https://img.shields.io/badge/@xyflow/react-v12-FF0072?style=flat)](https://reactflow.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Core Operating Disclaimer:**  
> *"Factify helps you organize and trace an evidence review. It does not independently prove or disprove a claim."*

---

## 📌 1. Overview & Problem Statement

### The Problem
Most automated fact-checking tools operate as **opaque black-box arbiters**: they produce unverified confidence percentages (*"87% True"*), stamp binary verdicts (*"Fake News"*), or hallucinate authoritative explanations. When viral claims are re-posted or quoted thousands of times across social networks, automated systems often mistake viral repetition for independent corroboration.

### What is Factify?
**Factify** is an explainable, client-side, **human-in-the-loop evidence tracing workbench** built for journalists, open-source intelligence (OSINT) investigators, researchers, and media literacy educators. 

Instead of issuing automated verdicts, Factify equips the reviewer with tools to:
- **Decompose raw narratives** into discrete, testable factual propositions.
- **Map citation and propagation paths** using an interactive Claim–Evidence graph.
- **Prevent evidence contamination** (ensuring verified evidence for Charge A does not falsely substantiate Allegation B).
- **Detect circular reporting** via conservative independence algorithms.
- **Trace wording mutations** (e.g., when an investigative hedge *"alleged"* morphs into an absolute assertion *"confirmed"*).
- **Highlight structural evidence gaps** across all claims before concluding a review.

---

## ⚖️ 2. Core Operating Invariants

Factify is built upon strict foundational principles that are enforced throughout the UI and codebase:

| Invariant | Description |
| :--- | :--- |
| **1. No Automated Verdicts** | The UI never displays true/false, fake/real, trust scores, or truth percentages. Factify is an investigation assistant, not an automated judge. |
| **2. Separation of Concerns** | Checklist tasks, claim–source relationship links, and the human reviewer's final assessment status are strictly isolated. Completing a checklist never automatically changes a status. |
| **3. Conservative Independence** | A source repeating, citing, or quoting another source is **never** counted as independent corroboration. A source with no recorded link is classified as *"Independence not established"*, never assumed independent. |
| **4. No Causal Assumptions** | Chronological ordering and lexical similarity never prove copying, causation, or transmission origin. |
| **5. Single Source of Truth** | A single typed Zustand store manages state; graphs, timelines, gap lists, wording comparisons, and dossiers are pure mathematical/topological derivations. |
| **6. Immutable Verbatim Text** | Original submitted text is stored verbatim and immutable. Modifying the original input requires initiating a fresh review. |
| **7. Privacy & Offline-First** | Factify functions 100% offline in browser storage (`localforage`). Network requests occur only if the optional backend search feature is explicitly triggered. |

---

## 🔄 3. End-to-End Investigation Workflow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STEP 1: INGESTION                               │
│  Raw text submission or built-in fictional 2099 case study             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   STEP 2: CLAIM DECOMPOSITION                          │
│  • Rule-based Sentence Splitter with Span Protection                   │
│  • Entity, Date, Hedge & Absolute Word Highlights                     │
│  • Generated Critical Inquiry Prompts                                  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   STEP 3: INVESTIGATION WORKSPACE                      │
│                                                                        │
│   ┌─────────────────────┐   ┌──────────────────────────────────────┐   │
│   │ Claim–Evidence      │   │ Conservative Independence Engine     │   │
│   │ Interactive Graph   │   │ Detects circular echo chambers       │   │
│   └─────────────────────┘   └──────────────────────────────────────┘   │
│   ┌─────────────────────┐   ┌──────────────────────────────────────┐   │
│   │ Earliest Record     │   │ Wording Shift Comparison (LCS)       │   │
│   │ Timeline & Caveats  │   │ Hedge ➔ Assertion & Dropped Quotes   │   │
│   └─────────────────────┘   └──────────────────────────────────────┘   │
│   ┌─────────────────────┐   ┌──────────────────────────────────────┐   │
│   │ Evidence Gap Map    │   │ Machine-Assisted Search (Optional)   │   │
│   │ Checks G1 through G9│   │ Suggestion preview & human approval  │   │
│   └─────────────────────┘   └──────────────────────────────────────┘   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     STEP 4: REPORT & AUDIT DOSSIER                     │
│  Comprehensive review summary with export to Markdown, JSON, or Print  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 4. What Was Built (Key Features & Engineering)

### 4.1 Rule-Based Statement Splitter (`lib/analysis/splitter.ts`)
- **Span Protection Engine:** Protects quotations (`"..."`, `“...”`, `«...»`), URLs, decimals (`3.14`), abbreviations (`Dr.`, `e.g.`, `Inc.`), times (`4:30 p.m.`), and currency values from accidental sentence splitting.
- **Compound Sentence Analysis:** Splits conjunctions (`, but `, `, while `, `, and `) only when both clauses contain $\ge 4$ words, a subject-like noun phrase, and an active verb.
- **Fragment Management:** Retains lists and automatically merges sub-3-word fragments into parent statements.

### 4.2 Linguistic Cues & Inquiry Generator (`lib/analysis/heuristics.ts`)
- Scans text for:
  - **Allegation & Hedging Cues:** `alleged`, `suspected`, `claims`, `reportedly`
  - **Absolutes & Superlatives:** `always`, `never`, `100%`, `undeniable`
  - **Entities & Currencies:** `$`, `€`, `£`, `₹`, organizations, names
- Synthesizes neutral, non-leading inquiry prompts to guide the reviewer's source discovery.

### 4.3 Claim–Evidence Graph (`components/graph/`)
- Powered by `@xyflow/react` (React Flow v12).
- Visually isolates statements from supporting, repeating, or contradicting source records.
- Enables reviewers to map cross-source citation relationships (`explicitly_cites`, `quotes`, `appears_to_repeat`, `possible_shared_origin`).
- **Contamination Separation:** Explicitly prevents linked evidence on one statement from bleeding into unverified secondary allegations.

### 4.4 Conservative Independence Engine (`lib/derive/independence.ts`)
- Builds an undirected dependency graph across linked evidence records.
- Groups sources into connected citation/repetition components:
  - `no_support`: No supporting records linked.
  - `single_source`: Only one supporting record exists.
  - `one_dependency_chain`: Multiple sources, but all repeat or cite each other (circular reporting / echo chamber).
  - `independence_unverified`: Disconnected branches exist, but the reviewer has not independently verified primary origin.
  - `reviewer_judged_independent`: Explicit reviewer verification recorded between distinct components.

### 4.5 Timeline & Earliest Traceable Record (`lib/derive/earliest.ts`)
- Handles variable date precision (`day`, `month`, `year`).
- **Honest Caveats:** If relevant records are undated, Factify labels the earliest source as **Provisional**, explicitly warning the reviewer that an undated source may have circulated earlier.

### 4.6 Lexical Wording Shift & Drift Detector (`lib/derive/wording.ts`)
- Uses tokenized Longest Common Subsequence (LCS) to compute exact word-level diffs between records.
- Automatically flags:
  - **Hedge $\rightarrow$ Assertion:** Shifts from unverified suspicion (*"investigators are probing a possible bribe"*) to certainty (*"he was confirmed to have taken a bribe"*).
  - **Scope Inflation:** Narrow quantifiers (*"some officials"*) expanding into broad universals (*"all officials"*).
  - **Dropped Attribution:** Stripping qualifiers like *"according to witnesses"* or *"police claimed"*.

### 4.7 Evidence Gap Matrix G1–G9 (`lib/derive/gaps.ts`)
Audits the investigation for missing critical steps:
- **G1 (no_source):** Statement has zero linked evidence records.
- **G2 (no_primary):** Sources exist, but none is marked primary by the reviewer.
- **G3 (date_unknown):** A linked record lacks a confirmed publication date.
- **G4 (excerpt_unclear):** Relevance of the excerpt is flagged as ambiguous.
- **G5 (scope_mismatch):** Mismatch between statement scope and cited excerpt.
- **G6 (independence):** Supporting records lack verified independent origination.
- **G7 (contradiction):** A direct contradiction remains unaddressed.
- **G8 (relationship_unknown):** Two records share a statement without an identified connection.
- **G9 (stale_assessment):** Statement edited after initial link evaluation.

*(Reviewers can dismiss any gap with an auditable rationale logged into the report).*

### 4.8 Machine-Assisted Search Integration (`backend/` & `app/api/search/`)
- Integrates an optional search tray allowing reviewers to query web archives, news sources, and official documents.
- **Zero Client-Side Keys:** The browser never touches search provider APIs or keys. All requests route through Next.js server route handlers (`/api/search`) to a Python FastAPI backend (`backend/factify_search.py`).
- **Safe Confirmation Dialog:** Search results are strictly **unconfirmed suggestions**; they are excluded from graphs, gaps, and exports until the reviewer explicitly reviews, verifies, and imports them.
- Supports **Mock Provider** (offline test data), **Brave Search API**, and **Serper API**.

---

## 🏛️ 5. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) & [React 19](https://react.dev/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives, [lucide-react](https://lucide.dev/) |
| **Graph Visualization** | [@xyflow/react](https://reactflow.dev/) (React Flow v12) |
| **State & Persistence** | [Zustand v5](https://github.com/pmndrs/zustand) with [localforage](https://localforage.github.io/localForage/) (IndexedDB wrapper) |
| **Search Backend** | [FastAPI](https://fastapi.tiangolo.com/), Uvicorn, HTTPX, Pydantic |
| **Data Validation** | [Zod v4](https://zod.dev/) |
| **Testing & Quality** | [Vitest](https://vitest.dev/), Pytest, ESLint (with custom AST rules forbidding verdict terminology) |

---

## 📂 6. Repository Structure

```
Factify/
├── app/                        # Next.js App Router
│   ├── api/search/             # Server routes with rate-limiting & provider proxy
│   ├── report/                 # Full investigation dossier & export view
│   ├── layout.tsx              # Root layout & providers
│   ├── page.tsx                # Main multi-step application page
│   └── globals.css             # Tailwind v4 theme configurations
├── backend/                    # FastAPI search prototype
│   ├── factify_search.py       # FastAPI application, caching & provider adapters
│   ├── test_factify_search.py  # Pytest test suite for search endpoints
│   └── requirements.txt        # Python backend dependencies
├── components/                 # React UI components
│   ├── steps/                  # Step 1 (Enter), Step 2 (Breakdown), Step 3 (Workspace)
│   ├── graph/                  # React Flow canvas, claim/source nodes & edge controls
│   ├── panels/                 # Gap drawer, wording compare, and source details
│   ├── search/                 # Search drawer, suggestion chips & confirmation modal
│   └── ui/                     # Accessible Radix-based UI components
├── lib/
│   ├── analysis/               # Statement splitting, span protection, inquiry heuristics
│   ├── derive/                 # Pure functions: buildGraph, independence, earliest, gaps, wording
│   ├── export/                 # Markdown, JSON, and print export formatters
│   ├── search/                 # Zod validation schemas & URL canonicalization
│   └── copy.ts                 # Shared disclaimers, microcopy, and UI copy
├── store/
│   └── review-store.ts         # Type-safe Zustand store with localforage migration
├── data/
│   └── demo.ts                 # Preset 2099 Port Halvren fictional investigation
├── tests/                      # Vitest unit & integration test suites
├── scripts/
│   └── check-secrets.mjs       # Secret prevention verification script
└── package.json
```

---

## 🚀 7. Getting Started

### Prerequisites
- **Node.js:** `>= 20.x`
- **npm:** `>= 10.x`
- **Python:** `>= 3.11` *(only needed if running the search backend)*

---

### Quick Start (Frontend Only — Full Offline Mode)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Harshlokhande07/Factify.git
   cd Factify
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser. All core features (splitting, graph, timeline, wording shifts, gaps, reports) run 100% locally in your browser!

---

### Running with the Search Backend (Optional)

1. **Set up the Python backend environment:**
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

   pip install -r requirements.txt
   cd ..
   ```

2. **Configure environment variables (optional):**
   - For offline simulated search: No configuration needed (defaults to `mock` mode).
   - For real search, create `backend/.env`:
     ```env
     SEARCH_PROVIDER=brave        # 'brave', 'serper', or 'mock'
     BRAVE_API_KEY=your_api_key_here
     ALLOWED_ORIGINS=http://localhost:3000
     ```
   - In `.env.local` (root directory):
     ```env
     FACTIFY_SEARCH_URL=http://localhost:8000
     ```

3. **Run both frontend and backend concurrently:**
   ```bash
   npm run dev:all
   ```

---

## 🧪 8. Verification & Testing

Factify includes automated test suites covering rule engines, state mutations, and API isolation:

```bash
# Run complete verification pipeline:
# (TypeScript strict check + ESLint + secret scanner + Vitest tests + Next.js build)
npm run verify

# Run frontend tests alone:
npm run test

# Run search backend pytest suite:
npm run backend:test
```

---

## 🏙️ 9. Fictional 2099 Case Study

Factify comes preloaded with a sample fictional investigation set in the year **2099** (*"Port Halvren: Councillor Arrest & Espionage Rumour"*):

- **Claim A (Municipal Permit Arrest):** Backed by a verified primary police release ($S_1$) and city newspaper report ($S_2$).
- **Claim B (Foreign Espionage Rumour):** Circulated across viral forums ($S_3, S_4, S_5$) repeating the claim without primary backing.
- **Demonstration:** Illustrates how Factify keeps Claim A and Claim B isolated, flags circular citations among $S_3, S_4, S_5$, identifies an undated record ($S_4$) with provisional earliest caveats, and documents wording drift from *"investigators probing"* to *"confirmed spy"*.

---

## 📄 10. License

This project is licensed under the [MIT License](LICENSE).
