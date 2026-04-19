import { describe, expect, it } from "vitest";

import { DEFAULT_ALGORITHM_INPUT, type AlgorithmInput } from "@/lib/algorithm/types";
import { algorithmInputSchema } from "@/lib/schemas/wizard-input";

import { randomizeAlgorithmTestFilters, stringifyAlgorithmInput } from "./algorithm-sandbox";

function cloneInput(input: AlgorithmInput): AlgorithmInput {
  return JSON.parse(JSON.stringify(input)) as AlgorithmInput;
}

describe("algorithm-sandbox helpers", () => {
  it("randomizeAlgorithmTestFilters returns schema-valid wizard input", () => {
    const base = cloneInput(DEFAULT_ALGORITHM_INPUT);
    const input = randomizeAlgorithmTestFilters(base);
    const parsed = algorithmInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("randomizeAlgorithmTestFilters keeps scenario fields from base", () => {
    const base = cloneInput(DEFAULT_ALGORITHM_INPUT);
    base.systemVoltage = 24;
    base.vehicleVoltage = 24;
    base.batteryPreference = "agm";
    base.energySources = ["solar", "shore_power"];
    base.roofModuleType = "flexible";
    base.roofAreas = [{ id: "r1", name: "Heck", length: 180, width: 100 }];
    base.solarBags = [{ id: "b1", power: 120 }];
    base.consumers = [
      {
        id: "c1",
        name: "Test",
        power: 80,
        daily: 4,
        voltage: 24,
      },
    ];
    base.brandPreferences = { charger: "x", battery: null, solar: null };
    base.customOverrides = { ...base.customOverrides, inverter: 2000 };

    const input = randomizeAlgorithmTestFilters(base);

    expect(input.systemVoltage).toBe(24);
    expect(input.vehicleVoltage).toBe(24);
    expect(input.batteryPreference).toBe("agm");
    expect(input.energySources).toEqual(["solar", "shore_power"]);
    expect(input.roofModuleType).toBe("flexible");
    expect(input.roofAreas).toEqual(base.roofAreas);
    expect(input.solarBags).toEqual(base.solarBags);
    expect(input.consumers).toEqual(base.consumers);
    expect(input.brandPreferences).toEqual(base.brandPreferences);
    expect(input.customOverrides).toEqual(base.customOverrides);
  });

  it("stringifyAlgorithmInput produces parseable JSON object", () => {
    const raw = stringifyAlgorithmInput(randomizeAlgorithmTestFilters(cloneInput(DEFAULT_ALGORITHM_INPUT)));
    const parsedJson = JSON.parse(raw) as unknown;
    const parsed = algorithmInputSchema.safeParse(parsedJson);
    expect(parsed.success).toBe(true);
  });

  it("creates usable variability for quick repeated tests", () => {
    const base = cloneInput(DEFAULT_ALGORITHM_INPUT);
    let found = false;
    for (let i = 0; i < 40; i++) {
      const a = randomizeAlgorithmTestFilters(base);
      const b = randomizeAlgorithmTestFilters(base);
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
