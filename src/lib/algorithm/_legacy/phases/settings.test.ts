import { describe, expect, it } from "vitest";

import { DEFAULT_ALGORITHM_INPUT } from "../types";

import { getSetting } from "./settings";

describe("getSetting", () => {
  it("returns fallback when settings are missing", () => {
    expect(getSetting(DEFAULT_ALGORITHM_INPUT, "batterySafetyFactor", 1.2)).toBe(1.2);
  });

  it("uses stored value when provided", () => {
    const input = {
      ...DEFAULT_ALGORITHM_INPUT,
      settings: { batterySafetyFactor: 1.5 },
    };
    expect(getSetting(input, "batterySafetyFactor", 1.2)).toBe(1.5);
  });

  it("falls back when stored value is non-finite", () => {
    const input = {
      ...DEFAULT_ALGORITHM_INPUT,
      settings: { batterySafetyFactor: Number.NaN },
    };
    expect(getSetting(input, "batterySafetyFactor", 1.2)).toBe(1.2);
  });
});
