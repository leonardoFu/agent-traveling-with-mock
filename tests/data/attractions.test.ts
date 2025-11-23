import { selectAttractions } from "@/agent/tools/attractions";

describe("selectAttractions", () => {
  it("returns mock-only results when offline_only is true", async () => {
    const first = await selectAttractions({
      destination: "Tokyo",
      interests: ["food", "culture"],
      offline_only: true,
      enable_google: true,
      seed: "tokyo-offline",
    });

    expect(first.length).toBeGreaterThanOrEqual(8);
    expect(first.every((item) => item.source === "mock")).toBe(true);

    const second = await selectAttractions({
      destination: "Tokyo",
      interests: ["food", "culture"],
      offline_only: true,
      enable_google: true,
      seed: "tokyo-offline",
    });

    expect(first.map((a) => a.id)).toEqual(second.map((a) => a.id));
  });

  it("adds google-sourced items when enabled and not offline", async () => {
    const result = await selectAttractions({
      destination: "Paris",
      interests: ["art"],
      enable_google: true,
      offline_only: false,
      seed: "paris-google",
      max_results: 10,
    });

    const googleCount = result.filter((item) => item.source === "google").length;
    expect(googleCount).toBeGreaterThan(0);
    expect(googleCount).toBeLessThanOrEqual(5);
    expect(result.length).toBeLessThanOrEqual(12);
  });
});
