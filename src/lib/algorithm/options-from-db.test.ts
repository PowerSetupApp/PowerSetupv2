import { describe, expect, it } from "vitest";

import { mergeAlgorithmTuning } from "./algorithm-tuning";
import { algorithmSettingsToComputeOptions } from "./options-from-db";

describe("algorithmSettingsToComputeOptions", () => {
  it("returns empty partial for null (code defaults)", () => {
    const opts = algorithmSettingsToComputeOptions(null);
    expect(mergeAlgorithmTuning(opts)).toEqual(mergeAlgorithmTuning({}));
  });

  it("maps scalar overrides from a row-like object", () => {
    const opts = algorithmSettingsToComputeOptions({
      id: "default",
      batterySafetyFactor: 1.5,
      maxAutarchyDays: null,
    } as never);
    expect(opts.batterySafetyFactor).toBe(1.5);
    const tuning = mergeAlgorithmTuning(opts);
    expect(tuning.batterySafetyFactor).toBe(1.5);
  });
});
