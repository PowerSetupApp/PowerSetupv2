import { describe, expect, it } from "vitest";

import {
  isDcShoreChargerCategorySlug,
  isIncompleteCategoryFilterValues,
  isSolarChargerSlug,
  productMissingAlgorithmDimensionSpec,
} from "./admin-catalog-product-completeness";

describe("isSolarChargerSlug", () => {
  it("detects solar/mppt/pv slugs", () => {
    expect(isSolarChargerSlug("solar-charger")).toBe(true);
    expect(isSolarChargerSlug("MPPT-foo")).toBe(true);
    expect(isSolarChargerSlug("pv-regler")).toBe(true);
    expect(isSolarChargerSlug("shore-charger")).toBe(false);
  });
});

describe("isDcShoreChargerCategorySlug", () => {
  it("is charger but not solar-class slug", () => {
    expect(isDcShoreChargerCategorySlug("battery-charger")).toBe(true);
    expect(isDcShoreChargerCategorySlug("solar-charger")).toBe(false);
  });
});

describe("isIncompleteCategoryFilterValues", () => {
  it("ignores brand key", () => {
    expect(
      isIncompleteCategoryFilterValues(["brand", "voltage"], { brand: "x", voltage: "12" }),
    ).toBe(false);
  });

  it("requires non-brand keys present and non-empty", () => {
    expect(isIncompleteCategoryFilterValues(["voltage"], {})).toBe(true);
    expect(isIncompleteCategoryFilterValues(["voltage"], { voltage: "" })).toBe(true);
    expect(isIncompleteCategoryFilterValues(["voltage"], { voltage: "12" })).toBe(false);
    expect(isIncompleteCategoryFilterValues(["tags"], { tags: [] })).toBe(true);
  });

  it("empty filter list is complete", () => {
    expect(isIncompleteCategoryFilterValues([], { anything: null })).toBe(false);
  });
});

describe("productMissingAlgorithmDimensionSpec", () => {
  it("flags inverter without powerW", () => {
    expect(
      productMissingAlgorithmDimensionSpec({
        categorySlug: "wechselrichter-12v",
        powerW: null,
        currentA: 10,
        crossSectionMm2: 16,
      }),
    ).toBe(true);
  });

  it("flags cable without cross section", () => {
    expect(
      productMissingAlgorithmDimensionSpec({
        categorySlug: "kabel-rot",
        powerW: 1000,
        currentA: 10,
        crossSectionMm2: null,
      }),
    ).toBe(true);
  });

  it("does not flag unrelated category", () => {
    expect(
      productMissingAlgorithmDimensionSpec({
        categorySlug: "batterie",
        powerW: null,
        currentA: null,
        crossSectionMm2: null,
      }),
    ).toBe(false);
  });
});
