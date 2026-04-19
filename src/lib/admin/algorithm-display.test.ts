import { describe, expect, it } from "vitest";

import { dodFractionToPercent, dodPercentToFraction } from "./algorithm-display";

describe("dodFractionToPercent / dodPercentToFraction", () => {
  it("round-trips typical DoD values", () => {
    expect(dodFractionToPercent(0.95)).toBe(95);
    expect(dodPercentToFraction(95)).toBe(0.95);
    expect(dodFractionToPercent(0.5)).toBe(50);
    expect(dodPercentToFraction(50)).toBe(0.5);
  });

  it("clamps percent input to 0–100", () => {
    expect(dodPercentToFraction(150)).toBe(1);
    expect(dodPercentToFraction(-10)).toBe(0);
  });
});
