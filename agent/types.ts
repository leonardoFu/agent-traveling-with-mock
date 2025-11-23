export type CostLevel = "budget" | "moderate" | "premium" | "luxury";

export interface Attraction {
  id: string;
  destination: string;
  name: string;
  category: string;
  area: string;
  stay_minutes: number;
  cost_level: CostLevel;
  rationale: string;
  source: "mock" | "google";
  tags?: string[];
  season_tag?: string;
  address?: string;
}

export interface TransportHub {
  id: string;
  city: string;
  code: string;
  type: "airport" | "rail" | "bus";
  country: string;
  region: "americas" | "emea" | "apac";
  lat: number;
  lon: number;
}

export type TravelMode = "flight" | "train" | "bus";

export interface DistanceEstimate {
  origin: string;
  destination: string;
  distance_km: number;
}

export interface MockTicketOption {
  id: string;
  origin: string;
  destination: string;
  mode: TravelMode;
  carrier: string;
  depart_time: string;
  arrive_time: string;
  duration_minutes: number;
  price_usd: number;
  layovers: number;
  best_pick?: boolean;
  risk_note?: string;
}

export interface CostBand {
  destination: string;
  lodging_per_night: number;
  meal_per_day: number;
  activity_per_day: number;
  transit_per_day: number;
  currency: string;
  notes?: string;
}

export interface AttractionRequest {
  destination: string;
  interests?: string[];
  exclusions?: string[];
  mobility?: "normal" | "limited";
  season_tag?: string;
  enable_google?: boolean;
  offline_only?: boolean;
  seed?: string | number;
  max_results?: number;
}

export interface GoogleSearchResult {
  title: string;
  snippet: string;
  url: string;
}
