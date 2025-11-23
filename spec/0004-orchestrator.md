# 0004 – Orchestrator Node Spec

Use the standard sub-agent template; filled for the Orchestrator.

## 1) Purpose
- **Role**: Top-level LangGraph controller that sequences node execution, sets feature flags, seeds determinism, and maintains run state.
- **Success Criteria**: Downstream nodes receive required inputs/flags in correct order; retries/backoffs applied; flow finishes or exits with clear errors.
- **Non-goals**: No business logic for planning, tickets, budget, or formatting; does not invent travel content.

## 2) Inputs
- **Required fields**: user_message (string); session_id (string); now (timestamp).
- **Optional fields**: locale/currency defaults; prior_trip_state; user_prefs; enable_google (bool); offline_only (bool) override.
- **Internal state consumed**: previous node outputs if resuming a run; retry metadata.
- **Feature flags**: enable_google; offline_only; debug_logging.

## 3) Outputs
- **Primary output shape**: orchestrator_state { run_id, session_id, flags, seed, step_pointer, retries, errors? }.
- **Output constraints**: Stable seed; flags explicit; step ordering canonical.
- **Downstream dependencies**: Guardrail consumes flags and user_message; all nodes consume orchestrator_state for seed/flags; Formatter consumes errors if early exit.

## 4) Core Behaviors & Rules
- **Algorithm/heuristics**: Determine execution path: Guardrail → Planner → Attraction Curator → Itinerary Builder → Ticket Finder → Budget Estimator → Constraint Checker → Formatter. Short-circuit on unrecoverable validation errors; do not allow cross-calls between nodes (e.g., Itinerary Builder consumes curated attractions, does not invoke curation).
- **Edge cases**: Missing critical inputs triggers Guardrail prompt path; if feature flags conflict (enable_google + offline_only), enforce offline_only.
- **Fallbacks**: If a node fails after retries, surface error summary to Formatter for graceful Markdown error report.
- **Assumptions to label**: Which flags were applied; whether run resumed or fresh; any forced offline mode.

## 5) Tools (if applicable)
- **Tool name & role**: None; orchestrates other nodes but does not call external tools directly.
- **Inputs/outputs**: N/A.
- **Limits**: N/A.
- **Failure handling**: N/A.
- **Security/sanitization**: N/A (delegated to Guardrail and caller).
- **Determinism**: Generates and propagates seed; enforces sorted execution order.

## 6) Prompting (System Guidance)
- **System intent**: "Coordinate node execution in order, propagate flags/seed, and ensure deterministic, resumable flow."
- **Content requirements**: Always include flags and seed in state; record step transitions and retries.
- **Prohibited behavior**: Do not generate travel content; do not bypass Guardrail; do not alter user inputs.
- **Clarifying questions policy**: None directly; delegates to Guardrail/Planner to ask if needed.

## 7) Determinism & Limits
- **Seeding/sorting**: Generate run seed once per run_id; maintain canonical node order.
- **Caps**: Max retries per node (e.g., 2); prevent infinite loops.
- **Timeouts/retries**: Per-node timeout policy; exponential backoff on retry.

## 8) Errors & Guardrails
- **Validation errors**: If required fields (user_message, session_id) missing, return setup error.
- **Conflict detection**: If flags conflict (offline_only + enable_google), set offline_only=true and note override.
- **Safety**: Ensure external-call nodes only run when flags allow (e.g., block Google when offline_only).

## 9) Dependencies & I/O Contracts
- **Inputs required from**: Caller (user_message, session_id, defaults).
- **Outputs provided to**: Guardrail and subsequent nodes (orchestrator_state with flags/seed/step_pointer).
- **Schemas referenced**: TripSpec, Attraction, TicketOption, ItineraryDay, Budget; Markdown report contract (for error surfacing).

## 10) Observability
- **Log fields**: run_id, session_id, seed, flags, step transitions, retries, node statuses (redact PII in payloads).
- **Metrics**: per-node latency, retries, failure counts.
- **Source labeling**: N/A (for data content); tag when offline-only enforced.

## 11) Sample I/O
- **Sample input**:
  ```json
  {
    "user_message": "Plan a 5-day Tokyo trip in April under $2000",
    "session_id": "sess-123",
    "now": "2024-02-10T12:00:00Z",
    "flags": { "enable_google": true, "offline_only": false }
  }
  ```
- **Sample output**:
  ```json
  {
    "orchestrator_state": {
      "run_id": "run-abc",
      "session_id": "sess-123",
      "seed": 424242,
      "flags": { "enable_google": true, "offline_only": false },
      "step_pointer": "guardrail",
      "retries": {}
    }
  }
  ```
- **Notes**: On resume, include last completed step and any errors for retry routing.

## 12) Integration with Markdown Formatter
- **Data handed off**: Errors/early exits are passed so Formatter can render a Markdown error/needs-info section.
- **Formatting hints**: If flow aborts, include a concise “Run status” snippet with flags used and which step failed.

## 13) Open Questions / TODOs
- Confirm retry/backoff policy per node.
- Decide maximum consecutive resume attempts and expiration of run state.
- Define shared error codes for Formatter.
