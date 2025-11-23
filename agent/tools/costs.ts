import { faker } from "@faker-js/faker";
import { CostBand } from "@/agent/types";
import { hashSeed } from "@/agent/utils/random";

function seededFaker(seed: string | number) {
  faker.seed(hashSeed(seed));
  return faker;
}

const knownDestinations = new Set([
  "Tokyo",
  "Paris",
  "New York",
  "Boston",
  "Singapore",
  "Los Angeles",
  "San Francisco",
  "London",
  "Osaka",
]);

function generateCostBand(destination: string): CostBand {
  const fk = seededFaker(`cost-${destination}`);
  const lodging = fk.number.int({ min: 140, max: 280 });
  const meal = fk.number.int({ min: 40, max: 85 });
  const activity = fk.number.int({ min: 30, max: 70 });
  const transit = fk.number.int({ min: 12, max: 25 });
  return {
    destination,
    lodging_per_night: lodging,
    meal_per_day: meal,
    activity_per_day: activity,
    transit_per_day: transit,
    currency: "USD",
  };
}

export function lookupCostBand(destination: string): CostBand | undefined {
  if (!destination.trim()) return undefined;
  return generateCostBand(destination);
}

export function resolveCostBand(destination: string, fallback: string = "New York"): CostBand {
  if (!knownDestinations.has(destination)) {
    return generateCostBand(fallback);
  }
  return lookupCostBand(destination) ?? generateCostBand(fallback);
}
