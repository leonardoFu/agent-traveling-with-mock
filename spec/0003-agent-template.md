# 0003 – Sub-Agent Spec Template

Use this template for each LangGraph node. Replace bracketed placeholders with concrete details per agent.

## 1) Purpose
- **Role**: `[What this node is responsible for]`
- **Success Criteria**: `[What good output looks like]`
- **Non-goals**: `[Explicitly list what this node must not do]`

## 2) Inputs
- **Required fields**: `[List + types + validation rules]`
- **Optional fields**: `[List + defaults/assumptions]`
- **Internal state consumed**: `[Prior node outputs/state keys]`
- **Feature flags**: `[Flags that alter behavior, e.g., enable_google]`

## 3) Outputs
- **Primary output shape**: `[Structured fields returned to graph]`
- **Output constraints**: `[Caps, sorting rules, required labels]`
- **Downstream dependencies**: `[Which nodes consume which fields]`

## 4) Core Behaviors & Rules
- **Algorithm/heuristics**: `[Ordering, scoring, selection rules]`
- **Edge cases**: `[How to handle missing/ambiguous/conflicting inputs]`
- **Fallbacks**: `[What to do when external/optional tools fail]`
- **Assumptions to label**: `[What must be called out to downstream users]`

## 5) Tools (if applicable)
- **Tool name & role**: `[e.g., mock flight search, distance estimator, Google Search]`
- **Inputs/outputs**: `[Parameters, expected schema, units]`
- **Limits**: `[Rate limits, max results, timeouts]`
- **Failure handling**: `[Retry rules, fallbacks to mock/local data]`
- **Security/sanitization**: `[PII stripping, query cleaning before external calls]`
- **Determinism**: `[Seeded/random behavior constraints]`

## 6) Prompting (System Guidance)
- **System intent**: `[Single-sentence objective/guardrails]`
- **Content requirements**: `[Granular instructions for completeness/format]`
- **Prohibited behavior**: `[What to avoid: hallucinations, extra questions, etc.]`
- **Clarifying questions policy**: `[When/how to ask vs. proceed with assumptions]`

## 7) Determinism & Limits
- **Seeding/sorting**: `[How to make output repeatable]`
- **Caps**: `[Max items/options to emit]`
- **Timeouts/retries**: `[If applicable for tool calls]`

## 8) Errors & Guardrails
- **Validation errors**: `[What to reject and how to surface]`
- **Conflict detection**: `[Rules to flag conflicts]`
- **Safety**: `[Sanitization, PII handling, rate limits for external calls]`

## 9) Dependencies & I/O Contracts
- **Inputs required from**: `[Upstream nodes + fields]`
- **Outputs provided to**: `[Downstream nodes + fields]`
- **Schemas referenced**: `[Link to shared data contracts]`

## 10) Observability
- **Log fields**: `[Minimal set, redact PII]`
- **Metrics**: `[Counts, latencies, errors]`
- **Source labeling**: `[How to tag mock vs. external results]`

## 11) Sample I/O
- **Sample input**:
  ```json
  `[Representative input payload]`
  ```
- **Sample output**:
  ```json
  `[Representative output payload]`
  ```
- **Notes**: `[Any interpretation notes or common pitfalls]`

## 12) Integration with Markdown Formatter
- **Data handed off**: `[Fields the Formatter will render]`
- **Formatting hints**: `[Section placement, labels, ordering]`

## 13) Open Questions / TODOs
- `[List decisions pending for this node]`
