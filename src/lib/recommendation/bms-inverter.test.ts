import { mergeAlgorithmTuning } from "@/lib/algorithm/algorithm-tuning";
import { computeAlgorithm } from "@/lib/algorithm";
import { DEFAULT_ALGORITHM_INPUT } from "@/lib/algorithm/types";
import { describe, expect, it } from "vitest";

import { requiredInverterDischargeA } from "./bms-inverter";

describe("requiredInverterDischargeA", () => {
  const tuning = mergeAlgorithmTuning({});

  it("gibt 0 ohne Wechselrichterbedarf", () => {
    const c = computeAlgorithm({
      ...DEFAULT_ALGORITHM_INPUT,
      systemVoltage: 24,
      energySources: ["solar"],
      consumers: [{ id: "c1", name: "LED", power: 10, daily: 4, voltage: 12 }],
    });
    expect(c.inverter.needed).toBe(false);
    expect(requiredInverterDischargeA(c, tuning)).toBe(0);
  });

  it("I_dc = recommendedW / (U * η) — Gleichzeitigkeit steckt in recommendedW", () => {
    const c = computeAlgorithm({
      ...DEFAULT_ALGORITHM_INPUT,
      systemVoltage: 24,
      energySources: ["solar"],
      simultaneousLoad: "low",
      consumers: [{ id: "k", name: "Kühl", power: 400, daily: 8, voltage: 230 }],
    });
    expect(c.battery.voltage).toBe(24);
    expect(c.inverter.needed).toBe(true);
    const iDc = requiredInverterDischargeA(c, tuning);
    expect(iDc).toBeCloseTo(c.inverter.recommendedW / (24 * tuning.inverterEfficiency), 9);
  });
});
