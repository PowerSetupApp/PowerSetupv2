import { describe, expect, it } from "vitest";

import { applyCustomOverrides } from "./apply-custom-overrides";
import type {
  AlgorithmOutput,
  BatteryRecommendation,
  CableRecommendation,
  SolarRecommendation,
} from "./types";
import { DEFAULT_CUSTOM_OVERRIDES } from "./types";

function baseBattery(): BatteryRecommendation {
  return {
    dailyWh: 2000,
    minCapacityAh: 200,
    recommendedCapacityAh: 250,
    type: "lifepo4",
    voltage: 12,
    autarchyDays: 2,
    hasSolar: false,
    hasAlternator: false,
    solarTopUpWh: 0,
    alternatorTopUpWh: 0,
    dailyTopUpWh: 0,
    netDailyDeficitWh: 2000,
    bindingBranch: "soft",
    shoreBridgeReliefBaseDays: 0,
    shoreBridgeReliefEffectiveDays: 0,
    shoreReliefAlternatorScale: 1,
    autarchyBridgeDaysRaw: 2,
    autarchyBridgeDaysForSoft: 2,
  };
}

function baseSolar(): SolarRecommendation {
  return {
    needed: true,
    requiredWp: 500,
    maxRoofWp: 300,
    portableWp: 0,
    portableEffectiveWp: 0,
    totalAvailableWp: 300,
    dailySolarYieldWh: 1200,
    solarShortfallWh: 800,
    recommendation: "",
  };
}

function baseOutput(): AlgorithmOutput {
  const cable: CableRecommendation = {
    route: "battery_to_fuse_box",
    displayName: "Versorgerbatterie -> Sicherungskasten",
    lengthM: 2,
    currentA: 10,
    voltage: 12,
    minCrossSection: 6,
    recommendedCrossSection: 6,
    isCritical: true,
  };
  return {
    battery: baseBattery(),
    solar: baseSolar(),
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
      chargingTimeHours: 0,
    },
    inverter: { needed: false, peakLoadW: 0, recommendedW: 0 },
    controller: { needed: true, type: "mppt", currentA: 25, maxInputWp: 300, scope: "roof" },
    portableController: { needed: false, type: "mppt", currentA: 0, maxInputWp: 0, scope: "portable" },
    cables: [cable],
    requiredFuseCategories: [],
  };
}

describe("applyCustomOverrides", () => {
  it("returns the input untouched when every override is null", () => {
    const out = baseOutput();
    const result = applyCustomOverrides(out, DEFAULT_CUSTOM_OVERRIDES);
    expect(result).toBe(out);
  });

  it("overrides battery.recommendedCapacityAh when battery override is set", () => {
    const out = baseOutput();
    const result = applyCustomOverrides(out, {
      ...DEFAULT_CUSTOM_OVERRIDES,
      battery: 400,
    });
    expect(result.battery.recommendedCapacityAh).toBe(400);
    // Other battery fields are preserved.
    expect(result.battery.minCapacityAh).toBe(out.battery.minCapacityAh);
    expect(result.battery.dailyWh).toBe(out.battery.dailyWh);
  });

  it("overrides solar.requiredWp and recomputes shortfall against the yield", () => {
    const out = baseOutput();
    const result = applyCustomOverrides(out, {
      ...DEFAULT_CUSTOM_OVERRIDES,
      solar: 1000,
    });
    expect(result.solar.requiredWp).toBe(1000);
    // shortfall = max(0, dailyWh - dailySolarYieldWh) = max(0, 2000 - 1200) = 800
    expect(result.solar.solarShortfallWh).toBeCloseTo(800, 9);
  });

  it("does not mutate input when only non-applied overrides (e.g. inverter) are set", () => {
    const out = baseOutput();
    const result = applyCustomOverrides(out, {
      ...DEFAULT_CUSTOM_OVERRIDES,
      inverter: 2000,
      booster: 50,
      charger: 30,
      controller: 40,
    });
    // Non-applied fields are ignored per §4.4 of the plan.
    expect(result).toBe(out);
  });

  it("applies battery and solar overrides together (step-8 balance slider path)", () => {
    const out = baseOutput();
    const result = applyCustomOverrides(out, {
      ...DEFAULT_CUSTOM_OVERRIDES,
      battery: 180,
      solar: 400,
    });
    expect(result.battery.recommendedCapacityAh).toBe(180);
    expect(result.solar.requiredWp).toBe(400);
    expect(result.solar.solarShortfallWh).toBeCloseTo(800, 9);
  });
});
