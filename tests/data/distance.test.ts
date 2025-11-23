import { chooseMode, estimateDistance, estimateDurationMinutes } from "@/agent/tools/distance";

describe("distance heuristics", () => {
  it("estimates reasonable distance between known hubs", () => {
    const { distance_km } = estimateDistance("New York", "Paris");
    expect(distance_km).toBeGreaterThan(5000);
    expect(distance_km).toBeLessThan(7000);
  });

  it("selects mode based on thresholds", () => {
    expect(chooseMode(300, "americas")).toBe("train");
    expect(chooseMode(1200, "americas")).toBe("flight");
  });

  it("estimates duration with buffers", () => {
    const minutes = estimateDurationMinutes(300, "train");
    expect(minutes).toBeGreaterThan(100);
    expect(minutes).toBeLessThan(200);
  });
});
