import { Attraction, GoogleSearchResult } from "@/agent/types";
import { makeRng } from "@/agent/utils/random";

interface GoogleAttractionRequest {
  destination: string;
  interests?: string[];
  seed?: string | number;
}

function sanitizeQuery(term: string): string {
  return term.replace(/[^a-zA-Z0-9\s,'-]/g, "").trim();
}

export function buildGoogleQuery(destination: string, interests: string[] = []): string {
  const base = sanitizeQuery(destination);
  if (!interests.length) return `${base} new openings events`;
  const focus = sanitizeQuery(interests.slice(0, 2).join(" "));
  return `${base} ${focus} new openings`; 
}

export async function mockGoogleSearch(destination: string, interests: string[] = [], seed: string | number = 1): Promise<GoogleSearchResult[]> {
  const rng = makeRng(seed);
  const query = buildGoogleQuery(destination, interests);
  const canned = [
    {
      title: `${destination} food hall opening`,
      snippet: "Buzzing food hall with rotating chefs and seasonal pop-ups.",
      url: `https://example.com/${destination.toLowerCase()}-food-hall`,
    },
    {
      title: `${destination} rooftop gallery`,
      snippet: "Contemporary art + skyline terrace with late-night hours.",
      url: `https://example.com/${destination.toLowerCase()}-rooftop-gallery`,
    },
    {
      title: `${destination} night market`,
      snippet: "Weekend night market with street snacks and live music.",
      url: `https://example.com/${destination.toLowerCase()}-night-market`,
    },
  ];

  // Deterministic shuffle using rng
  const shuffled = [...canned].sort(() => rng() - 0.5);
  return shuffled.slice(0, 3).map((item) => ({ ...item, title: `${item.title} via ${query}` }));
}

export async function getGoogleAttractions(request: GoogleAttractionRequest): Promise<Attraction[]> {
  const { destination, interests = [], seed = 1 } = request;
  const results = await mockGoogleSearch(destination, interests, seed);
  return results.map((result, index) => ({
    id: `google_${destination.toLowerCase().replace(/\s+/g, "-")}_${index}`,
    destination,
    name: result.title,
    category: interests[0] ?? "mixed",
    area: "city center",
    stay_minutes: 60,
    cost_level: "moderate",
    rationale: result.snippet,
    source: "google",
    tags: ["google", "fresh"],
  }));
}
