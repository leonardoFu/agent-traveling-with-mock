# 0007 – Itinerary Builder Node Spec

Based on the sub-agent template; filled for the Itinerary Builder node.

## 1) Purpose
- **Role**: Create a draft day-by-day plan with time blocks (morning/afternoon/evening), sequencing activities to reduce backtracking and account for travel times and fixed events.
- **Success Criteria**: Produces a feasible itinerary aligned to TripSpec interests/pace, with alternates per block and travel time estimates; flags any scheduling tension.
- **Non-goals**: Does not fetch attractions (consumes curated list); does not book tickets or compute costs.

## 2) Inputs
- **Required fields**: TripSpec (destinations, dates/date_range or trip_length, pace, interests, mobility, fixed_events, exclusions); attractions list; flags.
- **Optional fields**: ticket timing hints (if available), lodging area hints.
- **Internal state consumed**: orchestrator_state.seed; assumptions from Planner.
- **Feature flags**: enable_google/offline_only only for source labeling passed through.

## 3) Outputs
- **Primary output shape**: itinerary_days[] of ItineraryDay { date/label, blocks[{part, activities[], travel_time_est}], alternatives[], summary, tensions[] } plus assumptions[].
- **Output constraints**: 3 blocks/day; max 2–3 activities per block; include travel_time_est between stops; label sources for activities (mock/google).
- **Downstream dependencies**: Constraint Checker uses tensions/assumptions; Budget Estimator uses activities counts/stay times; Formatter renders itinerary.

## 4) Core Behaviors & Rules
- **Algorithm/heuristics**:
  - Map attractions to days by proximity (use area/neighborhood) and interest fit.
  - Sequence to minimize backtracking; morning start near lodging area if given.
  - Respect pace: relaxed (fewer items), standard, packed (more items, longer days).
  - Insert fixed_events at specified times; adjust surrounding activities/travel times.
  - Include alternates for weather-sensitive or timed items.
  - Add travel_time_est using heuristic distance/time tool; pad for transfers.
- **Edge cases**: Short trips (1–2 days) prioritize top fits; mobility constraints reduce walking density; multi-destination trips divide days proportionally.
- **Fallbacks**: If insufficient attractions, leave slots open with labeled gaps; if no travel-time tool, provide coarse estimates and assumption.
- **Assumptions to label**: Start/end times per day, default lunch/dinner windows, inferred lodging area, coarse travel times if tool absent.

## 5) Tools (if applicable)
- **Tool name & role**: Distance/time estimator (heuristic).
- **Inputs/outputs**: Inputs: origin_point, destination_point (area names); Outputs: minutes estimate, mode guess.
- **Limits**: Fast heuristic; no external calls.
- **Failure handling**: If unavailable, note coarse estimate assumption.
- **Security/sanitization**: N/A (local heuristic).
- **Determinism**: Seeded ordering; consistent area sorting.

## 6) Prompting (System Guidance)
- **System intent**: "Draft a feasible day-by-day itinerary using provided attractions; minimize backtracking; respect pace and fixed events; include travel time estimates and alternates."
- **Content requirements**: 3 blocks/day; 1–3 activities/block; include travel_time_est; add tensions/assumptions when squeezing items.
- **Prohibited behavior**: Do not invent new POIs; do not call external sources; no ticket prices.
- **Clarifying questions policy**: None; proceed with assumptions and label them.

## 7) Determinism & Limits
- **Seeding/sorting**: Sort attractions deterministically by score/area; seed any tie-breaking.
- **Caps**: Max 12 attractions/day including alternates; max 2 alternates per block.
- **Timeouts/retries**: N/A (local logic).

## 8) Errors & Guardrails
- **Validation errors**: Missing TripSpec or attractions list → fail fast.
- **Conflict detection**: Identify overpacked days, tight transitions around fixed events; add to tensions.
- **Safety**: Respect exclusions/mobility; avoid late-night slots if not requested.

## 9) Dependencies & I/O Contracts
- **Inputs required from**: Planner (TripSpec, assumptions), Attraction Curator (attractions with areas/stay times/source), Ticket Finder (optional timing hints), Orchestrator (flags/seed).
- **Outputs provided to**: Constraint Checker (itinerary, tensions), Budget Estimator (activity counts/stay times), Formatter.
- **Schemas referenced**: ItineraryDay, Attraction.

## 10) Observability
- **Log fields**: run_id, session_id, days_count, activities_per_day stats, tensions count, assumptions count.
- **Metrics**: avg travel_time_est per transition, percent days with fixed_events, percent with alternates.
- **Source labeling**: Preserve attraction source labels (mock/google) in activities.

## 11) Sample I/O
- **Sample input**: TripSpec (Tokyo 5 days, pace=standard) + 12 attractions with areas/stay times + one fixed_event (7pm show).
- **Sample output**: itinerary_days for 5 days with blocks, travel_time_est between stops, alternates per block, tensions noting tight pre-show window.
- **Notes**: Show assumed day start/end times if not provided.

## 12) Integration with Markdown Formatter
- **Data handed off**: itinerary_days with blocks/alternates/travel times/tensions/assumptions.
- **Formatting hints**: Formatter should show per-day blocks, travel times inline, and a short tensions/assumptions bullet list per day.

## 13) Open Questions / TODOs
- Define standard day start/end times and meal windows per pace.
- Decide heuristic rules for multi-destination day splits.
- Confirm cap for alternates and handling of weather-sensitive tags.
