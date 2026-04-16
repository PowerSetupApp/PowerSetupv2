import { describe, expect, it } from "vitest";

import { getDoD } from "./phases";

describe("algorithm (ported reference)", () => {
  it("getDoD matches chemistry defaults", () => {
    expect(getDoD("lifepo4")).toBeCloseTo(0.95, 5);
    expect(getDoD("agm")).toBeCloseTo(0.5, 5);
    expect(getDoD("gel")).toBeCloseTo(0.5, 5);
  });
});
