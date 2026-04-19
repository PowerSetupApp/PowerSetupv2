import { describe, expect, it } from "vitest";

import { computeAlgorithm } from "@/lib/algorithm";
import { DEFAULT_ALGORITHM_INPUT, type AlgorithmInput } from "@/lib/algorithm/types";
import { runAlgorithm } from "@/lib/results/run-algorithm";

import { runAlgorithmPreview } from "./algorithm-preview";

describe("runAlgorithmPreview", () => {
  it("matches the same pipeline as live flow (runAlgorithm with explain)", () => {
    const input: AlgorithmInput = {
      ...DEFAULT_ALGORITHM_INPUT,
      energySources: ["solar", "alternator"],
      consumers: [{ id: "c1", name: "Induktion", power: 3000, daily: 1, voltage: 230, averageLoadPercent: 33 }],
    };

    const viaPreview = runAlgorithmPreview(input);
    const expectedOutput = runAlgorithm(input, { explain: true });

    expect(viaPreview.output).toEqual(expectedOutput);
    expect(viaPreview.breakdown).toEqual(expectedOutput.breakdown);
  });

  it("returns a breakdown dict when explain mode is active", () => {
    const viaPreview = runAlgorithmPreview(DEFAULT_ALGORITHM_INPUT);
    expect(viaPreview.breakdown).toBeDefined();
    expect(typeof viaPreview.breakdown).toBe("object");
  });

  it("produces the same numbers as `computeAlgorithm` for the pure surface", () => {
    const input: AlgorithmInput = {
      ...DEFAULT_ALGORITHM_INPUT,
      energySources: ["solar"],
    };
    const viaPreview = runAlgorithmPreview(input);
    const pure = computeAlgorithm(input, { explain: true });
    expect(viaPreview.output.battery.recommendedCapacityAh).toBe(pure.battery.recommendedCapacityAh);
    expect(viaPreview.output.solar.requiredWp).toBe(pure.solar.requiredWp);
  });
});
