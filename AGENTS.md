<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# FACTIFY — Misinformation Origin & Evidence Tracing Assistant

## 0. Operating Invariants
1. **No verdicts**: UI never shows true/false, fake/real, truth percentage, trust score, or source reliability rating. No automated truth detection. No chatbot.
2. **Separation of concerns**: Checklist completion, claim–source relationships, and human review status are three separate things. Adding sources or ticking boxes never changes the review status automatically.
3. **Conservative independence**: A source that repeats or cites another source is not independent corroboration. A source with no recorded relationship is "independence not established", never "independent".
4. **No causal assumptions**: Date order and wording similarity never prove copying, causation, or origin.
5. **Single source of truth**: The Zustand store holds evidence data; the graph, timeline, gap list, comparison panel, and report are all derived by pure functions.
6. **Immutable original text**: Original submitted text is stored verbatim and is immutable after investigation creation. Changing it requires a new investigation.
7. **Offline client-side & amended network invariant (deliberate post-hackathon exception):** Core Factify still works fully offline and with no backend. The search feature is optional, runs only on an explicit click, and degrades gracefully. Network calls happen only from our own server routes to our own backend. The browser never calls the search provider and never sees an API key.
8. **Fictional demo data**: All demo content is fictional, set in 2099 ("Port Halvren", "Councillor Mara Quillon").
9. **Shared disclaimer**: Every main screen and the report display: *"Factify helps you organize and trace an evidence review. It does not independently prove or disprove a claim."*
10. **Heuristics labelled**: All automated suggestions are labelled as heuristics ("suggested", "unconfirmed"), editable, and never presented as findings.

## Tech Stack & Recorded Versions
- Next.js: 16.4.0 (App Router)
- React: 19.3.0
- Tailwind CSS: 4.x
- Graph: @xyflow/react (React Flow v12)
- State & Persistence: Zustand v5 with localforage storage wrapper
- Icons: lucide-react
- Themes: next-themes
- Notifications: sonner
- Validation: zod 4.x
- Testing: Vitest (frontend) & Pytest (Python search backend)
- Backend: FastAPI, Uvicorn, HTTPX

## Folder Structure
- `app/`: Next.js pages (`page.tsx`, `report/page.tsx`, `layout.tsx`, `globals.css`, `api/search/route.ts`, `api/search/health/route.ts`)
- `backend/`: FastAPI search prototype (`factify_search.py`, `test_factify_search.py`, `requirements.txt`, `README.md`)
- `components/`: UI components, steps (Step 1 Enter, Step 2 Breakdown, Step 3 Workspace), graph canvas, timeline, chain list, detail panels, gaps, wording compare, search tray (`search-sheet.tsx`, `confirm-suggestion-dialog.tsx`)
- `lib/analysis/`: Pure rule-based statement splitting, highlight detection, question generation
- `lib/derive/`: Pure derivation functions (`buildGraph`, `computeIndependence`, `computeEarliest`, `computeGaps`, `compareWording`, `buildReportModel`)
- `lib/export/`: Markdown, JSON, and print exports
- `lib/search/`: Search types, Zod schemas, URL canonicalization
- `lib/copy.ts`: Shared disclaimers, microcopy, labels, and constants
- `store/review-store.ts`: Typed Zustand store with localforage persistence (version 2) and migration
- `data/demo.ts`: Fictional 2099 Port Halvren seed dataset
- `tests/`: Vitest test suites for splitter, features, independence, earliest, gaps, wording, search, store integrity

## Verify Command
`npm run verify` (`tsc --noEmit && eslint && npm run check:secrets && vitest run && next build`)
`npm run backend:test` (`cd backend && python -m pytest -q`)

## Assumptions
1. antigravity-workspace-kit not found; proceeding directly with standard Next.js + shadcn design.
2. Stitch MCP unavailable; proceeding with custom polished shadcn/ui components.
3. System font stack used (`Inter, system-ui, -apple-system, sans-serif`) with full offline compliance.
4. Tailwind v4 uses `@theme` and `@import "tailwindcss"` in `app/globals.css`.
5. Mobile breakpoint defaults to Chain list view below 768px while keeping Graph view available.
6. Ephemeral filter state: Filters only hide records in the visual layer, never delete data, and are not persisted across reloads. A real-time "N hidden by filters" chip is provided.
7. Separation of concerns verified: Checklist completion, claim-source linking, and human review status are isolated; mutating one never triggers an automated change in the review status selector.
8. Hydration safety: `useSyncExternalStore` is used on `/report` and hydration guards on main page to prevent SSR/hydration mismatch with localStorage without cascading effects.
9. Language rule enforcement: ESLint `no-restricted-syntax` rule added in `eslint.config.mjs` prohibiting verdict and reliability words (`true`, `false`, `fake`, `real`, `hoax`, `debunked`, `verdict`, `trust score`, `credibility score`, `reliability`) on JSXText and JSX attributes.
10. Search integration operates with zero runtime keys on the frontend: Next.js reads only server-side `FACTIFY_SEARCH_URL` (defaulting to `http://localhost:8000`).
11. Machine suggestions are never evidence until the reviewer confirms them; unconfirmed suggestions are excluded from graph, timeline, gaps, independence, and the report.
12. Stance is never detected by the search engine; link type defaults to `not_established` for the reviewer to classify.
13. `matchStrength` is displayed only as qualitative buckets ("High" ≥0.5, "Medium" ≥0.3, "Low" <0.3) with explicit retrieval-similarity caveats, never as numbers or percentages.
14. Search-engine dates are treated as estimates; `firstArchivedAt` is explicitly labelled as an archive capture date and never copied to `publishedAt`.
15. Mock data rule enforced: Results marked `fromMockData` can only be confirmed into demo investigations; attempting to confirm into real investigations is blocked.
16. Persisted store version bumped to 2 with automatic migration initializing `suggestions: []` and `searchRuns: []`.
17. Rate limiting: Server route `/api/search` enforces a 10 requests/minute/IP memory limit with 20s timeout and 2MB response size limit.
18. Demo mode (`demo: true`) forces `provider: 'mock'` on `/api/search`.

