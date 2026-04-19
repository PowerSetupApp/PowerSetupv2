import { describe, expect, it } from "vitest";

import { decimalToNumber, decimalToNumberOrZero } from "./money";

describe("decimalToNumber", () => {
  it("returns null for null/undefined", () => {
    expect(decimalToNumber(null)).toBeNull();
    expect(decimalToNumber(undefined)).toBeNull();
  });

  it("returns number for plain numbers", () => {
    expect(decimalToNumber(12.34)).toBe(12.34);
    expect(decimalToNumber(0)).toBe(0);
  });

  it("returns null for non-finite numbers", () => {
    expect(decimalToNumber(Number.POSITIVE_INFINITY)).toBeNull();
    expect(decimalToNumber(Number.NaN)).toBeNull();
  });

  it("calls toNumber() on Decimal-like objects", () => {
    const fake = { toNumber: () => 99.99 };
    expect(decimalToNumber(fake)).toBe(99.99);
  });

  it("guards against Decimal returning non-finite", () => {
    const fake = { toNumber: () => Number.NaN };
    expect(decimalToNumber(fake)).toBeNull();
  });
});

describe("decimalToNumberOrZero", () => {
  it("falls back to 0", () => {
    expect(decimalToNumberOrZero(null)).toBe(0);
    expect(decimalToNumberOrZero(undefined)).toBe(0);
    expect(decimalToNumberOrZero({ toNumber: () => Number.NaN })).toBe(0);
  });

  it("returns the value otherwise", () => {
    expect(decimalToNumberOrZero(42)).toBe(42);
    expect(decimalToNumberOrZero({ toNumber: () => 7.5 })).toBe(7.5);
  });
});
