import { faker } from "@faker-js/faker";
import { makeRng, hashSeed } from "@/agent/utils/random";
import { Attraction, AttractionRequest } from "@/agent/types";
import { getGoogleAttractions } from "./google";

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function seededFaker(seed: string | number) {
  faker.seed(hashSeed(seed));
  return faker;
}

const fallbackCategories = [
  "food",
  "culture",
  "outdoors",
  "nightlife",
  "art",
  "family",
  "viewpoint",
  "seasonal",
];

function matchesInterests(attraction: Attraction, interests: string[]): boolean {
  const interestSet = new Set(interests.map(normalize));
  return (
    interestSet.size === 0 ||
    attraction.category && interestSet.has(normalize(attraction.category)) ||
    (attraction.tags ?? []).some((tag) => interestSet.has(normalize(tag)))
  );
}

function matchesSeason(attraction: Attraction, seasonTag?: string) {
  if (!seasonTag) return true;
  return !attraction.season_tag || normalize(attraction.season_tag) === normalize(seasonTag);
}

function passesExclusions(attraction: Attraction, exclusions: string[]) {
  const exclusionSet = new Set(exclusions.map(normalize));
  if (exclusionSet.size === 0) return true;
  if (exclusionSet.has(normalize(attraction.category))) return false;
  return !(attraction.tags ?? []).some((tag) => exclusionSet.has(normalize(tag)));
}

function scoreAttraction(attraction: Attraction, interests: string[], seasonTag?: string) {
  let score = 1;
  const interestSet = new Set(interests.map(normalize));
  if (interestSet.has(normalize(attraction.category))) score += 2;
  if ((attraction.tags ?? []).some((tag) => interestSet.has(normalize(tag)))) score += 1;
  if (seasonTag && attraction.season_tag && normalize(attraction.season_tag) === normalize(seasonTag)) score += 1;
  // Encourage diversity by lightly rewarding unique areas/categories later via sorting
  return score;
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function generateMockAttractions(request: AttractionRequest): Attraction[] {
  const {
    destination,
    interests = [],
    exclusions = [],
    season_tag,
    seed = destination || "attractions",
    max_results = 12,
  } = request;

  const fk = seededFaker(`attractions-${seed}-${destination}`);
  const categoryPool = interests.length ? interests.map(normalize) : fallbackCategories;
  const targetCount = Math.max(12, max_results + 3);
  const generated: Attraction[] = [];

  for (let i = 0; i < targetCount * 2; i += 1) {
    const category = fk.helpers.arrayElement(categoryPool);
    const costLevels: Attraction["cost_level"][] = ["budget", "moderate", "premium", "luxury"];
    const cost_level = fk.helpers.arrayElement(costLevels);
    const stay_minutes = fk.number.int({ min: 60, max: 140 });
    const area = fk.location.city();
    const name = `${fk.company.name()} ${category}`;
    const rationale = fk.hacker.phrase().slice(0, 120);
    const season = season_tag && i % 3 === 0 ? season_tag : undefined;
    const tags = Array.from(new Set([category, fk.commerce.department().toLowerCase()]));

    const attraction: Attraction = {
      id: `mock-${slugify(destination)}-${slugify(name)}-${i}`,
      destination,
      name,
      category,
      area,
      stay_minutes,
      cost_level,
      rationale,
      source: "mock",
      tags,
      season_tag: season,
    };

    if (!passesExclusions(attraction, exclusions)) continue;
    generated.push(attraction);
    if (generated.length >= targetCount * 2) break;
  }

  return generated;
}

export async function selectAttractions(request: AttractionRequest): Promise<Attraction[]> {
  const {
    destination,
    interests = [],
    exclusions = [],
    season_tag,
    enable_google = false,
    offline_only = true,
    max_results = 12,
    seed = destination || "attractions",
  } = request;

  const rng = makeRng(seed);
  const generated = generateMockAttractions(request);
  const filtered = generated
    .filter((item) => matchesInterests(item, interests))
    .filter((item) => matchesSeason(item, season_tag))
    .filter((item) => passesExclusions(item, exclusions));

  const scoredPrimary = filtered.map((item) => ({
    item,
    score: scoreAttraction(item, interests, season_tag),
  }));

  const candidates = [...scoredPrimary];

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.item.category !== b.item.category) return a.item.category.localeCompare(b.item.category);
    if (a.item.area !== b.item.area) return a.item.area.localeCompare(b.item.area);
    return a.item.name.localeCompare(b.item.name);
  });

  const targetCount = Math.max(8, max_results);
  const googleAllowance = enable_google && !offline_only ? 3 : 0;
  const mockTarget = Math.max(0, targetCount - googleAllowance);
  const mockSelected = candidates.slice(0, mockTarget).map((entry) => entry.item);

  let googleItems: Attraction[] = [];
  if (enable_google && !offline_only) {
    const googleCandidates = await getGoogleAttractions({ destination, interests, seed });
    const deduped = googleCandidates.filter((candidate) =>
      !mockSelected.some((item) => normalize(item.name) === normalize(candidate.name))
    );
    googleItems = deduped.slice(0, 5);
  }

  const combined = [...mockSelected, ...googleItems];

  combined.sort((a, b) => {
    if (a.source !== b.source) return a.source === "mock" ? -1 : 1;
    // seeded tie-breaker for stability when names equal
    if (a.name === b.name) return 0;
    const roll = rng();
    if (roll < 0.5) {
      return a.name.localeCompare(b.name);
    }
    return b.name.localeCompare(a.name);
  });

  const cap = Math.min(12, targetCount + googleItems.length);
  return combined.slice(0, cap);
}
