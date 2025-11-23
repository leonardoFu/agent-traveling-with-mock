import { lookupCostBand, resolveCostBand } from "@/agent/tools/costs";

describe("cost lookups", () => {
  it("returns specific bands for known destinations", () => {
    const tokyo = lookupCostBand("Tokyo");
    expect(tokyo?.lodging_per_night).toBeGreaterThan(100);
    expect(tokyo?.currency).toBe("USD");
  });

  it("falls back when unknown", () => {
    const fallback = resolveCostBand("Unknownopolis");
    expect(fallback.destination).toBe("New York");
  });
});
