import { faker } from "@faker-js/faker";
import { MockTicketOption, TravelMode } from "@/agent/types";
import { chooseMode, estimateDistance, estimateDurationMinutes, findHub } from "./distance";
import { hashSeed } from "@/agent/utils/random";

interface TicketRequest {
  origin: string;
  destination: string;
  date?: string;
  seed?: string | number;
  forceMode?: TravelMode;
}

function seededFaker(seed: string | number) {
  faker.seed(hashSeed(seed));
  return faker;
}

function addMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60 * 1000);
}

function formatIso(date: Date) {
  return date.toISOString();
}

export function generateMockTickets(request: TicketRequest): MockTicketOption[] {
  const { origin, destination, date, seed = `${origin}-${destination}` } = request;
  const distance = estimateDistance(origin, destination);
  const region = findHub(origin)?.region ?? findHub(destination)?.region ?? "americas";
  const mode = request.forceMode ?? chooseMode(distance.distance_km, region);
  const duration = estimateDurationMinutes(distance.distance_km, mode);

  const fk = seededFaker(`tickets-${seed}`);
  const baseDate = date ? new Date(date) : new Date("2024-06-01T09:00:00Z");

  const count = fk.number.int({ min: 3, max: 4 });
  const options: MockTicketOption[] = Array.from({ length: count }).map((_, index) => {
    const departOffset = (index * 90 + fk.number.int({ min: 0, max: 30 })) * 60000; // minutes to ms
    const departTime = new Date(baseDate.getTime() + departOffset);
    const arriveTime = addMinutes(departTime, duration + fk.number.int({ min: 0, max: 20 }));
    const carrier = fk.company.name();

    const priceBase = mode === "flight" ? 480 : mode === "train" ? 160 : 85;
    const price = fk.number.int({ min: Math.round(priceBase * 0.9), max: Math.round(priceBase * 1.15) });

    return {
      id: `${mode}_${origin}_${destination}_${index}`,
      origin,
      destination,
      mode,
      carrier,
      depart_time: formatIso(departTime),
      arrive_time: formatIso(arriveTime),
      duration_minutes: duration,
      price_usd: price,
      layovers: mode === "flight" ? 0 : 0,
    };
  });

  const sorted = options.sort((a, b) => a.price_usd - b.price_usd || a.duration_minutes - b.duration_minutes);
  if (sorted[0]) {
    sorted[0].best_pick = true;
  }
  return sorted;
}
