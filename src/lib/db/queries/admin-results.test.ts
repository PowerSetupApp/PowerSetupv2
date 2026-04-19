import { describe, expect, it } from "vitest";

import { estimateAiCostCents } from "./admin-results";

describe("estimateAiCostCents", () => {
  it("returns null when no pricing is available", () => {
    expect(estimateAiCostCents(100, 200, null)).toBeNull();
  });

  it("returns 0 when both token counts are 0", () => {
    expect(
      estimateAiCostCents(0, 0, { inputPrice: 0.000002, outputPrice: 0.000008 }),
    ).toBe(0);
  });

  it("returns null when tokens are null", () => {
    expect(estimateAiCostCents(null, null, { inputPrice: 0.000002, outputPrice: 0.000008 })).toBeNull();
  });

  it("calculates cents correctly for positive tokens", () => {
    // 1_000_000 * 0.000002 USD/token = 2 USD input, 500_000 * 0.000008 = 4 USD output → 6 USD → 600 cents.
    expect(estimateAiCostCents(1_000_000, 500_000, { inputPrice: 0.000002, outputPrice: 0.000008 })).toBe(600);
  });

  it("rounds to nearest cent", () => {
    // 3333 * 0.000002 = 0.006666 → 0 cent; 3334 * 0.000002 = 0.006668 → 1 cent.
    const cents = estimateAiCostCents(
      333_334,
      0,
      { inputPrice: 0.000002, outputPrice: 0 },
    );
    expect(cents).toBe(67);
  });
});
