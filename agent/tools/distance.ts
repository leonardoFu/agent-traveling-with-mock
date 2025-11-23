import { DistanceEstimate, TransportHub, TravelMode } from "@/agent/types";

const transportHubs: TransportHub[] = [
  { id: "jfk", city: "New York", code: "JFK", type: "airport", country: "USA", region: "americas", lat: 40.6413, lon: -73.7781 },
  { id: "ewr", city: "New York", code: "EWR", type: "airport", country: "USA", region: "americas", lat: 40.6895, lon: -74.1745 },
  { id: "bos-rail", city: "Boston", code: "BOS-rail", type: "rail", country: "USA", region: "americas", lat: 42.3656, lon: -71.0096 },
  { id: "lax", city: "Los Angeles", code: "LAX", type: "airport", country: "USA", region: "americas", lat: 33.9416, lon: -118.4085 },
  { id: "sfo", city: "San Francisco", code: "SFO", type: "airport", country: "USA", region: "americas", lat: 37.6213, lon: -122.379 },
  { id: "cdg", city: "Paris", code: "CDG", type: "airport", country: "France", region: "emea", lat: 49.0097, lon: 2.5479 },
  { id: "ory", city: "Paris", code: "ORY", type: "airport", country: "France", region: "emea", lat: 48.7262, lon: 2.3652 },
  { id: "stp", city: "London", code: "STP", type: "rail", country: "UK", region: "emea", lat: 51.5319, lon: -0.1264 },
  { id: "hnd", city: "Tokyo", code: "HND", type: "airport", country: "Japan", region: "apac", lat: 35.5494, lon: 139.7798 },
  { id: "nrt", city: "Tokyo", code: "NRT", type: "airport", country: "Japan", region: "apac", lat: 35.7767, lon: 140.3188 },
  { id: "sin", city: "Singapore", code: "SIN", type: "airport", country: "Singapore", region: "apac", lat: 1.3644, lon: 103.9915 },
  { id: "osk-rail", city: "Osaka", code: "OSK-rail", type: "rail", country: "Japan", region: "apac", lat: 34.7025, lon: 135.4959 },
];

export const regionalDefaults = {
  americas: { trainThresholdKm: 600, busThresholdKm: 250 },
  emea: { trainThresholdKm: 900, busThresholdKm: 320 },
  apac: { trainThresholdKm: 800, busThresholdKm: 320 },
};

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversine(a: TransportHub, b: TransportHub): number {
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function findHub(city: string): TransportHub | undefined {
  const normalized = city.trim().toLowerCase();
  return transportHubs.find((hub) => hub.city.toLowerCase() === normalized);
}

export function estimateDistance(origin: string, destination: string): DistanceEstimate {
  const fromHub = findHub(origin);
  const toHub = findHub(destination);
  if (!fromHub || !toHub) {
    return { origin, destination, distance_km: 800 };
  }
  return { origin, destination, distance_km: Math.round(haversine(fromHub, toHub)) };
}

export function chooseMode(distanceKm: number, region: TransportHub["region"] = "americas"): TravelMode {
  const thresholds = regionalDefaults[region];
  if (distanceKm >= thresholds.trainThresholdKm) return "flight";
  if (distanceKm >= thresholds.busThresholdKm) return "train";
  return "bus";
}

export function estimateDurationMinutes(distanceKm: number, mode: TravelMode): number {
  const speeds = {
    flight: 750,
    train: 180,
    bus: 90,
  };
  const bufferMinutes = mode === "flight" ? 120 : mode === "train" ? 30 : 20;
  return Math.max(60, Math.round((distanceKm / speeds[mode]) * 60 + bufferMinutes));
}
