import { describe, expect, it } from "vitest";

import { MAX_AUTARCHY_DAYS } from "@/lib/algorithm/constants";

import {
  autarchyPresetFromDays,
  autarchyTopUpProfileFromSources,
  getAutarchyWizardMaxDays,
  presetDaysAdaptive,
} from "./autarchy-ui";

describe("autarchyTopUpProfileFromSources", () => {
  it("classifies empty sources as battery_only", () => {
    expect(autarchyTopUpProfileFromSources([])).toBe("battery_only");
  });

  it("ignores shore_power when classifying (it does not help off-grid)", () => {
    expect(autarchyTopUpProfileFromSources(["shore_power"])).toBe("battery_only");
  });

  it("classifies a single top-up stream as solar_or_alt", () => {
    expect(autarchyTopUpProfileFromSources(["solar"])).toBe("solar_or_alt");
    expect(autarchyTopUpProfileFromSources(["alternator"])).toBe("solar_or_alt");
    expect(autarchyTopUpProfileFromSources(["solar", "shore_power"])).toBe(
      "solar_or_alt",
    );
  });

  it("classifies both streams as solar_and_alt", () => {
    expect(
      autarchyTopUpProfileFromSources(["solar", "alternator"]),
    ).toBe("solar_and_alt");
  });
});

describe("getAutarchyWizardMaxDays", () => {
  it("matches MAX_AUTARCHY_DAYS for every (tripDuration, profile) pair", () => {
    for (const td of ["weekend", "week", "extended", "permanent"] as const) {
      expect(getAutarchyWizardMaxDays(td, [])).toBe(
        MAX_AUTARCHY_DAYS[td].battery_only,
      );
      expect(getAutarchyWizardMaxDays(td, ["solar"])).toBe(
        MAX_AUTARCHY_DAYS[td].solar_or_alt,
      );
      expect(getAutarchyWizardMaxDays(td, ["alternator"])).toBe(
        MAX_AUTARCHY_DAYS[td].solar_or_alt,
      );
      expect(getAutarchyWizardMaxDays(td, ["solar", "alternator"])).toBe(
        MAX_AUTARCHY_DAYS[td].solar_and_alt,
      );
    }
  });

  it("returns 90 for permanent + solar + alternator (legacy 1–90 day ceiling)", () => {
    expect(
      getAutarchyWizardMaxDays("permanent", ["solar", "alternator"]),
    ).toBe(90);
  });
});

describe("presetDaysAdaptive", () => {
  it("scales with maxDays for a wide cap", () => {
    expect(presetDaysAdaptive("weekend", 90)).toBe(2);
    expect(presetDaysAdaptive("holiday", 90)).toBe(Math.round(90 * 0.4));
    expect(presetDaysAdaptive("full", 90)).toBe(Math.round(90 * 0.85));
  });

  it("clamps every preset to the cap when maxDays is small", () => {
    expect(presetDaysAdaptive("weekend", 3)).toBeLessThanOrEqual(3);
    expect(presetDaysAdaptive("holiday", 3)).toBeLessThanOrEqual(3);
    expect(presetDaysAdaptive("full", 3)).toBeLessThanOrEqual(3);
  });

  it("never returns values < 1", () => {
    expect(presetDaysAdaptive("weekend", 1)).toBeGreaterThanOrEqual(1);
    expect(presetDaysAdaptive("holiday", 1)).toBeGreaterThanOrEqual(1);
    expect(presetDaysAdaptive("full", 1)).toBeGreaterThanOrEqual(1);
  });
});

describe("autarchyPresetFromDays", () => {
  it("round-trips the adaptive preset targets for realistic caps", () => {
    // With caps ≥ 7 the three preset targets are strictly ascending and each
    // preset classifies back to itself.
    for (const max of [7, 14, 30, 60, 90]) {
      expect(
        autarchyPresetFromDays(presetDaysAdaptive("weekend", max), max),
      ).toBe("weekend");
      expect(
        autarchyPresetFromDays(presetDaysAdaptive("holiday", max), max),
      ).toBe("holiday");
      expect(
        autarchyPresetFromDays(presetDaysAdaptive("full", max), max),
      ).toBe("full");
    }
  });

  it("classifies the very largest day value as full", () => {
    expect(autarchyPresetFromDays(90, 90)).toBe("full");
  });
});
