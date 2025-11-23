# 0012 – Formatter (Markdown Report) Node Spec

Based on the sub-agent template; filled for the Formatter node.

## 1) Purpose
- **Role**: Convert aggregated node outputs into a concise, human-friendly Markdown report with consistent sections.
- **Success Criteria**: Produces readable Markdown covering trip snapshot, tickets, itinerary, attractions, budget, conflicts/assumptions; handles partial/failed runs gracefully.
- **Non-goals**: No planning logic; no tool calls; no JSON output.

## 2) Inputs
- **Required fields**: TripSpec; itinerary_days; attractions[]; tickets[]; budget; constraint_report.
- **Optional fields**: assumptions from all nodes; issues/questions from Guardrail; flags; run status/errors.
- **Internal state consumed**: orchestrator_state for flags/seed; not used for content.
- **Feature flags**: enable_google/offline_only for source labeling.

## 3) Outputs
- **Primary output shape**: Markdown report (string) with sections:
  - Trip Snapshot (origin, destinations, dates, travelers, pace, flags)
  - Tickets (best pick + options)
  - Itinerary (per-day blocks with travel times and alternates)
  - Attractions (grouped, source-labeled)
  - Budget (total, per-day, breakdown, over/under)
  - Conflicts & Suggestions (from Constraint Checker)
  - Assumptions & Notes (cross-node)
  - If needs_info/fail: Needs Info / Error section
- **Output constraints**: Brevity; consistent headings; source labels (mock/google); no JSON or code fences unless showing sample commands (unlikely).
- **Downstream dependencies**: Final user-facing output.

## 4) Core Behaviors & Rules
- **Algorithm/heuristics**:
  - Assemble sections in fixed order; omit empty sections or note when data unavailable.
  - Highlight top items succinctly (e.g., 3 ticket options, daily summaries).
  - If constraint_report has conflicts, surface them with severity; map suggestions nearby.
  - If guardrail needs_info/fail, prioritize Needs Info/Error section and trim other content.
- **Edge cases**: Partial data (e.g., no tickets) → include placeholder note; over_budget → call out delta; offline-only → mark that attractions are mock-only.
- **Fallbacks**: On missing critical inputs, emit error/needs-info Markdown instead of blank sections.
- **Assumptions to label**: Gather assumptions lists from nodes and render in one section.

## 5) Tools (if applicable)
- None; formatting only.

## 6) Prompting (System Guidance)
- **System intent**: "Render a concise Markdown trip report; consistent sections; label sources/assumptions; handle partial/error states gracefully."
- **Content requirements**: Keep bullets tight; include headings; show sources for attractions; indicate best ticket pick; include travel_time_est inline; show over/under budget.
- **Prohibited behavior**: No JSON; no new content beyond provided data; no external links unless supplied.
- **Clarifying questions policy**: None; report current state.

## 7) Determinism & Limits
- **Seeding/sorting**: Stable ordering (by date, by provided option order).
- **Caps**: Ticket options shown (3–5); attractions listing concise (grouping, not exhaustive text).
- **Timeouts/retries**: N/A.

## 8) Errors & Guardrails
- **Validation errors**: If required inputs missing, render Needs Info/Error section summarizing what’s missing.
- **Conflict detection**: Display existing conflicts; do not add new ones.
- **Safety**: Avoid PII; do not include URLs unless provided and safe; no hallucination.

## 9) Dependencies & I/O Contracts
- **Inputs required from**: All prior nodes (TripSpec, tickets, itinerary, attractions, budget, constraint_report, assumptions, issues).
- **Outputs provided to**: User (final Markdown string).
- **Schemas referenced**: ItineraryDay, Attraction, TicketOption, Budget, constraint_report.

## 10) Observability
- **Log fields**: run_id, session_id, sections included, presence of needs_info/error, conflict count surfaced.
- **Metrics**: percentage of reports with over_budget, with conflicts, with Google-sourced items.
- **Source labeling**: Maintain source badges for attractions; mark offline-only.

## 11) Sample I/O
- **Sample input**: Full set from prior nodes, with over_budget=false and minor conflicts.
- **Sample output**: Markdown with sections and bullets; Tickets section shows best pick; Itinerary per-day blocks with travel times; Attractions labeled mock/google; Budget with total/per-day/breakdown; Conflicts/Suggestions; Assumptions.
- **Notes**: If guardrail needs_info, output just Needs Info section with questions and skip other sections.

## 12) Integration with Markdown Formatter
- **Data handed off**: N/A (this is the Formatter).
- **Formatting hints**: Use `#`/`##` headings sparingly; prefer bullets/tables where compact; keep travel times inline (e.g., "Ueno → Asakusa ~18 min").

## 13) Open Questions / TODOs
- Decide standard headings and ticket/attraction table formats.
- Whether to include URLs if provided by Google-sourced items.
- Length limits for each section (e.g., max bullets per day).
