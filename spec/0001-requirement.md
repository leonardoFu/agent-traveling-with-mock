# 0001 – Travel Agent Requirement

## Goal
Build a LangGraph-powered travel assistant that uses mocked tools and data by default to plan trips end-to-end: propose itineraries, search/book tickets (mocked), schedule days, and surface attractions and tips. Allow an optional Google Search tool for fresher attraction/context lookups when enabled.

## Scope
- Single agent graph with mocked tool nodes; optional Google Search tool for attractions/recency. Must be capable of running fully offline when Google Search is disabled.
- Focus on trip planning experience (pre-trip). No live notifications or real purchases.
- Supports desktop first; responses via text only.

## Primary Personas
- **Traveler**: Wants a suggested trip plan within budget and time constraints.
- **Planner**: Wants to tweak itinerary details (times, swaps, add/remove activities).

## Functional Requirements
- **Input capture**: Destination(s), dates or date ranges, origin city, budget, traveler count, interests (culture, food, outdoors, nightlife, family), mobility needs, lodging preference, time constraints (arrival/departure windows), exclusions.
- **Itinerary generation**: Draft multi-day plan with day-level schedule blocks (morning/afternoon/evening) and transit time estimates. Provide rationale per day and alternates per block.
- **Ticket finding (mock)**:
  - Mock flight/search: suggest top 3–5 options with carrier, depart/arrive airports/times, duration, layovers, fare class, price estimate, baggage note.
  - Mock train/bus where relevant by region.
  - Highlight best option heuristics (price vs. duration).
- **Scheduling**:
  - Order activities to minimize backtracking; include travel time estimates between stops.
  - Allow constraints: fixed events (e.g., show at 7pm), early/late arrivals.
  - Generate day-level summaries and per-activity timing.
- **Attractions lookup (mock + Google option)**:
  - Default to curated local dataset; when Google Search is enabled, augment with top 3–5 fresh findings (news/events/new spots) and label their source.
  - Curate 8–12 attractions/food spots per destination with category, why it matters, address/area, typical stay time, cost level.
  - Include seasonal/contextual picks (e.g., winter markets, cherry blossoms); prefer Google hits for current events if available.
- **Lodging suggestions (mock)**: 3–5 areas/hotels with vibe, price band, proximity to transit/attractions.
- **Budgeting**: Rough per-day and total budget with cost drivers (lodging, transit, tickets, meals, activities).
- **Constraints handling**: Call out conflicts (over-budget, time clashes) and propose fixes.
- **Safety & etiquette tips (mock)**: Local etiquette, tipping norms, safety hotspots, transit basics.
- **Exports**: Return structured JSON alongside human-readable text for UI rendering (itinerary, tickets, attractions, budget).

## Agent/Graph Requirements
- LangGraph nodes: planner (captures intent), itinerary builder, ticket search (mock), attraction curator (mock + optional Google Search tool), budget estimator, constraint checker, formatter.
- Deterministic stepping: ensure idempotent outputs for same inputs (seeded randomness if needed).
- Tool interfaces should be typed and easily swappable for real APIs later; Google Search tool behind a feature flag.
- Provide guardrails: max trip length, max options returned, input validation with helpful errors; rate-limit and sanitize Google queries.

## Mock Data & Tools
- Local static datasets for airports, rail hubs, attractions, neighborhoods, sample flights/buses, typical costs.
- Optional Google Search tool used only for attractions/context freshness; must gracefully fall back to mock data when unavailable.
- Helper utilities: distance/time estimator (heuristic), seasonal event lookup table, budget calculator.
- Offline capability required when Google Search is disabled.

## Non-Functional
- Fast responses (<2s on mocked data).
- Clear, concise language; avoid hallucinated specifics not in mock data (label assumptions).
- Traceability: include which mock source was used for each suggestion.
- Configurable regional defaults (currency, time format).

## Edge Cases
- Overnight flights with time zone shifts.
- Multicity trips and open-jaw returns.
- Shoulder-season/weather constraints.
- Mobility constraints affecting activity choices.
- Very short layovers/connection risks flagged.

## Out of Scope (for now)
- Real bookings/payments.
- Loyalty program optimization.
- Group collaboration features.
- Live weather/alerts.

## Deliverables
- Functional specification of agent graph and tool contracts.
- Mock data schemas and sample datasets.
- Example request/response pairs (text + JSON) for common scenarios.
