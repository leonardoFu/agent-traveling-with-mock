# 0013 – Testing Plan

Deterministic, modular testing with scripts/checklists per phase. No live APIs.

## Approach
- Fixed TripSpec fixtures, seeds, `now`, and mock datasets.
- Run nodes in isolation and small chains; assert schemas, caps, flags/assumptions/conflicts.
- Avoid golden free text; assert structured markers and required fields.
- Provide npm scripts per phase (see Modular Testing below).

## Phase Checklists & Scripts
- **Phase 0 (Setup)**: `pnpm lint` + `pnpm test` (empty baseline) to ensure tooling wired.
- **Phase 1 (Data & Tools)**: `pnpm test data` (fixtures load, schema checks for datasets, deterministic sort). Assert mock tools respect offline-only and seeds.
- **Phase 2 (Agent Runtime)**: `pnpm test nodes` runs node-level tests for Guardrail/Planner/Curator/Itinerary/Tickets/Budget/Checker/Formatter.
- **Phase 3 (API)**: `pnpm test api` hits POST `/api/agent` with fixtures; asserts status, Markdown present, needs_info mapping to 400.
- **Phase 4 (UI)**: `pnpm test ui` (or Playwright smoke) submits form with fixtures and renders Markdown.
- **Phase 5 (E2E Scenarios)**: `pnpm test scenarios` runs the scenario suite below end-to-end (graph/API) with fixed seeds.

## Node Test Matrix (examples)
- **Guardrail**: Missing destination/date → `needs_info`; conflicting flags (offline_only+enable_google) → offline enforced; overlong trip → `fail`.
- **Planner**: Normalize dates/ranges to ISO; infer currency from origin; default traveler_count=1; record assumptions (pace, currency).
- **Attraction Curator**: Offline-only → no Google items; Google-enabled → cap 3–5 items, source labeled; seasonal filter applies.
- **Itinerary Builder**: Pacing respected (relaxed vs packed activity counts); fixed event inserted; travel_time_est included; alternates present; tensions flagged when overpacked.
- **Ticket Finder**: 3–5 options; at least one nonstop when plausible; layover risk flagged; arrival+1 date when red-eye.
- **Budget Estimator**: Over_budget flag true when totals exceed user budget; per-day average present; buffer applied once.
- **Constraint Checker**: Detect overpacked blocks, tight layovers, over_budget; suggestions concise; severity ordering.
- **Formatter**: Renders Markdown with all required sections; includes source labels for attractions; handles needs_info/error mode.

## End-to-End Scenarios (samples)
1) **Standard city trip**: NYC → Tokyo, 5 days, $2000, interests food+culture, offline_only=true → Expect mock-only attractions, over_budget?=false, no Google labels.
2) **Seasonal + Google**: Paris spring, enable_google=true → Expect seasonal item and 3–5 Google-labeled items; itinerary uses them; source badges shown.
3) **Mobility constraint**: Rome, limited walking → Itinerary reduces hops; Constraint Checker flags any long walks; suggestions present if violated.
4) **Tight budget**: SF weekend, $500 → Budget Estimator flags over_budget; Constraint Checker suggests lodging band/meal cuts.
5) **Fixed event + red-eye**: LA → London with 7pm show Day 1; red-eye arrival → Itinerary honors fixed event and flags pre-show squeeze; Ticket Finder marks arrival+1; Constraint Checker warns.

## Fixtures & Determinism
- Fix `now`, seeds, and mock datasets; sort outputs deterministically.
- Provide attraction, ticket, and cost tables as test fixtures; avoid randomness.

## Failure/Partial States
- Guardrail `needs_info` → Formatter renders Needs Info section; ensure no downstream sections.
- Node failure after retries → Orchestrator/Formatter include concise error summary.

## TODO
- Define exact assertions per node (schemas/caps).
- Add reference fixtures for mock datasets and cost tables.
- Wire npm scripts to test commands above (data/nodes/api/ui/scenarios).
