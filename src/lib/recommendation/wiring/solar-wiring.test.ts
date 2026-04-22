import { describe, expect, it } from "vitest";

import { computeAlgorithm } from "@/lib/algorithm";
import { mergeAlgorithmTuning } from "@/lib/algorithm/algorithm-tuning";
import type { AlgorithmOutput } from "@/lib/algorithm/types";
import {
  DEFAULT_BRAND_PREFERENCES,
  DEFAULT_CUSTOM_OVERRIDES,
  type AlgorithmInput,
  type TravelBehavior,
} from "@/lib/algorithm/types";
import type { ProductRecommendationRow } from "@/lib/recommendation/types";

import { buildSolarWiringRecommendation, computeSolarWiring } from "./solar-wiring";

function travel(): TravelBehavior {
  return {
    season: "all_year",
    tripDuration: "week",
    winterLocation: "germany",
    standingDuration: "medium",
  };
}

function roofInput(overrides: Partial<AlgorithmInput> = {}): AlgorithmInput {
  return {
    systemVoltage: 12,
    vehicleVoltage: 12,
    batteryPreference: "lifepo4",
    energySources: ["solar"],
    roofModuleType: "rigid",
    roofAreas: [{ id: "r1", name: "Dach", length: 300, width: 100 }],
    solarBags: [],
    chargerSpeed: "normal",
    consumers: [{ id: "c1", name: "LED", power: 20, daily: 8, voltage: 12 }],
    simultaneousLoad: "low",
    travelBehavior: travel(),
    autarchyDays: 1,
    cableLengths: {
      starterToService: 2,
      boosterToService: 1,
      solarToRegulator: 3,
      regulatorToService: 1,
      chargerToService: 1,
      serviceToInverter: 1,
      batteryToFuseBox: 1,
    },
    brandPreferences: DEFAULT_BRAND_PREFERENCES,
    customOverrides: DEFAULT_CUSTOM_OVERRIDES,
    ...overrides,
  };
}

function roofCalc(): AlgorithmOutput {
  return computeAlgorithm(roofInput(), {});
}

function moduleRow(wp: number, fv: Record<string, unknown>): ProductRecommendationRow {
  return {
    id: "mod-a",
    name: "Testmodul",
    categorySlug: "solar-modules",
    categoryName: "Solar",
    capacityAh: null,
    voltageV: null,
    solarWp: wp,
    powerW: null,
    currentA: null,
    crossSectionMm2: null,
    batteryType: null,
    waveform: null,
    filterValues: fv,
  };
}

function ctrlRow(vmax: number): ProductRecommendationRow {
  return {
    id: "mppt-a",
    name: "MPPT",
    categorySlug: "solar-laderegler",
    categoryName: "Laderegler",
    capacityAh: null,
    voltageV: 12,
    solarWp: null,
    powerW: null,
    currentA: 40,
    crossSectionMm2: null,
    batteryType: null,
    waveform: null,
    filterValues: { maxPvInputVoltageV: vmax },
  };
}

const tuning = mergeAlgorithmTuning({});

describe("computeSolarWiring", () => {
  const calc = roofCalc();

  it("returns null when module row is null", () => {
    expect(
      computeSolarWiring({
        moduleCount: 2,
        moduleRow: null,
        controllerRow: ctrlRow(150),
        calculations: calc,
        tuning,
      }),
    ).toBeNull();
  });

  it("1 module → 1S×1P, no warnings", () => {
    const w = computeSolarWiring({
      moduleCount: 1,
      moduleRow: moduleRow(200, { Voc: 22, Vmpp: 18 }),
      controllerRow: ctrlRow(150),
      calculations: calc,
      tuning,
    });
    expect(w).not.toBeNull();
    expect(w!.seriesCount).toBe(1);
    expect(w!.parallelCount).toBe(1);
    expect(w!.warnings).toHaveLength(0);
  });

  it("2 modules, Voc=22, Vmax=150 → 2S×1P", () => {
    const w = computeSolarWiring({
      moduleCount: 2,
      moduleRow: moduleRow(200, { Voc: 22, Vmpp: 18 }),
      controllerRow: ctrlRow(150),
      calculations: calc,
      tuning,
    });
    expect(w!.seriesCount).toBe(2);
    expect(w!.parallelCount).toBe(1);
  });

  it("2 modules, Voc=22, Vmax=30 → 1S×2P", () => {
    const w = computeSolarWiring({
      moduleCount: 2,
      moduleRow: moduleRow(200, { Voc: 22, Vmpp: 18 }),
      controllerRow: ctrlRow(30),
      calculations: calc,
      tuning,
    });
    expect(w!.seriesCount).toBe(1);
    expect(w!.parallelCount).toBe(2);
  });

  it("4 modules, Voc=22, Vmax=60 → 2S×2P", () => {
    const w = computeSolarWiring({
      moduleCount: 4,
      moduleRow: moduleRow(200, { Voc: 22, Vmpp: 18 }),
      controllerRow: ctrlRow(60),
      calculations: calc,
      tuning,
    });
    expect(w!.seriesCount).toBe(2);
    expect(w!.parallelCount).toBe(2);
  });

  it("3 modules, Voc=22, Vmax=150 → 3S×1P", () => {
    const w = computeSolarWiring({
      moduleCount: 3,
      moduleRow: moduleRow(200, { Voc: 22, Vmpp: 18 }),
      controllerRow: ctrlRow(150),
      calculations: calc,
      tuning,
    });
    expect(w!.seriesCount).toBe(3);
    expect(w!.parallelCount).toBe(1);
  });

  it("5 modules, Voc=22, Vmax=30 → 1S×5P + module-count warning", () => {
    const w = computeSolarWiring({
      moduleCount: 5,
      moduleRow: moduleRow(200, { Voc: 22, Vmpp: 18 }),
      controllerRow: ctrlRow(30),
      calculations: calc,
      tuning,
    });
    expect(w!.seriesCount).toBe(1);
    expect(w!.parallelCount).toBe(5);
    expect(w!.warnings.some((x) => x.kind === "module-count-not-divisible")).toBe(true);
  });

  it("Voc missing in filters → null", () => {
    expect(
      computeSolarWiring({
        moduleCount: 2,
        moduleRow: moduleRow(200, { Vmpp: 18 }),
        controllerRow: ctrlRow(150),
        calculations: calc,
        tuning,
      }),
    ).toBeNull();
  });

  it("controller max V missing → null", () => {
    const rowNoMax: ProductRecommendationRow = {
      ...ctrlRow(150),
      filterValues: { brand: "x" },
    };
    expect(
      computeSolarWiring({
        moduleCount: 2,
        moduleRow: moduleRow(200, { Voc: 22, Vmpp: 18 }),
        controllerRow: rowNoMax,
        calculations: calc,
        tuning,
      }),
    ).toBeNull();
  });

  it("Voc_cold > Vmax at N=1 → kein-feasible + mppt warning", () => {
    const w = computeSolarWiring({
      moduleCount: 1,
      moduleRow: moduleRow(200, { Voc: 40, Vmpp: 32 }),
      controllerRow: ctrlRow(30),
      calculations: calc,
      tuning,
    });
    expect(w!.rationale).toBe("kein-feasible");
    expect(w!.warnings.some((x) => x.kind === "mppt-voltage-exceeded")).toBe(true);
  });

  it("hand-computable: 4 modules, Voc 22.4, Vmax 150 → 4S1P, Voc_cold string ≈ 107.5 V", () => {
    const Voc = 22.4;
    const w = computeSolarWiring({
      moduleCount: 4,
      moduleRow: moduleRow(180, { Voc, Vmpp: 19 }),
      controllerRow: ctrlRow(150),
      calculations: calc,
      tuning,
    });
    expect(w!.seriesCount).toBe(4);
    expect(w!.parallelCount).toBe(1);
    expect(w!.arrayVoltageVocColdV).toBeCloseTo(Voc * tuning.vocColdMultiplier * 4, 4);
  });

  it("monotonicity: raising Vmax never lowers seriesCount (fixed other inputs)", () => {
    const moduleRowFixed = moduleRow(200, { Voc: 22, Vmpp: 18 });
    let prev = 0;
    for (const vmax of [40, 55, 80, 150, 250]) {
      const w = computeSolarWiring({
        moduleCount: 4,
        moduleRow: moduleRowFixed,
        controllerRow: ctrlRow(vmax),
        calculations: calc,
        tuning,
      });
      expect(w!.rationale).not.toBe("kein-feasible");
      expect(w!.seriesCount).toBeGreaterThanOrEqual(prev);
      prev = w!.seriesCount;
    }
  });

  it("returns null for portable-only array (no roof Wp)", () => {
    const portableCalc = computeAlgorithm(
      roofInput({
        roofAreas: [],
        solarBags: [{ id: "b1", power: 200 }],
      }),
      {},
    );
    expect(
      computeSolarWiring({
        moduleCount: 2,
        moduleRow: moduleRow(200, { Voc: 22, Vmpp: 18 }),
        controllerRow: ctrlRow(150),
        calculations: portableCalc,
        tuning,
      }),
    ).toBeNull();
  });
});

describe("buildSolarWiringRecommendation", () => {
  it("returns null without throw when products empty", () => {
    const calc = roofCalc();
    const prefilter = {
      battery: [],
      solar: [{ productId: "mod-a", bucket: "solar" as const, score: 1, categorySlug: "x", name: "m" }],
      inverter: [],
      controller: [{ productId: "mppt-a", bucket: "controller" as const, score: 1, categorySlug: "y", name: "c" }],
      cable: [],
      other: [],
    };
    expect(
      buildSolarWiringRecommendation({
        calculations: calc,
        prefilter,
        aiSelections: null,
        products: [],
        tuning,
      }),
    ).toBeNull();
  });
});
