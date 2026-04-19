import { describe, expect, it } from "vitest";

import { addResultRetention, hasPersistedGeneration, isResultExpired } from "./result-helpers";

describe("result-helpers", () => {
  it("addResultRetention is ~30 days ahead", () => {
    const base = new Date("2026-01-01T12:00:00.000Z");
    const exp = addResultRetention(base);
    const diffMs = exp.getTime() - base.getTime();
    const days = diffMs / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThanOrEqual(29.9);
    expect(days).toBeLessThanOrEqual(30.1);
  });

  it("isResultExpired when expiresAt in the past", () => {
    expect(isResultExpired(new Date("2020-01-01"))).toBe(true);
    expect(isResultExpired(new Date(Date.now() + 60_000))).toBe(false);
  });

  it("hasPersistedGeneration when calculations and prefilter snapshot exist", () => {
    expect(hasPersistedGeneration({ calculations: null, recommendations: null })).toBe(false);
    expect(hasPersistedGeneration({ calculations: {}, recommendations: null })).toBe(false);
    expect(
      hasPersistedGeneration({
        calculations: { battery: {}, solar: {} },
        recommendations: { b: 2 },
      }),
    ).toBe(false);
    expect(
      hasPersistedGeneration({
        calculations: { battery: {}, solar: {} },
        recommendations: { prefilter: {} },
      }),
    ).toBe(true);
  });
});
