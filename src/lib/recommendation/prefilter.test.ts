import { describe, expect, it } from "vitest";

import type { AlgorithmOutput } from "@/lib/algorithm/types";

import { prefilterProductsForRecommendation } from "./prefilter";
import type { ProductRecommendationRow } from "./types";

const minimalOutput = {
  battery: {
    dailyWh: 100,
    minCapacityAh: 80,
    recommendedCapacityAh: 200,
    type: "lifepo4",
    voltage: 12,
    autarchyDays: 6,
    hasSolar: true,
    hasAlternator: false,
  },
  solar: {
    needed: true,
    requiredWp: 400,
    maxRoofWp: 600,
    portableWp: 0,
    totalAvailableWp: 500,
    dailySolarYieldWh: 1200,
    solarShortfallWh: 0,
    recommendation: "",
  },
  booster: {
    needed: false,
    inputCurrentA: 0,
    outputCurrentA: 0,
    currentA: 0,
    inputVoltage: 12,
    outputVoltage: 12,
    needsConversion: false,
    dailyAlternatorChargeWh: 0,
  },
  charger: {
    needed: false,
    targetCurrentA: 0,
    recommendedCurrentA: 0,
    chargingTimeHours: 4,
  },
  inverter: { needed: true, peakLoadW: 800, recommendedW: 1000 },
  controller: {
    needed: true,
    type: "mppt",
    currentA: 40,
    originalCurrentA: 40,
    maxInputWp: 600,
  },
  cables: [],
} satisfies AlgorithmOutput;

describe("prefilterProductsForRecommendation", () => {
  it("ranks battery products by capacity proximity to recommendation", () => {
    const products: ProductRecommendationRow[] = [
      {
        id: "a",
        name: "200Ah",
        categorySlug: "battery",
        categoryName: "Batterie",
        capacityAh: 190,
        voltageV: 12,
        solarWp: null,
        powerW: null,
        currentA: null,
      },
      {
        id: "b",
        name: "80Ah",
        categorySlug: "battery",
        categoryName: "Batterie",
        capacityAh: 80,
        voltageV: 12,
        solarWp: null,
        powerW: null,
        currentA: null,
      },
    ];
    const out = prefilterProductsForRecommendation({
      calculations: minimalOutput,
      products,
      perCategoryLimit: 2,
    });
    expect(out.battery[0]?.productId).toBe("a");
    expect(out.battery.map((p) => p.productId)).toContain("b");
  });

  it("returns empty buckets when no products match slug heuristics", () => {
    const products: ProductRecommendationRow[] = [
      {
        id: "x",
        name: "Mystery",
        categorySlug: "misc",
        categoryName: "Sonstiges",
        capacityAh: null,
        voltageV: null,
        solarWp: null,
        powerW: null,
        currentA: null,
      },
    ];
    const out = prefilterProductsForRecommendation({
      calculations: minimalOutput,
      products,
      perCategoryLimit: 3,
    });
    expect(out.battery).toHaveLength(0);
    expect(out.solar).toHaveLength(0);
    expect(out.other.length).toBeGreaterThan(0);
  });
});
