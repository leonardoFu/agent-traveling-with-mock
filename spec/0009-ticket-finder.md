# 0009 – Ticket Finder Node Spec

Based on the sub-agent template; filled for the Ticket Finder node.

## 1) Purpose
- **Role**: Propose mocked transport options (flight/train/bus) matching TripSpec origin/destinations and dates; highlight a best option via simple heuristics.
- **Success Criteria**: Returns 3–5 realistic options with carrier/mode, times, duration, layovers, fare class, baggage note, and price estimate; identifies a best-pick rationale.
- **Non-goals**: No real API calls/bookings; no loyalty optimization; does not format Markdown output.

## 2) Inputs
- **Required fields**: TripSpec (origin, destinations[], dates/date_range or trip_length), traveler_count; flags (offline_only/enable_google irrelevant here).
- **Optional fields**: time windows (arrival/departure), airport/station preferences, cabin preference.
- **Internal state consumed**: orchestrator_state.seed; assumptions.
- **Feature flags**: None specific (always mock).

## 3) Outputs
- **Primary output shape**: tickets[] of TicketOption { mode, carrier, depart/arrive locations, depart/arrive times, duration, layovers[], fare_class, price_est, baggage, notes, score, best_pick? } plus assumptions[].
- **Output constraints**: 3–5 options; at least one nonstop if plausible; include duration and basic fare class; price_est in TripSpec currency when possible.
- **Downstream dependencies**: Budget Estimator consumes price_est; Constraint Checker uses layovers/times; Formatter renders options and best pick.

## 4) Core Behaviors & Rules
- **Algorithm/heuristics**:
  - Choose mode by region/distance (flight for intercontinental/long-haul; train/bus for regional when sensible).
  - Generate plausible schedules around requested dates; honor time windows if provided.
  - Score options by duration vs. price vs. layover risk; pick best balanced option.
  - Include baggage notes (e.g., carry-on only for lowest fare).
- **Edge cases**: Open-jaw/multicity—return segments per leg; red-eyes—note arrival+1; time zones—adjust arrival date.
- **Fallbacks**: If origin missing, return assumption and generic options from destination hub; if budget missing, price_est still provided but assumption noted.
- **Assumptions to label**: Default airport/station choices, cabin default (economy), time window defaults (midday).

## 5) Tools (if applicable)
- **Tool name & role**: Mock transport dataset generator.
- **Inputs/outputs**: Inputs: origin, destination, date(s), mode preference; Outputs: list of TicketOption-like records.
- **Limits**: Local only; cap 5 options.
- **Failure handling**: On missing inputs, return assumptions; no retries needed.
- **Security/sanitization**: N/A (local).
- **Determinism**: Seeded option generation and sorting.

## 6) Prompting (System Guidance)
- **System intent**: "Return 3–5 plausible mocked transport options with times, duration, layovers, fare class, baggage, price estimates; mark a best option."
- **Content requirements**: Include depart/arrive times and locations; duration; layovers with cities/durations; fare_class; baggage note; price_est; best-pick rationale.
- **Prohibited behavior**: No real API calls; do not exceed caps; do not promise booking.
- **Clarifying questions policy**: None; proceed with assumptions and label them.

## 7) Determinism & Limits
- **Seeding/sorting**: Sort by score then duration; seeded tie-breaks.
- **Caps**: 5 options max; 2 layovers max; avoid excessively long layovers unless necessary.
- **Timeouts/retries**: N/A.

## 8) Errors & Guardrails
- **Validation errors**: Missing destination/date → fail; otherwise proceed with assumptions.
- **Conflict detection**: Flag very short layovers (<60 min international, <45 min domestic) and red-eye arrivals impacting day 1.
- **Safety**: No PII; no external calls.

## 9) Dependencies & I/O Contracts
- **Inputs required from**: Planner (TripSpec), Orchestrator (seed), Guardrail (flags).
- **Outputs provided to**: Budget Estimator (price_est), Constraint Checker (times/layovers), Formatter.
- **Schemas referenced**: TicketOption.

## 10) Observability
- **Log fields**: run_id, session_id, option_count, modes_used, best_pick id, assumptions count.
- **Metrics**: average price_est, duration averages, layover risk flags.
- **Source labeling**: source=mock for all options.

## 11) Sample I/O
- **Sample input**: TripSpec (NYC→Tokyo, dates Apr 10–15, traveler_count 1).
- **Sample output**: 4 options (2 flights with durations/layovers, 1 nonstop premium economy, 1 flight+train combo), one marked best_pick with rationale on balance of price vs. duration.
- **Notes**: Include arrival date rollovers when crossing time zones.

## 12) Integration with Markdown Formatter
- **Data handed off**: tickets[], best_pick, assumptions/flags.
- **Formatting hints**: Formatter should show a best-pick callout plus a concise table/list of options with times/durations/layovers/baggage.

## 13) Open Questions / TODOs
- Standard layover risk thresholds per region.
- Default airport/station mapping rules for major metros.
- Price bands and currency conversion assumptions if currency missing.
