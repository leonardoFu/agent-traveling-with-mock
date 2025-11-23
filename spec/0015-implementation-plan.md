# 0015 – Implementation Plan

Concrete, phase-by-phase plan aligned with specs (0001–0014). Keep deterministic outputs, offline-first defaults, optional Google augmentation, and Markdown-only reporting.

## Overview
- Client/server Next.js (TypeScript) app with LangGraph (TS) runtime, mocked tools, optional Google Search.
- References: architecture (0002), node specs (0004–0012), testing (0013), tech spec (0014).

## Project Structure (planned) — `[ ]` = pending, `[x]` = done
```
agent-traveling-with-mock/
├── app/ [x]            # Next.js (App Router) UI + API routes
├── agent/ [x]          # LangGraph nodes, schemas, tools, shared types
├── datasets/ [x]       # Mock attractions, transport samples, cost tables
├── specs/ [x]          # 0001–0015 docs
├── tests/ [x]          # Vitest baseline
├── scripts/tests/ [ ]  # Optional test helpers
├── package.json [x]    # Single workspace (no packages/)
└── .env.example [x]    # Flags/keys (Google, LangSmith, OFFLINE_ONLY)
```

## Implementation Phases

### Phase 0: Setup
**Goal**: Tooling, repo scaffold, envs (single Next.js app).  
**Tasks**:
- [x] Scaffold Next.js (TS, App Router), strict TS, ESLint/Prettier; scripts: `lint`, `test`, `dev`, `build`.
- [x] Add deps: `@langchain/langgraph`, `langchain`, `langsmith` (or langfuse client), `react-markdown`, `zod`, Jest/Vitest.
- [x] Add `.env.example` (LANGSMITH_API_KEY, GOOGLE_SEARCH_KEY/ENGINE, ENABLE_GOOGLE_SEARCH, OFFLINE_ONLY, DEBUG_LOGGING, RUN_STATE_STORE).
- [x] CI skeleton (lint/test/build).
**Tests/Scripts**: `pnpm lint`, `pnpm test` (baseline), typecheck.  
**Exit/Verification**: CI green; env scaffold committed; deps installed; scripts run without errors.

### Phase 1: Data & Tools (0001, 0008, 0010)
**Goal**: Land mock datasets and deterministic tool wrappers.  
**Tasks**:
- [ ] Define and commit datasets (JSON/TS): attractions (id, destination, area, category, cost_level, stay_minutes, season tags, rationale), transport samples, cost tables (lodging/meal/activity bands), airports/rail hubs.
- [ ] Implement mock tools: attraction fetcher (filters), distance/time heuristic, mock ticket generator (mode by distance/region), cost lookup utilities.
- [ ] Optional Google Search tool: flag-gated, sanitized queries, capped results, source=google mapping.
- [ ] Determinism: seed support, stable sorting, offline-only short-circuits Google.
**Tests/Scripts**: `pnpm test data` (dataset schema checks, tool determinism, offline-only bypass).  
**Exit/Verification**: Datasets load and pass schema checks; seeded tool runs produce identical outputs; offline-only yields zero Google items; Google tool only active when flag set and queries sanitized.

### Phase 2: Agent Runtime (0002–0012)
**Goal**: Implement nodes and wire LangGraph.  
**Tasks**:
- [ ] Define shared schemas (zod/TS): TripSpec, Attraction, TicketOption, ItineraryDay, Budget, constraint_report, Markdown report contract.
- [ ] Node implementations (per spec):
  - **Orchestrator (0004)**: run_id/seed/flags generation; routing table; retry/backoff policy; step recording.
  - **Guardrail (0005)**: input validation/caps; flag resolution (offline_only overrides Google); needs_info/fail outputs; sanitization stubs.
  - **Planner (0006)**: TripSpec normalization; assumptions array; deterministic sorting.
  - **Attraction Curator (0008)**: mock fetch + optional Google augmentation (flag-gated); caps (8–12 total, 3–5 Google); source labels; seasonal filter; deterministic selection.
  - **Itinerary Builder (0007)**: day blocks; travel_time_est via heuristic tool; alternates; pacing rules; tensions list; deterministic ordering.
  - **Ticket Finder (0009)**: mock options generation (3–5); mode selection by distance/region; layover risk flags; best_pick; deterministic ordering.
  - **Budget Estimator (0010)**: rollups (tickets/lodging/meals/activities/transit/buffer); over_budget flag/delta; assumptions.
  - **Constraint Checker (0011)**: conflict detection (time, layover, mobility, over_budget); suggestions; severity ordering.
  - **Formatter (0012)**: Markdown sections; needs-info/error path; source badges; no JSON.
- [ ] Wire LangGraph: Planner → Curator → Itinerary → Tickets → Budget → Checker → Formatter; propagate flags/seed; enforce offline-only vs Google (block Google node when flagged).
- [ ] Standardize error codes/messages for Formatter; ensure all nodes emit assumptions/conflicts consistently.
**Tests/Scripts**: `pnpm test nodes` (schemas, caps, flags, determinism per node).  
**Exit/Verification**: Happy-path graph returns stable Markdown with fixed seed; offline-only path makes no Google calls; all node tests green; assumptions/conflicts present with standardized fields.

### Phase 3: API Surface (0014)
**Goal**: Expose agent via API routes.  
**Tasks**:
- [ ] POST `/api/agent`: accept user_message or structured fields + session_id + flags; invoke graph; return `{ report_markdown, run_id, flags, conflicts?, assumptions?, status }`.
- [ ] Optional GET `/api/agent/run/:id`: fetch last report/state (memory/Redis).
- [ ] Input validation (zod); map Guardrail needs_info to HTTP 400 with Markdown + `status=needs_info`.
- [ ] Logging middleware: run_id, flags, latency; PII redaction.
**Tests/Scripts**: `pnpm test api` (success + needs_info; status codes; Markdown present; flags echoed).  
**Exit/Verification**: API returns 200 with Markdown and flags on success; returns 400 with Needs Info Markdown/questions on guardrail failures; logs include run_id/flags with PII redacted.

### Phase 4: UI (0014)
**Goal**: Collect preferences and render Markdown reports.  
**Tasks**:
- [ ] Form: destinations, dates/range, origin, travelers, budget+currency, interests, pace, mobility, exclusions, fixed events, Google toggle, offline-only toggle.
- [ ] Report pane: render Markdown (react-markdown); show source badges, run_id, flags, over_budget/conflict badges.
- [ ] Controls: regenerate, toggle Google/offline and rerun, optional download Markdown.
- [ ] Client validation; needs-info handling (show questions, allow resubmit).
- [ ] Choose minimal component library (shadcn/ui or Chakra) and theme.
**Tests/Scripts**: `pnpm test ui` or Playwright smoke (submit fixture, render Markdown, needs-info path).  
**Exit/Verification**: UI submits fixture, renders returned Markdown with badges, handles needs-info display/resubmit, and toggling Google/offline triggers rerun successfully.

### Phase 5: Testing & Observability (0013)
**Goal**: Full test harness and traces/metrics.  
**Tasks**:
- [ ] Ensure node/unit tests green; determinism (fixed seed/now).
- [ ] Scenario regressions: standard trip; seasonal+Google; mobility constraint; tight budget; fixed-event red-eye (assert structured markers).
- [ ] API contract tests (success + needs_info).
- [ ] Observability: LangSmith/LangFuse/Phoenix traces per node; metrics (latency, retries, over_budget, conflicts, Google usage); structured logs with run_id/flags and redaction.
**Scripts**: `pnpm test nodes`, `pnpm test api`, `pnpm test scenarios`, `pnpm test ui` (if present).  
**Exit/Verification**: All suites green; traces/metrics/logs visible in chosen backend; determinism verified with fixed seeds/now; scenario assertions (counts/flags/sources/over_budget/conflicts) satisfied.

### Phase 6: Deployment & Ops
**Goal**: Deploy and operate with feature flags.  
**Tasks**:
- [ ] Deploy target: Vercel or container (Node 18+), server-side agent.
- [ ] Env/flags per env: offline-only default in dev; Google opt-in in prod; DEBUG_LOGGING in staging only.
- [ ] State store: in-memory dev; Redis/Upstash for resume in prod.
- [ ] CI: lint/test/build on PR; optional Playwright smoke.
- [ ] Runbooks: toggle Google/offline, rotate keys, switch observability endpoints, rollback steps.
**Tests/Scripts**: CI green; post-deploy smoke (submit fixture); flag toggle check.  
**Exit**: Deployed to staging/prod; flags operational; rollback and toggles verified.

## Milestones & Acceptance
- **M1**: Setup + datasets/tools landed; data tests pass.
- **M2**: Nodes implemented/wired; happy-path Markdown with fixed seed; node tests pass.
- **M3**: API + UI deliver reports; needs-info path works.
- **M4**: All tests (nodes/api/scenarios/ui) green; observability live.
- **M5**: Deployed with flags/runbooks; smoke tests pass.

## Testing Commands (indicative)
```
pnpm lint
pnpm test           # baseline/unit
pnpm test data      # datasets/tools
pnpm test nodes     # node/unit
pnpm test api       # API contracts
pnpm test ui        # UI smoke (if configured)
pnpm test scenarios # end-to-end fixtures
```

## Risks / Open Items
- Observability choice: LangSmith vs LangFuse/Phoenix.
- Finalize dataset formats/paths and versioning.
- Google provider/quota if enabled.
- UI component library selection (keep lightweight).

## Next Steps
1) Review/align on observability stack and UI library.  
2) Start Phase 1 dataset/tool landing with deterministic fixtures.  
3) Decide on scripts/tests helpers or fixtures structure if needed for Phase 1–2.
