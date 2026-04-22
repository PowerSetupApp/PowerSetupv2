import { describe, expect, it } from "vitest";

import { ambientTempDerateFactor, minStandardMm2ForDesignCurrentA } from "./cable-ampacity";

describe("ambientTempDerateFactor", () => {
  it("is 1 at or below 30 °C", () => {
    expect(ambientTempDerateFactor(20)).toBe(1);
    expect(ambientTempDerateFactor(30)).toBe(1);
  });

  it("interpolates between 30 and 40 °C", () => {
    expect(ambientTempDerateFactor(35)).toBeCloseTo(0.935, 3);
    expect(ambientTempDerateFactor(40)).toBeCloseTo(0.87, 3);
  });

  it("interpolates between 40 and 50 °C", () => {
    expect(ambientTempDerateFactor(45)).toBeCloseTo(0.79, 3);
    expect(ambientTempDerateFactor(50)).toBeCloseTo(0.71, 3);
  });

  it("clamps at 50 °C for higher temperatures", () => {
    expect(ambientTempDerateFactor(60)).toBeCloseTo(0.71, 3);
  });

  it("returns 1 for non-finite input", () => {
    expect(ambientTempDerateFactor(Number.NaN)).toBe(1);
  });
});

describe("minStandardMm2ForDesignCurrentA", () => {
  it("returns 0 for non-positive design current", () => {
    expect(minStandardMm2ForDesignCurrentA(0, "bundled")).toBe(0);
    expect(minStandardMm2ForDesignCurrentA(-1, "bundled")).toBe(0);
  });

  it("matches bundled table at derate 1", () => {
    expect(minStandardMm2ForDesignCurrentA(124, "bundled", 1)).toBe(35);
  });

  it("requires larger cross-section when derated ampacity is lower", () => {
    // 155 A needs 70 mm² bundled at full table; with 0.87, 50 mm² effective cap = 151*0.87 < 155
    expect(minStandardMm2ForDesignCurrentA(155, "bundled", 0.87)).toBe(70);
  });

  it("treats invalid derateFactor as 1", () => {
    expect(minStandardMm2ForDesignCurrentA(124, "bundled", Number.NaN)).toBe(35);
  });
});
