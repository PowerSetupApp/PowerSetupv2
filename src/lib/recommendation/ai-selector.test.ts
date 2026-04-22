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

function prefilter(ids: {
  battery: string[];
  solar: string[];
  inverter: string[];
  controller: string[];
  cable: string[];
  other: string[];
}): PrefilterResult {
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

  it("maps an unknown bucket string to other (tolerant parse)", () => {
    const selections = parseProductSelectionJson(
      JSON.stringify({
        selections: [{ productId: "p1", bucket: "laser", reasonDe: "x" }],
      }),
    );
    expect(selections).toEqual([{ productId: "p1", bucket: "other", reasonDe: "x" }]);
  });

  it("accepts markdown-fenced JSON and the key selection (not only selections)", () => {
    const text = [
      "Hier die Auswahl:",
      "```json",
      JSON.stringify({
        selection: [{ productId: "p1", bucket: "Batterie", reasonDe: "passt" }],
      }),
      "```",
    ].join("\n");
    const selections = parseProductSelectionJson(text);
    expect(selections[0]).toEqual({ productId: "p1", bucket: "battery", reasonDe: "passt" });
  });

  it("parses Admin-JSON with productGroups and reason (not reasonDe)", () => {
    const selections = parseProductSelectionJson(
      JSON.stringify({
        productGroups: {
          batterie: [{ productId: "b1", reason: "Kapazität passt", isRecommended: true }],
          wechselrichter: [{ productId: "i1", reason: "Leistung ok", isRecommended: true }],
        },
      }),
    );
    expect(selections).toEqual([
      { productId: "b1", bucket: "battery", reasonDe: "Kapazität passt" },
      { productId: "i1", bucket: "inverter", reasonDe: "Leistung ok" },
    ]);
  });

  it("prefers non-empty selections array over empty productGroups", () => {
    const selections = parseProductSelectionJson(
      JSON.stringify({
        selections: [{ productId: "x1", bucket: "battery", reasonDe: "primär" }],
        productGroups: {},
      }),
    );
    expect(selections).toHaveLength(1);
    expect(selections[0]?.productId).toBe("x1");
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
