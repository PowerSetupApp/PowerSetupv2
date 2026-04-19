import { describe, expect, it } from "vitest";

import {
  SOLAR_BAG_ALIGNMENT_UPLIFT,
  SOLAR_BAG_UTILIZATION,
} from "../constants";
import type { AlgorithmInput } from "../types";
import { DEFAULT_BRAND_PREFERENCES, DEFAULT_CUSTOM_OVERRIDES } from "../types";
import { sizeSolar } from "./solar";

function baseInput(
  overrides: Partial<AlgorithmInput> = {},
): AlgorithmInput {
  return {
    systemVoltage: 12,
    vehicleVoltage: 12,
    batteryPreference: "lifepo4",
    energySources: ["solar"],
    roofModuleType: "rigid",
    roofAreas: [],
    solarBags: [{ id: "b1", power: 100 }],
    chargerSpeed: "normal",
    consumers: [],
    simultaneousLoad: "low",
    travelBehavior: {
      season: "winter",
      tripDuration: "week",
      winterLocation: "scandinavia",
      standingDuration: "medium",
    },
    autarchyDays: 2,
    cableLengths: {
      starterToService: 2,
      boosterToService: 2,
      solarToRegulator: 2,
      regulatorToService: 2,
      chargerToService: 2,
      serviceToInverter: 2,
      batteryToFuseBox: 2,
    },
    brandPreferences: DEFAULT_BRAND_PREFERENCES,
    customOverrides: DEFAULT_CUSTOM_OVERRIDES,
    ...overrides,
  };
}

describe("sizeSolar — portableEffectiveWp", () => {
  const dailyWh = 1000;
  const psh = 2;

  it("Scandinavia winter: nominal 100 Wp × uplift × utilization", () => {
    const input = baseInput();
    const out = sizeSolar(dailyWh, psh, input);
    const expected =
      100 *
      SOLAR_BAG_ALIGNMENT_UPLIFT.scandinavia.winter *
      SOLAR_BAG_UTILIZATION;
    expect(out.portableWp).toBe(100);
    expect(out.portableEffectiveWp).toBeCloseTo(expected, 9);
  });

  it("Germany all_year: lower uplift than Scandinavian winter", () => {
    const input = baseInput({
      travelBehavior: {
        season: "all_year",
        tripDuration: "week",
        winterLocation: "germany",
        standingDuration: "medium",
      },
    });
    const out = sizeSolar(dailyWh, psh, input);
    const expected =
      100 *
      SOLAR_BAG_ALIGNMENT_UPLIFT.germany.all_year *
      SOLAR_BAG_UTILIZATION;
    expect(out.portableEffectiveWp).toBeCloseTo(expected, 9);
    expect(out.portableEffectiveWp).toBeLessThan(
      100 *
        SOLAR_BAG_ALIGNMENT_UPLIFT.scandinavia.winter *
        SOLAR_BAG_UTILIZATION,
    );
  });

  it("two controllers: roof on maxRoofWp, portable on nominal portableWp", async () => {
    const { sizeController, sizePortableController } = await import(
      "./controller"
    );
    const input = baseInput({
      roofAreas: [{ id: "r", name: "Roof", length: 200, width: 100 }],
      solarBags: [{ id: "b", power: 400 }],
      systemVoltage: 12,
    });
    const solar = sizeSolar(dailyWh, psh, input);
    const roof = sizeController(solar, input);
    const bag = sizePortableController(solar, input);
    expect(roof.needed).toBe(true);
    expect(bag.needed).toBe(true);
    expect(roof.scope).toBe("roof");
    expect(bag.scope).toBe("portable");
    expect(roof.maxInputWp).toBeCloseTo(solar.maxRoofWp, 6);
    expect(bag.maxInputWp).toBe(400);
    expect(bag.currentA).toBeCloseTo(400 / 12, 6);
  });

  it("Southern summer: smallest uplift (high sun, flat roof near-optimal)", () => {
    const input = baseInput({
      travelBehavior: {
        season: "summer",
        tripDuration: "week",
        winterLocation: "southern",
        standingDuration: "medium",
      },
    });
    const out = sizeSolar(dailyWh, psh, input);
    const expected =
      100 *
      SOLAR_BAG_ALIGNMENT_UPLIFT.southern.summer *
      SOLAR_BAG_UTILIZATION;
    expect(out.portableEffectiveWp).toBeCloseTo(expected, 9);
  });
});
