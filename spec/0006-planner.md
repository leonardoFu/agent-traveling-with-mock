# 0006 – Planner / Intent Understanding Node Spec

Based on the sub-agent template; filled for the Planner node.

## 1) Purpose
- **Role**: Extract and normalize trip intent into a canonical TripSpec (origin, destinations, dates/range, trip length, travelers, budget, preferences, constraints) for downstream nodes.
- **Success Criteria**: Outputs a complete, normalized TripSpec where possible; when data is ambiguous, records assumptions explicitly; does not overstep into itinerary/ticket generation.
- **Non-goals**: No itinerary creation, ticket search, budget math, or formatting.

## 2) Inputs
- **Required fields**: user_message; guardrail_result.status must be "pass".
- **Optional fields**: prior clarified fields; interests, mobility needs, exclusions, lodging_prefs, fixed_events, pace preference.
- **Internal state consumed**: guardrail_result.validated_fields; orchestrator_state.flags/seed; session context if available.
- **Feature flags**: enable_google; offline_only (passed through untouched).

## 3) Outputs
- **Primary output shape**: TripSpec { origin, destinations[], dates or date_range, trip_length, traveler_count, budget {amount,currency}, interests[], mobility, exclusions[], lodging_prefs, fixed_events[], pace, flags } plus assumptions[].
- **Output constraints**: Dates in ISO; destinations as array of canonical names; budgets with currency; traveler_count ≥1.
- **Downstream dependencies**: Itinerary Builder, Attraction Curator, Ticket Finder, Budget Estimator consume TripSpec; Constraint Checker uses assumptions/flags.

## 4) Core Behaviors & Rules
- **Algorithm/heuristics**:
  - Normalize destinations into array; prefer city-level names; keep unresolved ambiguity flagged in assumptions.
  - Normalize dates: if exact dates known, set start/end; else set date_range or season tag; compute trip_length when possible.
  - Normalize budget: number + currency; if missing currency, infer from origin or default locale and add assumption.
  - Normalize interests (tags), mobility (e.g., “limited walking”), exclusions (e.g., “no museums”), lodging_prefs (area/vibe/budget band).
  - Carry fixed_events with time/location; mark time zone if known.
  - Set pace (e.g., relaxed/standard/packed) if user hints at speed; default to standard and note assumption.
- **Edge cases**: Missing origin—note and proceed; multiple destinations—preserve order given; date ambiguity—store as season and add assumption; impossible dates from Guardrail should not reach here.
- **Fallbacks**: If traveler_count missing, default to 1 with assumption; if budget missing, leave null and add assumption.
- **Assumptions to label**: currency defaults, pace default, inferred trip_length from date_range, inferred airport/city when ambiguous.

## 5) Tools (if applicable)
- None; pure parsing/normalization.

## 6) Prompting (System Guidance)
- **System intent**: "Parse and normalize trip intent into TripSpec; make minimal, explicit assumptions; no itinerary/ticket generation."
- **Content requirements**: Fill TripSpec fields systematically; add assumptions array for any inference; keep tone concise.
- **Prohibited behavior**: Do not suggest activities/tickets; do not call external tools; do not overwrite validated guardrail flags.
- **Clarifying questions policy**: None here—Guardrail already asked; if critical blockers remain, return them in assumptions for downstream visibility instead of asking again.

## 7) Determinism & Limits
- **Seeding/sorting**: Stable ordering for destinations/interests; deterministic inference (no randomness).
- **Caps**: Limit interests/exclusions lists to a reasonable size (e.g., 10 each).
- **Timeouts/retries**: N/A.

## 8) Errors & Guardrails
- **Validation errors**: If guardrail_result.status ≠ "pass", return error to Orchestrator (should not run).
- **Conflict detection**: Highlight conflicts passed from guardrail (e.g., offline_only); add to assumptions but do not block.
- **Safety**: No PII propagation; trim user_message to relevant fields before logging.

## 9) Dependencies & I/O Contracts
- **Inputs required from**: Guardrail (validated_fields, flags), Orchestrator (seed/run metadata).
- **Outputs provided to**: Itinerary Builder, Attraction Curator, Ticket Finder, Budget Estimator, Constraint Checker, Formatter (assumptions).
- **Schemas referenced**: TripSpec, ItineraryDay (needs trip_length), Attraction, TicketOption, Budget.

## 10) Observability
- **Log fields**: run_id, session_id, destinations, dates/date_range, budget presence, traveler_count, assumptions count (redact PII).
- **Metrics**: percentage of runs with explicit trip_length, with budget, with pace; assumption frequency.
- **Source labeling**: Note when defaults inferred vs. provided.

## 11) Sample I/O
- **Sample input**:
  ```json
  {
    "guardrail_result": {
      "status": "pass",
      "validated_fields": {
        "destinations": ["Tokyo"],
        "date_range": { "start": "2024-04-10", "end": "2024-04-15" },
        "origin": "New York City",
        "budget": { "amount": 2000 }
      },
      "flags": { "enable_google": true, "offline_only": false }
    }
  }
  ```
- **Sample output**:
  ```json
  {
    "trip_spec": {
      "origin": "New York City",
      "destinations": ["Tokyo"],
      "date_range": { "start": "2024-04-10", "end": "2024-04-15" },
      "trip_length": 5,
      "traveler_count": 1,
      "budget": { "amount": 2000, "currency": "USD" },
      "interests": [],
      "mobility": null,
      "exclusions": [],
      "lodging_prefs": null,
      "fixed_events": [],
      "pace": "standard",
      "flags": { "enable_google": true, "offline_only": false }
    },
    "assumptions": [
      "Added default currency USD based on origin",
      "Defaulted traveler_count to 1",
      "Defaulted pace to standard"
    ]
  }
  ```
- **Notes**: Ambiguous destinations should be echoed with an assumption rather than guessed.

## 12) Integration with Markdown Formatter
- **Data handed off**: TripSpec and assumptions for the “Trip Snapshot” and “Flags/Assumptions” sections; counts and defaults can inform concise summaries.
- **Formatting hints**: Keep assumptions succinct; avoid duplicating detail that downstream sections (tickets/itinerary) will cover.

## 13) Open Questions / TODOs
- Decide standard pace options and defaults.
- Define canonical city/airport mappings (how much disambiguation here vs. later).
- Confirm currency inference precedence (origin vs. locale).
