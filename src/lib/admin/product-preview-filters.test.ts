import { describe, expect, it } from "vitest";

import { buildProductPreviewFilterRows, type ProductPreviewCategoryFilter } from "./product-preview-filters";

const filters: ProductPreviewCategoryFilter[] = [
  { key: "slots", name: "Anzahl Steckplätze", type: "number", unit: null, sortOrder: 2 },
  { key: "fuse", name: "Fassung", type: "select", unit: null, sortOrder: 1 },
];

describe("buildProductPreviewFilterRows", () => {
  it("orders rows by category filter sortOrder, not object key order", () => {
    const rows = buildProductPreviewFilterRows({ fuse: "ATO", slots: 12 }, filters);
    expect(rows.map((r) => ({ ...r, origin: r.origin }))).toEqual([
      { label: "Fassung", value: "ATO", origin: "defined" },
      { label: "Anzahl Steckplätze", value: "12", origin: "defined" },
    ]);
  });

  it("omits brand / brandId / marke from JSON (shown via Product.brand relation)", () => {
    const rows = buildProductPreviewFilterRows(
      { brand: "9aa38266-fee3-4f4d-ac3a-8e1c6b5009fd", brandId: "x", marke: "y", slots: 2 },
      filters,
    );
    expect(rows.map((r) => r.label)).toEqual(["Anzahl Steckplätze"]);
    expect(rows[0].value).toBe("2");
  });

  it("lists extra JSON keys with German legacy label or Zusatzfeld fallback", () => {
    const rows = buildProductPreviewFilterRows({ legacyKey: "x", maxChargeA: 200, slots: 3 }, filters);
    expect(rows.find((r) => r.label === "Anzahl Steckplätze")?.value).toBe("3");
    const extra = rows.filter((r) => r.origin === "extra");
    expect(extra.map((r) => r.label)).toContain('Zusatzfeld „legacyKey“');
    expect(extra.find((r) => r.label === "Max. Ladestrom")?.value).toBe("200");
  });

  it("returns empty array for null, undefined, arrays, and primitives", () => {
    expect(buildProductPreviewFilterRows(null, filters)).toEqual([]);
    expect(buildProductPreviewFilterRows(undefined, filters)).toEqual([]);
    expect(buildProductPreviewFilterRows([], filters)).toEqual([]);
    expect(buildProductPreviewFilterRows("nope", filters)).toEqual([]);
    expect(buildProductPreviewFilterRows(1, filters)).toEqual([]);
  });

  it("appends unit in parentheses when set", () => {
    const withUnit: ProductPreviewCategoryFilter[] = [
      { key: "w", name: "Leistung", type: "number", unit: "W", sortOrder: 0 },
    ];
    const rows = buildProductPreviewFilterRows({ w: 100 }, withUnit);
    expect(rows).toEqual([{ label: "Leistung", value: "100 (W)", origin: "defined" }]);
  });

  it("formats booleans and arrays", () => {
    const f: ProductPreviewCategoryFilter[] = [
      { key: "a", name: "A", type: "boolean", unit: null, sortOrder: 0 },
      { key: "b", name: "B", type: "multiselect", unit: null, sortOrder: 1 },
    ];
    const rows = buildProductPreviewFilterRows({ a: false, b: ["1", "2"] }, f);
    expect(rows.find((r) => r.label === "A")?.value).toBe("Nein");
    expect(rows.find((r) => r.label === "B")?.value).toBe("1, 2");
  });
});
