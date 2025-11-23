# 0011 – Constraint Checker Node Spec

Based on the sub-agent template; filled for the Constraint Checker node.

## 1) Purpose
- **Role**: Detect and summarize conflicts across itinerary, tickets, budget, and user constraints; propose minimal adjustments or highlight risks.
- **Success Criteria**: Flags conflicts (time clashes, tight connections, mobility issues, over-budget) and suggests concise fixes; passes along annotated outputs without breaking structure.
- **Non-goals**: Does not rebuild itinerary from scratch; does not recalc budgets beyond noting impacts.

## 2) Inputs
- **Required fields**: TripSpec; itinerary_days with blocks/travel_time_est; tickets[]; budget estimate (with over_budget flag).
- **Optional fields**: tensions from Itinerary Builder; assumptions from prior nodes.
- **Internal state consumed**: orchestrator_state.seed/flags.
- **Feature flags**: enable_google/offline_only only for context; no external calls.

## 3) Outputs
- **Primary output shape**: constraint_report { conflicts[], suggestions[], assumptions[] }.
  - conflict: { type, description, severity (info/warn/blocker), related_items[] }
  - suggestion: { action, rationale, impact }
- **Output constraints**: Keep list concise (max ~10 conflicts); severity ordered.
- **Downstream dependencies**: Formatter renders conflicts/suggestions; upstream data unchanged.

## 4) Core Behaviors & Rules
- **Algorithm/heuristics**:
  - Time feasibility: check block durations vs. stay_minutes + travel_time_est; fixed events fit.
  - Connection risk: layovers below thresholds; red-eye arrival vs. morning activities.
  - Mobility: long walks vs. mobility limits; too many area hops per day.
  - Budget: use Budget over_budget and note drivers.
  - Density: too many activities per block vs. pace.
  - Data gaps: missing travel_time_est or stay_minutes flagged as low confidence.
- **Edge cases**: Multicity splits too tight; open-jaw returns misaligned; no budget provided → skip over_budget.
- **Fallbacks**: If itineraries missing travel times, add low-confidence warning; if tickets missing, skip transport conflicts.
- **Assumptions to label**: Any inferred thresholds (pace caps, layover mins).

## 5) Tools (if applicable)
- None; pure checks.

## 6) Prompting (System Guidance)
- **System intent**: "Identify conflicts and risks across plan, transport, budget; propose minimal, actionable adjustments."
- **Content requirements**: Concise conflicts with severity; targeted suggestions; avoid re-planning.
- **Prohibited behavior**: Do not generate new attractions/tickets; do not change data; no external calls.
- **Clarifying questions policy**: None; report and suggest fixes.

## 7) Determinism & Limits
- **Seeding/sorting**: Sort conflicts by severity then deterministic key.
- **Caps**: Limit conflicts to ~10; suggestions to ~5 prioritized by impact.
- **Timeouts/retries**: N/A.

## 8) Errors & Guardrails
- **Validation errors**: Missing required inputs → fail.
- **Conflict detection**: Layover thresholds, overpacked blocks, over_budget, mobility violations.
- **Safety**: No PII; no external calls.

## 9) Dependencies & I/O Contracts
- **Inputs required from**: Planner (TripSpec), Itinerary Builder (itinerary_days/tensions), Ticket Finder (tickets), Budget Estimator (budget), Orchestrator (flags/seed).
- **Outputs provided to**: Formatter (conflicts/suggestions/assumptions).
- **Schemas referenced**: ItineraryDay, TicketOption, Budget, constraint_report shape.

## 10) Observability
- **Log fields**: run_id, session_id, conflict count by type/severity, suggestions count.
- **Metrics**: over_budget incidence, layover risk rate, overpacked blocks frequency.
- **Source labeling**: Note low-confidence checks due to missing travel times.

## 11) Sample I/O
- **Sample input**: Itinerary with 3 blocks, one fixed event at 7pm; ticket with 50-min international layover; budget over by $150.
- **Sample output**: conflicts: tight layover (warn), pre-show squeeze (warn), over_budget (warn); suggestions: pick longer layover, drop one pre-show activity, reduce lodging band.
- **Notes**: Keep actions minimal and specific.

## 12) Integration with Markdown Formatter
- **Data handed off**: conflicts and suggestions lists; assumptions/thresholds used.
- **Formatting hints**: Formatter should group conflicts with severity labels and pair suggestions directly.

## 13) Open Questions / TODOs
- Finalize layover minimums by region.
- Define pace-based max activities per block.
- Decide how to represent low-confidence travel-time estimates in Markdown.
