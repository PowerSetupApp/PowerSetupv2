import { describe, expect, it } from "vitest";

import { DEFAULT_ALGORITHM_INPUT } from "@/lib/algorithm/types";

import { algorithmInputSchema } from "./wizard-input";

describe("algorithmInputSchema", () => {
  it("accepts the shipped default input", () => {
    const result = algorithmInputSchema.safeParse(DEFAULT_ALGORITHM_INPUT);
    expect(result.success).toBe(true);
  });

  it("rejects negative consumer power", () => {
    const bad = structuredClone(DEFAULT_ALGORITHM_INPUT);
    bad.consumers = [
      { id: "c1", name: "x", power: -1, daily: 1, voltage: 12 },
    ];
    expect(algorithmInputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects absurdly high solar bag power", () => {
    const bad = structuredClone(DEFAULT_ALGORITHM_INPUT);
    bad.solarBags = [{ id: "s1", power: 1_000_000 }];
    expect(algorithmInputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects NaN cable length", () => {
    const bad = structuredClone(DEFAULT_ALGORITHM_INPUT);
    bad.cableLengths = {
      ...bad.cableLengths,
      starterToService: Number.NaN,
    };
    expect(algorithmInputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects daily hours > 24", () => {
    const bad = structuredClone(DEFAULT_ALGORITHM_INPUT);
    bad.consumers = [{ id: "c1", name: "x", power: 10, daily: 48, voltage: 12 }];
    expect(algorithmInputSchema.safeParse(bad).success).toBe(false);
  });

  it("accepts null overrides", () => {
    const ok = structuredClone(DEFAULT_ALGORITHM_INPUT);
    ok.customOverrides = {
      battery: null,
      solar: null,
      booster: null,
      controller: null,
      inverter: null,
      charger: null,
    };
    expect(algorithmInputSchema.safeParse(ok).success).toBe(true);
  });

  it("accepts optional consumer catalog metadata", () => {
    const ok = structuredClone(DEFAULT_ALGORITHM_INPUT);
    ok.systemVoltage = 48;
    ok.consumers = [
      {
        id: "c1",
        name: "LED",
        power: 30,
        daily: 2,
        voltage: 48,
        sourceDeviceId: "dev-1",
        deviceIcon: "lightbulb",
        categoryIcon: "zap",
        showHoursField: true,
        dailyStep: 0.5,
      },
    ];
    expect(algorithmInputSchema.safeParse(ok).success).toBe(true);
  });
});
