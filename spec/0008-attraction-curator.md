# 0008 – Attraction Curator Node Spec

Based on the sub-agent template; filled for the Attraction Curator node.

## 1) Purpose
- **Role**: Select and annotate attractions/food spots relevant to the TripSpec, primarily from mock data, optionally augmenting with fresh items via Google Search when enabled.
- **Success Criteria**: Returns 8–12 high-quality items per destination with categories, areas, stay times, cost levels, rationales, and source labels; includes 3–5 fresh items only when Google is allowed.
- **Non-goals**: Does not schedule activities (Itinerary Builder does) or give prices/tickets; no live bookings.

## 2) Inputs
- **Required fields**: TripSpec (destinations, interests, exclusions, mobility, season/dates, budget band).
- **Optional fields**: user cuisine preferences; neighborhood/lodging hints.
- **Internal state consumed**: orchestrator_state.seed; guardrail flags (enable_google/offline_only).
- **Feature flags**: enable_google (only if offline_only=false).

## 3) Outputs
- **Primary output shape**: attractions[] of Attraction { id, name, category, area, address?, stay_minutes, cost_level, season_tag?, source: mock|google, rationale, tags[] }.
- **Output constraints**: 8–12 total per destination; max 3–5 Google items; each item must include stay_minutes and cost_level; source labeled.
- **Downstream dependencies**: Itinerary Builder uses areas/stay_minutes/tags; Budget Estimator uses stay_minutes/cost_level; Formatter labels sources.

## 4) Core Behaviors & Rules
- **Algorithm/heuristics**:
  - Filter mock catalog by destination, interests, exclusions, mobility; prioritize diverse categories (culture/food/outdoors/nightlife/family).
  - Ensure area coverage (spread across key neighborhoods).
  - Apply season/date filter for relevant events/seasonal picks.
  - If enable_google and not offline_only: run limited Google queries for fresh events/new spots; dedupe against mock; cap to 3–5; clearly label source=google.
  - Score and sort deterministically (interest match, diversity, area spread).
- **Edge cases**: Insufficient mock data → fill fewer items and note gap; if Google disabled/unavailable, proceed with mock-only and record assumption.
- **Fallbacks**: If Google call fails/timeouts, continue with mock list and add issue note.
- **Assumptions to label**: Any inferred cost_level/stay_minutes; mock-only mode; lack of seasonal data.

## 5) Tools (if applicable)
- **Tool name & role**: Mock attraction dataset fetch; optional Google Search tool.
- **Inputs/outputs**:
  - Mock fetch: input destination/filters; output candidate attraction records.
  - Google Search: input sanitized query (destination + interest/season); output top results (title, snippet, url) → mapped to Attraction shape with source=google.
- **Limits**: Google capped to 1–2 queries per destination, 3–5 items returned; mock fetch capped to 20 candidates before filtering.
- **Failure handling**: On Google failure, skip and note; on mock missing fields, drop or flag assumption.
- **Security/sanitization**: Strip PII; sanitize queries (no emails/phones); respect offline_only by skipping Google entirely.
- **Determinism**: Seeded sorting; stable selection for same inputs.

## 6) Prompting (System Guidance)
- **System intent**: "Curate relevant attractions/food spots from mock data; optionally add a few fresh Google-labeled items; include category, area, stay time, cost level, rationale."
- **Content requirements**: 8–12 total; diversify categories; include seasonal picks when relevant; label source; include stay_minutes and cost_level.
- **Prohibited behavior**: Do not invent places; do not output more than caps; no itineraries or timeslots.
- **Clarifying questions policy**: None; proceed and label assumptions.

## 7) Determinism & Limits
- **Seeding/sorting**: Sort by score/area then name for stability; seeded tie-breaks.
- **Caps**: 12 total; max 5 Google; max 3 per single category unless limited data.
- **Timeouts/retries**: Google tool retry once; short timeout.

## 8) Errors & Guardrails
- **Validation errors**: Missing destination → fail; if TripSpec invalid, return error upstream.
- **Conflict detection**: enable_google with offline_only → skip Google, note.
- **Safety**: Sanitize search terms; avoid PII; no URLs in final output unless explicitly allowed (keep minimal).

## 9) Dependencies & I/O Contracts
- **Inputs required from**: Planner (TripSpec), Orchestrator (flags/seed), Guardrail (flags), optional mock datasets.
- **Outputs provided to**: Itinerary Builder, Budget Estimator, Formatter (source labels, rationales).
- **Schemas referenced**: Attraction.

## 10) Observability
- **Log fields**: run_id, session_id, counts (mock vs Google), categories coverage, assumptions count.
- **Metrics**: Google call success rate, timeout rate, average stay_minutes/cost_level presence.
- **Source labeling**: source field persisted; note when Google skipped/failed.

## 11) Sample I/O
- **Sample input**: TripSpec (Tokyo, interests: food+culture, dates April, enable_google=true).
- **Sample output**: 10 attractions (7 mock, 3 google) with categories, areas, stay_minutes, cost_level, rationale, source labels.
- **Notes**: Include a seasonal item (e.g., spring gardens) if dates align.

## 12) Integration with Markdown Formatter
- **Data handed off**: attractions[] with category, area, stay_minutes, cost_level, source, rationale.
- **Formatting hints**: Group by destination; show source badges (mock/google); keep rationale short.

## 13) Open Questions / TODOs
- Define category taxonomy and cost_level bands.
- Confirm seasonal tagging approach.
- Decide on including/excluding URLs in Markdown report.
