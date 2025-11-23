# 0016 – Faker-based Mock Generation

Spec for replacing static mocks with faker.js while preserving determinism, offline defaults, and schema contracts.

## Library & Version
- Package: `@faker-js/faker` (JS/TS) — docs: https://fakerjs.dev/api/ (v9 stable).
- Import style: `import { faker } from "@faker-js/faker";`
- Locale: default `en`; allow override via optional flag if needed later.

## Determinism / Seeding
- Use a single seed per run (from orchestrator/guardrail) and feed into faker: `faker.seed(seedNumber);`.
- Derive `seedNumber` from string seeds via existing `hashSeed` helper for stability.
- Avoid global mutable faker state in concurrent calls: use `faker.engine` with `faker.setDefaultRefDate` if date-based outputs are needed; prefer pure functions that call `faker` immediately after seeding.
- Tests must assert identical outputs for the same seed/input.

## Targeted Usage by Domain
- **Attractions (replaces static catalog fallback)**:
  - `faker.location.nearbyGPSCoordinate` for area hints (if needed), `faker.company.catchPhraseAdjective`/`noun` for taglines, `faker.commerce.department` for category flavor.
  - Names: `faker.location.streetName()` + suffix or `faker.company.name()`.
  - Rationale: short `faker.hacker.phrase()` or `faker.commerce.productDescription()` snippets, truncated and sanitized.
  - Cost level: derive from `faker.number.int({ min: 0, max: 3 })` → map to `budget|moderate|premium|luxury`.
  - Stay minutes: `faker.number.int({ min: 45, max: 150 })`.
  - Respect caps (8–12) and categories/tags per spec; seed before generation.
- **Tickets**:
  - Carrier names: `faker.airline.airline()` (fallback: `faker.company.name()`).
  - Times: use fixed base date + `faker.date.soon({ days: 2, refDate })` for depart, add deterministic durations; keep ISO string output.
  - Prices: `faker.commerce.price({ min: 80, max: 900, dec: 0 })` → number.
  - Preserve mode selection heuristic (distance-driven) from existing tools; faker only fills carrier/price jitter.
- **Costs**:
  - Generate bands with bounded ranges per destination: `faker.number.int({ min: X, max: Y })` for lodging/meal/activity/transit, keeping currency `USD` unless configured.

## Safety & Constraints
- Sanitize generated text: strip newlines and limit length (e.g., 120 chars for rationale).
- Do not generate URLs/emails/PII; avoid `internet.*` in attraction/ticket descriptions.
- Respect offline-only: faker generation is local-only; Google augmentation remains gated separately.

## Testing Hooks
- Add fixtures that call faker-backed generators twice with the same seed and expect identical outputs (ids, names, costs).
- Bounds checks: stay_minutes within 45–150; price ranges per mode; cost bands within configured ranges.
- Keep `pnpm test:data` covering determinism and gating.

## API Snippets (from Faker)
```ts
import { faker } from "@faker-js/faker";

faker.seed(12345);
const name = faker.company.name();
const rationale = faker.hacker.phrase();
const price = faker.commerce.price({ min: 80, max: 900, dec: 0 });
```

## Migration Plan
1) Add dependency `@faker-js/faker` to package.json (prod dep; used runtime in tools).
2) Wrap faker seeding via existing `hashSeed(seed)` and `faker.seed(hash)`.
3) Replace static generators in current tools:
   - `agent/tools/attractions.ts`: swap `attractionsCatalog` usage for faker-backed generation that still honors destination filters/interests/exclusions. Keep Google gating and caps (8–12 total, 3–5 google). Generate names/rationales/cost/stay via faker with deterministic seed.
   - `agent/tools/tickets.ts`: keep distance/mode heuristic but replace carrier, price jitter, and timings with faker-driven values (bounded). Preserve `best_pick` marking and deterministic ordering.
   - `agent/tools/costs.ts`: generate cost bands per destination with faker numbers inside defined bounds; maintain `resolveCostBand` fallback contract.
4) Update datasets to either (a) act as defaults when faker is disabled, or (b) remove heavy static catalogs if faker fully replaces them; keep lightweight seed data if helpful for tests.
5) Update tests (`tests/data/*.test.ts`) to assert faker determinism, bounds, and offline-only/Google branching; keep `pnpm test:data` as the target.
