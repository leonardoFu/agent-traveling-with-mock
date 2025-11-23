# 0005 – Guardrail / Constraint Node Spec

Based on the sub-agent template; filled for input validation and constraint enforcement.

## 1) Purpose
- **Role**: Validate and normalize incoming user/context data, enforce hard limits, sanitize external-facing inputs, and decide whether to proceed or request missing critical info.
- **Success Criteria**: Blocks incomplete/invalid requests with specific asks; passes a validated TripSpec seed downstream; respects offline-only and feature-flag constraints.
- **Non-goals**: Does not generate itineraries, tickets, or attractions; does not format the final Markdown output.

## 2) Inputs
- **Required fields**: user_message (string); session_id (string); now (timestamp).
- **Optional fields**: origin, destination(s), dates/date_range, trip_length, traveler_count, budget, interests, mobility, exclusions, fixed_events, lodging_prefs, enable_google (bool), offline_only (bool).
- **Internal state consumed**: orchestrator_state (flags, seed); prior clarified fields when resuming.
- **Feature flags**: enable_google; offline_only.

## 3) Outputs
- **Primary output shape**: guardrail_result { status: "pass"|"needs_info"|"fail", validated_fields (partial TripSpec seed), flags, issues[], clarifying_questions?[] }.
- **Output constraints**: Issues and questions must be specific and minimal; flags resolved (offline_only overrides enable_google).
- **Downstream dependencies**: Planner consumes validated_fields and flags; Orchestrator uses status to route; Formatter uses issues/questions if needs_info/fail.

## 4) Core Behaviors & Rules
- **Algorithm/heuristics**:
  - Validate essentials: destination(s), dates/date_range, trip_length, origin (for tickets), budget (if budgeting enabled), traveler_count ≥1.
  - Enforce limits: max trip length (e.g., 30 days), max destinations (e.g., 3), date sanity (start < end, not in distant past beyond tolerance).
  - Resolve flags: if offline_only=true, force enable_google=false.
  - Normalize fields to canonical shapes (arrays for destinations, ISO dates, numeric budgets).
- **Edge cases**: Timezones/day boundaries; open-ended date ranges—accept but mark as assumption; unclear destination names—ask for clarification.
- **Fallbacks**: If optional Google is unavailable (offline_only or sandbox), proceed with mock-only and record a note in issues.
- **Assumptions to label**: Default currency/locale; inferred season from dates; inferred airport if city has multiple (if enacted downstream).

## 5) Tools (if applicable)
- None; validation only.

## 6) Prompting (System Guidance)
- **System intent**: "Validate and normalize trip inputs; enforce limits; decide pass vs. needs_info vs. fail; keep requests minimal and specific."
- **Content requirements**: Return validated fields and a short issues list; only ask for missing critical fields; no travel suggestions.
- **Prohibited behavior**: Do not fabricate values; do not provide itineraries/tickets; do not bypass offline_only.
- **Clarifying questions policy**: Ask only for blockers (e.g., missing destination/dates); bundle questions when possible; avoid multiple back-and-forths.

## 7) Determinism & Limits
- **Seeding/sorting**: Stable ordering of issues/questions for repeatability.
- **Caps**: Max 3 clarifying questions; cap issues list to top 5.
- **Timeouts/retries**: N/A; pure validation.

## 8) Errors & Guardrails
- **Validation errors**: Missing destination/dates; invalid date formats; budget ≤0 when provided; traveler_count <1; trip length > max.
- **Conflict detection**: enable_google + offline_only → force offline; date ranges conflicting with fixed events.
- **Safety**: Strip PII from any messages passed downstream; sanitize any potential external query strings (even though Guardrail doesn’t call them) by removing emails/phones.

## 9) Dependencies & I/O Contracts
- **Inputs required from**: Orchestrator (flags, seed, user_message, session_id, now).
- **Outputs provided to**: Planner (validated_fields, flags), Orchestrator (status routing), Formatter (issues/questions on needs_info/fail).
- **Schemas referenced**: TripSpec (partial seed), Markdown report contract for error/needs-info section.

## 10) Observability
- **Log fields**: run_id, session_id, status, issues count, questions count, flags applied; redact PII.
- **Metrics**: pass rate, needs_info rate, validation failure reasons, per-field error counts.
- **Source labeling**: Note when offline_only overridden enable_google.

## 11) Sample I/O
- **Sample input**:
  ```json
  {
    "orchestrator_state": { "run_id": "run-abc", "flags": { "enable_google": true, "offline_only": true } },
    "user_message": "Plan 5 days in Tokyo in April under $2000. I'm in NYC.",
    "now": "2024-02-10T12:00:00Z"
  }
  ```
- **Sample output**:
  ```json
  {
    "guardrail_result": {
      "status": "pass",
      "validated_fields": {
        "destinations": ["Tokyo"],
        "date_range": { "start": "2024-04-10", "end": "2024-04-15" },
        "origin": "New York City",
        "budget": { "amount": 2000, "currency": "USD" }
      },
      "flags": { "enable_google": false, "offline_only": true },
      "issues": ["Google disabled because offline_only=true"]
    }
  }
  ```
- **Notes**: For missing destination, output status=needs_info with a single clear question.

## 12) Integration with Markdown Formatter
- **Data handed off**: issues/questions list for “Flags/Conflicts” or “Needs Info” section; note forced offline mode.
- **Formatting hints**: Keep issue text concise; one bullet per issue/question.

## 13) Open Questions / TODOs
- Finalize maximum trip length/destination caps.
- Decide tolerance for past-dated trips (e.g., historical planning).
- Confirm default currency/locale inference rules.
