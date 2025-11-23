# 0014 – Technical Spec (Stack, Framework, Tooling)

Tech stack and implementation plan for the travel agent, aligned with existing architecture/spec docs.

## Goals
- Ship a client/server agent app with a fast UI to collect user preferences and display the Markdown report.
- Use Next.js (TypeScript) for the app surface; TypeScript LangGraph/LangChain for the agent runtime; LangSmith/LangFuse-compatible observability.
- Preserve existing architecture: offline-first with optional Google Search, mocked tools, deterministic outputs, and Markdown-only responses.

## Architecture (Client/Server)
- **Client**: Next.js (App Router), TypeScript, React. Renders a control panel + conversation pane showing Markdown reports. Uses fetch/HTTP for agent calls; no direct model calls from the browser.
- **Server**: Next.js API routes (or dedicated `/api/agent` route handler) hosting the LangGraph runtime. Stateless per request except for session/run IDs; persists lightweight run state (run_id, seed, flags, last_step) in memory or a small store (e.g., Redis/Upstash) to support resume.
- **Data**: Mock datasets (attractions, airports/stations, costs) bundled locally; optional Google Search tool behind a feature flag. Offline-only path must not hit network.
- **Observability**: LangSmith tracing (preferred) or LangFuse/Phoenix via OpenTelemetry; structured logs per node with PII redaction.

## Core Framework/Libs
- **Next.js**: v14+ with App Router, React Server Components where suitable; TypeScript strict mode.
- **LangGraph (TS)**: Node definitions for Orchestrator, Guardrail, Planner, Attraction Curator, Itinerary Builder, Ticket Finder, Budget Estimator, Constraint Checker, Formatter.
- **LangChain (TS)**: Prompt utilities and tool abstractions (mock data fetchers, optional Google Search wrapper).
- **LangSmith (TS)**: Tracing/evals; datasets for regression runs. Acceptable alternates: LangFuse/Phoenix via OTEL.
- **UI**: React + Markdown renderer (e.g., `react-markdown`), minimal component library (e.g., shadcn/ui or Chakra) to move fast; no blocking dependency on heavy design systems.
- **Tooling**: Node 18+, pnpm/yarn; ESLint + Prettier; Jest/Vitest for unit/integration tests; Playwright (optional) for UI sanity.

## Runtime Flow (Server)
1) API receives request with user inputs + session_id.  
2) Orchestrator seeds run_id/flags; Guardrail validates.  
3) Planner builds TripSpec.  
4) Attraction Curator (mock + optional Google).  
5) Itinerary Builder consumes curated attractions.  
6) Ticket Finder proposes mocked transport options.  
7) Budget Estimator rolls up costs.  
8) Constraint Checker flags conflicts/suggestions.  
9) Formatter returns Markdown report.  
10) Response: `{ report_markdown, run_id, flags, conflicts?, assumptions? }`.

## API Surface
- **POST `/api/agent`**: body includes user_message or structured fields (destination(s), dates/range, origin, budget, travelers, interests, mobility, exclusions, fixed_events, pace, flags: enable_google/offline_only). Returns Markdown report + trace ids.  
- **GET `/api/agent/run/:id`** (optional): fetches prior run state/report for resume.
- **Error/Needs Info**: If Guardrail needs info, return Markdown “Needs Info” with questions and `status=needs_info`.

## UI Requirements
- Input form capturing all required/preferred fields (destinations, dates/range, origin, travelers, budget, interests, pace, mobility, exclusions, fixed events, Google toggle, offline-only toggle).
- Display pane for Markdown report (rendered with source badges for attractions).
- Show run metadata: run_id, flags, over_budget/conflict badges.
- Quick actions: “Regenerate with same inputs”, “Toggle Google/offline and rerun”, “Download Markdown” (optional).
- Basic validation client-side (dates, required fields) before POST.

## Data & Tools
- **Mock datasets**: Attractions (with areas, categories, stay_minutes, cost_level, season tags), airports/rail hubs, cost tables (lodging/meal/activity bands), transport samples.
- **Optional Google Search tool**: Only when `enable_google=true` and `offline_only=false`; rate-limited; sanitized queries; failures fall back to mock-only.
- **Heuristic utilities**: Distance/time estimator; seasonal lookup.

## Config & Flags
- `.env` for API keys (Google), LangSmith/LangFuse keys, runtime flags.  
- Feature flags: `ENABLE_GOOGLE_SEARCH`, `OFFLINE_ONLY`, `DEBUG_LOGGING`. Offline-only overrides Google.  
- Determinism: propagate `seed`; fix `now` in tests; stable sorting in nodes.

## Testing (aligned with 0013)
- Unit tests per node (schema assertions, caps, flag handling).  
- Scenario regression suite (fixtures for standard trip, seasonal+Google, mobility, tight budget, fixed event/red-eye).  
- Contract tests for API payloads (required fields, needs_info path).  
- Snapshot-free: assert on structured fields and markers (counts, flags, sources), not long text.  
- CI: lint + tests on push; optional Playwright smoke for UI submit/render.

## Observability & Monitoring
- LangSmith tracing per run/node; log run_id, flags, step timings, retries, conflicts.  
- Metrics: per-node latency, retry rate, over_budget rate, conflict incidence, Google usage.  
- Logs: structured JSON with PII redaction; include source labels (mock/google).

## Delivery/Deployment
- Target: Next.js app deployable to Vercel or container.  
- Runtime: Node 18+; edge not required (agent runs server-side).  
- State store: in-memory for dev; Redis/Upstash for resumable runs.  
- CD: GitHub Actions (lint/test/build) → deploy.

## Open Items
- Choose UI component lib (minimal) and Markdown renderer.  
- Decide on LangSmith vs LangFuse/Phoenix for observability.  
- Finalize mock dataset formats and where they live in the repo.  
- Define Google Search provider (if/when enabled) and quotas.
