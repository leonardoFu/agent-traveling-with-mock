import { generateMockTickets } from "@/agent/tools/tickets";

describe("generateMockTickets", () => {
  it("prefers train for medium-distance regional trips", () => {
    const tickets = generateMockTickets({ origin: "New York", destination: "Boston", seed: "nyc-bos" });
    expect(tickets.length).toBeGreaterThanOrEqual(3);
    expect(tickets.every((t) => t.mode === "train" || t.mode === "bus" || t.mode === "flight")).toBe(true);
    expect(tickets[0].mode).toBe("train");
  });

  it("uses flights for long-haul routes", () => {
    const tickets = generateMockTickets({ origin: "New York", destination: "Tokyo", seed: "nyc-tyo" });
    expect(tickets[0].mode).toBe("flight");
  });

  it("is deterministic for the same seed", () => {
    const first = generateMockTickets({ origin: "Paris", destination: "London", seed: "repeat" });
    const second = generateMockTickets({ origin: "Paris", destination: "London", seed: "repeat" });
    expect(first.map((t) => t.price_usd)).toEqual(second.map((t) => t.price_usd));
  });
});
