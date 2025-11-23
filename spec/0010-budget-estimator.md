# 0010 – Budget Estimator Node Spec

Based on the sub-agent template; filled for the Budget Estimator node.

## 1) Purpose
- **Role**: Estimate trip costs from mocked data: roll up transport, lodging band, meals, and activities to produce total and per-day budgets.
- **Success Criteria**: Outputs a clear breakdown with totals, per-day estimates, cost drivers, and over-budget flag relative to user budget (if provided); labels assumptions.
- **Non-goals**: Does not find attractions or tickets; does not handle currency conversion via live rates (use defaults).

## 2) Inputs
- **Required fields**: TripSpec (destinations, trip_length, traveler_count, budget?), tickets[] (price_est), itinerary_days (activity counts/stay times), cost defaults.
- **Optional fields**: lodging_prefs (band/area), meal preference (cheap/standard/premium), activity cost hints.
- **Internal state consumed**: assumptions from upstream; flags.
- **Feature flags**: None specific; offline-only has no effect (all mock).

## 3) Outputs
- **Primary output shape**: Budget { total, per_day[], breakdown { lodging, transit_local, tickets, meals, activities, buffer }, over_budget?, notes[], assumptions[] }.
- **Output constraints**: Use TripSpec currency when available; include per-day average; notes on drivers/uncertainty.
- **Downstream dependencies**: Constraint Checker uses over_budget/notes; Formatter renders Budget section.

## 4) Core Behaviors & Rules
- **Algorithm/heuristics**:
  - Tickets: sum price_est from Ticket Finder (per traveler where applicable).
  - Lodging: estimate per-night band (budget/standard/premium) times nights and traveler_count rooms assumption; adjust for area if provided.
  - Meals: per-day per-person rate (by band) × traveler_count × trip_length.
  - Activities: use count of scheduled activities × average cost by category/cost_level; include buffer for alternates.
  - Transit_local: estimate daily local transit/taxi allowance based on mobility/area spread.
  - Buffer: small contingency (e.g., 10%) unless budget is very tight.
  - Compare against user budget to set over_budget flag and quantify delta.
- **Edge cases**: Missing budget → skip over_budget but still provide totals; missing trip_length → infer from itinerary_days count; zero tickets → treat as N/A not zero cost.
- **Fallbacks**: If ticket price missing, use regional average and note; if cost_level missing on activities, assume mid-band.
- **Assumptions to label**: Room count (e.g., 1 room per 2 travelers), meal band default, buffer percentage, inferred currency.

## 5) Tools (if applicable)
- **Tool name & role**: Local cost tables for lodging/meal/activity bands; no external APIs.
- **Inputs/outputs**: Inputs: destination/area, cost_level, category; Outputs: average cost estimates.
- **Limits**: Static tables.
- **Failure handling**: If lookup missing, use global default and note.
- **Security/sanitization**: N/A.
- **Determinism**: Fixed tables; deterministic math.

## 6) Prompting (System Guidance)
- **System intent**: "Estimate trip costs from provided tickets, itinerary, and defaults; produce totals, per-day, breakdown, and over-budget flag; clearly state assumptions."
- **Content requirements**: Include breakdown categories; per-day average; over_budget flag with delta; key cost drivers in notes.
- **Prohibited behavior**: No live currency or real prices; no itinerary changes; no external calls.
- **Clarifying questions policy**: None; proceed with labeled assumptions.

## 7) Determinism & Limits
- **Seeding/sorting**: N/A; fixed computations.
- **Caps**: Reasonable buffers (e.g., ≤15% unless over_budget severe).
- **Timeouts/retries**: N/A.

## 8) Errors & Guardrails
- **Validation errors**: Missing TripSpec → fail; missing trip_length and itinerary_days → fail.
- **Conflict detection**: Flag over_budget; note high ticket share; note if lodging band mismatched with stated budget.
- **Safety**: No PII; no external calls.

## 9) Dependencies & I/O Contracts
- **Inputs required from**: Planner (TripSpec), Ticket Finder (tickets), Itinerary Builder (activity counts), Orchestrator (seed/flags if needed).
- **Outputs provided to**: Constraint Checker (over_budget, notes), Formatter (Budget section).
- **Schemas referenced**: Budget, TicketOption, ItineraryDay.

## 10) Observability
- **Log fields**: run_id, session_id, totals, over_budget flag, buffer applied, assumptions count.
- **Metrics**: average per-day cost, over_budget rate, share by category.
- **Source labeling**: Note which components were assumed vs. provided.

## 11) Sample I/O
- **Sample input**: TripSpec (Tokyo 5 days, budget $2000), tickets ($900), itinerary_days (10 activities mixed cost_levels), meal band=standard.
- **Sample output**: total $1,980; per_day ~$396; breakdown (tickets, lodging, meals, activities, transit, buffer); over_budget=false; notes on lodging band and buffer 10%.
- **Notes**: If no budget, omit over/under but still provide totals.

## 12) Integration with Markdown Formatter
- **Data handed off**: Budget breakdown, per-day average, over_budget flag/delta, assumptions/notes.
- **Formatting hints**: Show a summary line (total, per-day, over/under), then bullets for breakdown and key assumptions.

## 13) Open Questions / TODOs
- Standard cost tables per destination band.
- Room occupancy defaults and handling for families vs. solo.
- Buffer percentage rules by risk level.
