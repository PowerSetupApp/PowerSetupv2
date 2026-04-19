import { describe, expect, it } from "vitest";

import { parseProductSelectionJson, validateAISelections } from "./ai-selector";
import type { AISelectionItem, PrefilterResult, ScoredProduct } from "./types";

function scored(id: string, bucket: ScoredProduct["bucket"]): ScoredProduct {
  return {
    productId: id,
    bucket,
    score: 1,
    categorySlug: bucket,
    name: id,
  };
}

function prefilter(ids: Record<keyof PrefilterResult, string[]>): PrefilterResult {
  return {
    battery: ids.battery.map((id) => scored(id, "battery")),
    solar: ids.solar.map((id) => scored(id, "solar")),
    inverter: ids.inverter.map((id) => scored(id, "inverter")),
    controller: ids.controller.map((id) => scored(id, "controller")),
    cable: ids.cable.map((id) => scored(id, "cable")),
    other: ids.other.map((id) => scored(id, "other")),
  };
}

describe("parseProductSelectionJson", () => {
  it("parses a valid response", () => {
    const selections = parseProductSelectionJson(
      JSON.stringify({
        selections: [{ productId: "p1", bucket: "battery", reasonDe: "weil" }],
      }),
    );
    expect(selections).toHaveLength(1);
    expect(selections[0]?.productId).toBe("p1");
  });

  it("throws on unknown bucket", () => {
    expect(() =>
      parseProductSelectionJson(
        JSON.stringify({
          selections: [{ productId: "p1", bucket: "laser", reasonDe: "x" }],
        }),
      ),
    ).toThrow();
  });
});

describe("validateAISelections", () => {
  const pref = prefilter({
    battery: ["b1"],
    solar: ["s1", "s2"],
    inverter: [],
    controller: [],
    cable: [],
    other: [],
  });

  it("keeps selections whose ID exists in prefilter", () => {
    const selections: AISelectionItem[] = [
      { productId: "b1", bucket: "battery", reasonDe: "ok" },
      { productId: "s2", bucket: "solar", reasonDe: "ok" },
    ];
    expect(validateAISelections(selections, pref)).toEqual(selections);
  });

  it("drops hallucinated IDs", () => {
    const selections: AISelectionItem[] = [
      { productId: "b1", bucket: "battery", reasonDe: "real" },
      { productId: "ghost", bucket: "solar", reasonDe: "nope" },
    ];
    const result = validateAISelections(selections, pref);
    expect(result.map((s) => s.productId)).toEqual(["b1"]);
  });

  it("returns empty array if every selection is invalid", () => {
    const selections: AISelectionItem[] = [
      { productId: "x", bucket: "battery", reasonDe: "n" },
    ];
    expect(validateAISelections(selections, pref)).toEqual([]);
  });
});
