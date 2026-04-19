import { describe, expect, it } from "vitest";

import { FLOW_NARRATIVE_KEYS_USED } from "@/components/admin/settings/algorithm-flow-narrative";
import { ALGORITHM_SETTINGS_GROUPS } from "@/components/admin/settings/algorithm-settings-groups";

import { getAllAlgorithmFlowRequiredKeys } from "./algorithm-flow-coverage";

describe("Algorithm-Check narrative coverage", () => {
  it("includes exactly every form field key plus recommendation modes", () => {
    const expected = new Set(getAllAlgorithmFlowRequiredKeys());
    const actual = new Set<string>(FLOW_NARRATIVE_KEYS_USED);
    expect(actual.size).toBe(expected.size);
    for (const k of expected) {
      expect(actual.has(k)).toBe(true);
    }
    for (const k of actual) {
      expect(expected.has(k)).toBe(true);
    }
  });

  it("has no duplicate keys in FLOW_NARRATIVE_KEYS_USED", () => {
    const seen = new Set<string>();
    for (const k of FLOW_NARRATIVE_KEYS_USED) {
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
  });

  it("form groups have no duplicate field keys", () => {
    const seen = new Set<string>();
    for (const g of ALGORITHM_SETTINGS_GROUPS) {
      for (const f of g.fields) {
        expect(seen.has(f.key)).toBe(false);
        seen.add(f.key);
      }
    }
  });
});
