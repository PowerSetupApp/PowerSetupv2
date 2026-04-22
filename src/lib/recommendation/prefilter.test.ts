import { describe, expect, it } from "vitest";

import { computeAlgorithm } from "@/lib/algorithm";
import type { AlgorithmOutput } from "@/lib/algorithm/types";
import { DEFAULT_ALGORITHM_INPUT } from "@/lib/algorithm/types";

import { prefilterProductsForRecommendation, roundUpToStandardMm2 } from "./prefilter";
import type { ProductRecommendationRow } from "./types";

const baseCalc = computeAlgorithm({
  ...DEFAULT_ALGORITHM_INPUT,
  energySources: ["solar"],
  consumers: [{ id: "c1", name: "LED", power: 10, daily: 4, voltage: 12 }],
});

/** Festes Ziel-Ah für stabile Prefilter-Tests (echte Berechnung, nur Ziel überschrieben). */
const minimalOutput: AlgorithmOutput = {
  ...baseCalc,
  battery: { ...baseCalc.battery, recommendedCapacityAh: 200 },
};

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
        crossSectionMm2: null,
        batteryType: "lifepo4",
        waveform: null,
        filterValues: null,
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
        crossSectionMm2: null,
        batteryType: "lifepo4",
        waveform: null,
        filterValues: null,
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
        crossSectionMm2: null,
        batteryType: null,
        waveform: null,
        filterValues: null,
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

  it("prefers matching battery chemistry from filterValues over mismatched type", () => {
    const products: ProductRecommendationRow[] = [
      {
        id: "agm-close",
        name: "AGM 195Ah",
        categorySlug: "battery",
        categoryName: "Batterie",
        capacityAh: 195,
        voltageV: 12,
        solarWp: null,
        powerW: null,
        currentA: null,
        crossSectionMm2: null,
        batteryType: "agm",
        waveform: null,
        filterValues: null,
      },
      {
        id: "lfp-far",
        name: "LiFePO4 160Ah",
        categorySlug: "battery",
        categoryName: "Batterie",
        capacityAh: 160,
        voltageV: 12,
        solarWp: null,
        powerW: null,
        currentA: null,
        crossSectionMm2: null,
        batteryType: null,
        waveform: null,
        filterValues: { chemistry: "LiFePO4" },
      },
    ];
    const out = prefilterProductsForRecommendation({
      calculations: minimalOutput,
      products,
      perCategoryLimit: 2,
    });
    expect(out.battery[0]?.productId).toBe("lfp-far");
  });

  it("prefers battery capacity at or above target over slightly below", () => {
    const calc: AlgorithmOutput = {
      ...minimalOutput,
      battery: {
        ...minimalOutput.battery,
        recommendedCapacityAh: 245,
      },
    };
    const products: ProductRecommendationRow[] = [
      {
        id: "under",
        name: "200Ah",
        categorySlug: "battery",
        categoryName: "Batterie",
        capacityAh: 200,
        voltageV: 12,
        solarWp: null,
        powerW: null,
        currentA: null,
        crossSectionMm2: null,
        batteryType: "lifepo4",
        waveform: null,
        filterValues: null,
      },
      {
        id: "over",
        name: "280Ah",
        categorySlug: "battery",
        categoryName: "Batterie",
        capacityAh: 280,
        voltageV: 12,
        solarWp: null,
        powerW: null,
        currentA: null,
        crossSectionMm2: null,
        batteryType: "lifepo4",
        waveform: null,
        filterValues: null,
      },
    ];
    const out = prefilterProductsForRecommendation({
      calculations: calc,
      products,
      perCategoryLimit: 2,
    });
    expect(out.battery[0]?.productId).toBe("over");
  });

  it("scores solar by total array Wp (module count × Wp) vs required Wp", () => {
    const calc: AlgorithmOutput = {
      ...minimalOutput,
      solar: {
        ...minimalOutput.solar,
        needed: true,
        requiredWp: 930,
        maxRoofWp: 2000,
        portableWp: 0,
        portableEffectiveWp: 0,
        totalAvailableWp: 1000,
        dailySolarYieldWh: 100,
        solarShortfallWh: 0,
        recommendation: "",
      },
    };
    const products: ProductRecommendationRow[] = [
      {
        id: "small-mod",
        name: "200W",
        categorySlug: "solar-modules",
        categoryName: "Solar",
        capacityAh: null,
        voltageV: null,
        solarWp: 200,
        powerW: null,
        currentA: null,
        crossSectionMm2: null,
        batteryType: null,
        waveform: null,
        filterValues: null,
      },
      {
        id: "half-k",
        name: "500W",
        categorySlug: "solar-modules",
        categoryName: "Solar",
        capacityAh: null,
        voltageV: null,
        solarWp: 500,
        powerW: null,
        currentA: null,
        crossSectionMm2: null,
        batteryType: null,
        waveform: null,
        filterValues: null,
      },
    ];
    const out = prefilterProductsForRecommendation({
      calculations: calc,
      products,
      perCategoryLimit: 2,
    });
    expect(out.solar[0]?.productId).toBe("half-k");
  });

  it("emits cableByRoute picks for active cable runs", () => {
    const calc = computeAlgorithm({
      ...DEFAULT_ALGORITHM_INPUT,
      energySources: ["solar", "alternator"],
      roofAreas: [{ id: "r1", name: "Dach", length: 220, width: 120 }],
      consumers: [{ id: "c1", name: "Kühlung", power: 80, daily: 10, voltage: 12 }],
    });
    const products: ProductRecommendationRow[] = [35, 50, 95, 120].map((mm) => ({
      id: `k${mm}`,
      name: `${mm}mm`,
      categorySlug: "cables",
      categoryName: "Kabel",
      capacityAh: null,
      voltageV: null,
      solarWp: null,
      powerW: null,
      currentA: null,
      crossSectionMm2: mm,
      batteryType: null,
      waveform: null,
      filterValues: null,
    }));
    const out = prefilterProductsForRecommendation({
      calculations: calc,
      products,
      perCategoryLimit: 4,
    });
    const activeRoutes = calc.cables.filter((c) => c.lengthM > 0 && c.currentA > 0 && c.recommendedCrossSection > 0);
    expect(out.cableByRoute?.length ?? 0).toBe(activeRoutes.length);
    const allowed = new Set(products.map((p) => p.id));
    expect(out.cableByRoute?.every((c) => allowed.has(c.productId))).toBe(true);
  });
});

describe("roundUpToStandardMm2", () => {
  it("rounds up to the next standard size", () => {
    expect(roundUpToStandardMm2(7.2)).toBe(10);
    expect(roundUpToStandardMm2(16)).toBe(16);
  });
});
