# 0002 – Travel Agent Architecture & Prompts

## High-Level Architecture
Text-first LangGraph agent with modular tool nodes and clear data contracts. Mocked tools by default; optional Google Search for fresh attractions/events if enabled. Output is a human-friendly Markdown report (no JSON returned to caller).

```
User Input
   |
   v
+-------------------+
| Orchestrator      |  Captures context, routes turns, manages state
+-------------------+
   |           |
   |           v
   |   +-----------------+
   |   | Constraint/      |  Validate inputs, guardrails, feature flags
   |   | Guardrail Node   |
   |   +-----------------+
   v
+-------------------+
| Planner / Intent  |  Normalize goals, dates, budget, preferences
| Understanding     |
+-------------------+
   |
   v
+-------------------+       +-------------------+
| Attraction Curator| ----> | Itinerary Builder |  Build day plan using curated attractions
+-------------------+       +-------------------+
  (uses mock datasets;        |                      
   labels sources)            |
           ^                  v
           |         +-------------------+
           |         | Ticket Finder     |  Mock flight/train/bus options
           |         +-------------------+
   |
   v
+-------------------+
| Budget Estimator  |  Cost rollups, per-day budgets
+-------------------+
   |
   v
+-------------------+
| Constraint Checker|  Detect conflicts (time/budget), suggest fixes
+-------------------+
   |
   v
+-------------------+
| Formatter         |  Markdown report output
+-------------------+
   |
   v
User Response
```

## Sub-Agents / Nodes
- **Orchestrator**: Manages graph execution order, retries, feature flags (Google Search), seed for determinism.
- **Constraint/Guardrail Node**: Validates inputs (dates, lengths, budget sanity); enforces limits (max options, max days); sanitizes Google queries; decides offline-only when required.
- **Planner / Intent Understanding**: Extracts/normalizes trip metadata (origin, destination(s), dates, travelers, interests, mobility needs, exclusions, budget).
- **Attraction Curator**: Pulls 8–12 attractions/food spots from mock datasets; optionally augments 3–5 fresh items via Google Search (labeled); tags categories, stay times, cost level, areas.
- **Itinerary Builder**: Drafts day-by-day plans with morning/afternoon/evening blocks; orders stops to minimize backtracking; integrates fixed events using curated attractions.
- **Ticket Finder**: Mock flight/train/bus/vs options (3–5); includes times, duration, layovers, fare class, baggage note, simple best-option heuristic.
- **Budget Estimator**: Computes rough totals (lodging, transit, tickets, meals, activities); per-day breakdown; flags overruns.
- **Constraint Checker**: Runs feasibility pass (time clashes, too-tight connections, mobility constraints, budget issues); proposes adjustments.
- **Formatter**: Produces a concise Markdown report with sections (Trip Snapshot, Tickets, Itinerary, Attractions, Budget, Flags/Assumptions).

## Data Flow (Happy Path)
1) Orchestrator ingests input, sets flags.  
2) Guardrail validates inputs/flags.  
3) Planner canonicalizes request into TripSpec.  
4) Attraction Curator fetches mock attractions (+optional Google).  
5) Itinerary Builder drafts day plan using TripSpec and curated attractions.  
6) Ticket Finder proposes transport options.  
7) Budget Estimator rolls up costs.  
8) Constraint Checker adjusts or flags issues.  
9) Formatter emits the Markdown report.

## Key Data Contracts (sketch)
- **TripSpec**: origin, destinations[], dates/ranges, travelers, budget, interests[], mobility, lodging prefs, exclusions, fixed events, flags (offline_only, enable_google).
- **Attraction**: id, name, category, area, address, stay_minutes, cost_level, season_tag?, source (mock|google), rationale.
- **TicketOption**: mode, carrier, depart/arrive airports/stations, times, duration, layovers, fare_class, price_est, baggage, notes, score.
- **ItineraryDay**: date/label, blocks[{part, activities, travel_time_est}], alternatives[], summary.
- **Budget**: total, per_day[], breakdown{lodging, transit, tickets, meals, activities}, over_budget?, notes.
- **MarkdownReport** (rendered output): sections for Trip Snapshot (inputs/assumptions), Tickets (top options + pick), Itinerary (day blocks), Attractions (mock vs. Google labeled), Budget, Flags/Conflicts, Notes.

## Prompting (per node, concise system intents)
- **Orchestrator**: "Route to nodes in order; respect feature flags; keep outputs deterministic; never invent data not provided."
- **Guardrail**: "Validate inputs; enforce limits; if missing critical fields, request them; sanitize external queries."
- **Planner**: "Extract and normalize trip parameters; fill TripSpec; avoid assumptions; ask clarifying questions only if critical."
- **Itinerary Builder**: "Create day plan with time blocks; minimize backtracking; include travel time estimates; propose alternates per block."
- **Attraction Curator**: "Return curated attractions and food spots from mock data; if Google enabled, add 3–5 fresh labeled items; include category, area, stay time, cost level, rationale."
- **Ticket Finder**: "Suggest 3–5 transport options (flight/train/bus) with times, duration, layovers, fare class, baggage note, price estimate; pick a best-option heuristic."
- **Budget Estimator**: "Compute rough totals and per-day breakdowns; flag overruns; base on provided costs or defaults."
- **Constraint Checker**: "Detect time/budget conflicts and mobility issues; propose minimal adjustments; keep constraints explicit."
- **Formatter**: "Produce a concise Markdown report with consistent sections; label assumptions; cite source of each attraction (mock/google); avoid JSON."

## Operational Notes
- Determinism: seed any randomness; prefer sorting for repeatable outputs.
- Offline-first: all flows run without Google; if Google enabled but fails, continue with mock data and note it.
- Rate limits: cap Google queries (e.g., 1–2 per destination turn); sanitize to avoid PII leakage.
- Observability: log node inputs/outputs (redact PII), source labels, and decision flags.
