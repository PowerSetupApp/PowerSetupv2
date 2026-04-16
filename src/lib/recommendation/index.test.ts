import { describe, expect, it } from "vitest";

import { calculateRequirements } from "@/lib/algorithm/calculate";
import { DEFAULT_ALGORITHM_INPUT } from "@/lib/algorithm/types";

import { runRecommendationPipeline } from "./index";
import type { ProductRecommendationRow } from "./types";

describe("runRecommendationPipeline", () => {
  it("runs prefilter without AI and without DB when products are injected", async () => {
    const calc = calculateRequirements({
      ...DEFAULT_ALGORITHM_INPUT,
      energySources: ["solar"],
      consumers: [{ id: "c1", name: "LED", power: 10, daily: 4, voltage: 12 }],
    });
    const products: ProductRecommendationRow[] = [
      {
        id: "bat-1",
        name: "Test 200Ah",
        categorySlug: "battery",
        categoryName: "Batterie",
        capacityAh: 200,
        voltageV: 12,
        solarWp: null,
        powerW: null,
        currentA: null,
      },
    ];
    const res = await runRecommendationPipeline({
      calculations: calc,
      productsOverride: products,
      runAi: false,
    });
    expect(res.prefilter.battery.length).toBeGreaterThanOrEqual(1);
    expect(res.ai).toBeUndefined();
  });
});
