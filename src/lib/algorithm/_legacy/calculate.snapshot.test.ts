import { describe, expect, it } from "vitest";

import { calculateRequirements } from "./calculate";
import type { AlgorithmInput } from "./types";
import { DEFAULT_ALGORITHM_INPUT, DEFAULT_CUSTOM_OVERRIDES } from "./types";

/** Deterministische Eingabe für Regression (keine Zufallswerte, keine 999-Autarkie → kein console.warn). */
function goldenAlgorithmInput(): AlgorithmInput {
  return {
    ...DEFAULT_ALGORITHM_INPUT,
    energySources: ["solar"],
    roofModuleType: "rigid",
    roofAreas: [{ id: "roof-1", name: "Dach", length: 300, width: 200 }],
    solarBags: [],
    consumers: [{ id: "c-1", name: "LED", power: 40, daily: 4, voltage: 12 }],
    simultaneousLoad: "moderate",
    travelBehavior: {
      season: "summer",
      tripDuration: "week",
      winterLocation: "germany",
      standingDuration: "medium",
    },
    autarchyDays: 6,
    customOverrides: { ...DEFAULT_CUSTOM_OVERRIDES },
  };
}

describe("calculateRequirements (golden)", () => {
  it("matches snapshot for fixed fixture input", () => {
    const output = calculateRequirements(goldenAlgorithmInput());
    expect(output).toMatchSnapshot();
  });
});
