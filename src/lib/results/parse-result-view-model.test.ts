import { describe, expect, it } from "vitest";

import { computeAlgorithm } from "@/lib/algorithm";
import { DEFAULT_ALGORITHM_INPUT } from "@/lib/algorithm/types";
import type { ResultRowForPage } from "@/lib/db/queries/results";

import { parseResultViewModel } from "./parse-result-view-model";

describe("parseResultViewModel", () => {
  it("parses a freshly generated snapshot shape", () => {
    const calc = computeAlgorithm({
      ...DEFAULT_ALGORITHM_INPUT,
      energySources: ["solar"],
      consumers: [
        { id: "c1", name: "LED", power: 10, daily: 4, voltage: 12 },
      ],
    });
    const prefilter = {
      battery: [],
      solar: [],
      inverter: [],
      controller: [],
      cable: [],
      other: [],
    };
    const row: ResultRowForPage = {
      id: "x",
      formData: {},
      calculations: calc,
      recommendations: {
        prefilter,
        ai: { selections: [], model: "m", inputTokens: 1, outputTokens: 2 },
      },
      expiresAt: new Date(Date.now() + 86_400_000),
      schematicPdfUrl: null,
      schematicVariant: "professional",
      creditBalance: 0,
      generationStatus: "succeeded",
      generationError: null,
    };
    const vm = parseResultViewModel(row);
    expect(vm.calculations).not.toBeNull();
    expect(vm.prefilter).not.toBeNull();
    expect(vm.aiSelections).toEqual([]);
  });

  it("returns calculations=null for old-shape rows missing battery/solar", () => {
    const row: ResultRowForPage = {
      id: "old",
      formData: {},
      // Legacy-shape `calculations` without battery/solar → treated as stale.
      calculations: { somethingElse: true },
      recommendations: null,
      expiresAt: new Date(Date.now() + 86_400_000),
      schematicPdfUrl: null,
      schematicVariant: "professional",
      creditBalance: 0,
      generationStatus: "succeeded",
      generationError: null,
    };
    const vm = parseResultViewModel(row);
    expect(vm.calculations).toBeNull();
  });
});
