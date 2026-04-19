import { describe, expect, it } from "vitest";

import type { AlgorithmSettings } from "@/generated/prisma/client";

import { mergeAlgorithmSettings, normalizeSettingsRow } from "./settings-adapter";
import { DEFAULT_ALGORITHM_INPUT } from "./types";

/** Minimales Prisma-Row-Fixture — alle Spalten so gesetzt, wie Prisma sie liefern würde. */
function fixtureRow(overrides: Partial<AlgorithmSettings> = {}): AlgorithmSettings {
  return {
    id: "default",
    dodLifepo4: 0.95,
    dodAgm: 0.5,
    dodGel: 0.5,
    simultaneousLow: 0.3,
    simultaneousModerate: 0.5,
    simultaneousHigh: 0.8,
    alternatorStandard: 30,
    alternatorEnhanced: 90,
    alternatorDriveHours: 2,
    boosterEfficiency: 0.95,
    batterySafetyFactor: 1.2,
    solarSafetyFactor: 1.1,
    standingDaysShort: 2,
    standingDaysMedium: 5,
    standingDaysLong: 8,
    maxBackupDays: 5,
    wpPerM2Rigid: 235,
    wpPerM2Flexible: 180,
    cloudyYieldFactor: 0.3,
    cloudyYieldFactorSummer: 0.5,
    cloudyYieldFactorWinter: 0.2,
    recommendedSolarYieldFactor: 1.2,
    solarSystemEfficiency: 0.85,
    maxPortableWp: 400,
    roofUtilizationFactor: 0.8,
    roofOrientationFactor: 0.85,
    portableOrientationFactor: 1,
    sunHoursSummer: 5,
    sunHoursAllYear: 3.5,
    sunHoursWinter: 2,
    locationGermanyAlps: 0.8,
    locationSouthernEurope: 1.2,
    locationScandinavia: 0.6,
    locationEastern: 0.9,
    locationVaries: 1,
    dutyCycleCompressor: 0.35,
    dutyCycleAbsorber: 0.7,
    inverterClasses: "500,800,1000",
    chargerClasses: "10,20,30",
    chargerTimeHoursSlow: 12,
    chargerTimeHoursNormal: 8,
    chargerTimeHoursFast: 5,
    chargerAbsorptionOverhead: 0.15,
    solarControllerClasses: "10,20,30",
    cableSizes: "6,10,16",
    voltageDropCritical: 2,
    voltageDropNormal: 3,
    voltageDropSolar: 3,
    copperResistivity: 0.0178,
    minPreselectionScore: 30,
    productSelectionMode: "algorithm",
    reasonGenerationMode: "algorithm",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("normalizeSettingsRow", () => {
  it("returns empty objects for null row (fallback path intact)", () => {
    const { settings, componentClasses } = normalizeSettingsRow(null);
    expect(settings).toEqual({});
    expect(componentClasses).toEqual({});
  });

  it("konvertiert Spannungsabfälle von Prozent zu Bruch", () => {
    const { settings } = normalizeSettingsRow(fixtureRow());
    expect(settings.voltageDropCritical).toBeCloseTo(0.02);
    expect(settings.voltageDropNormal).toBeCloseTo(0.03);
    expect(settings.voltageDropSolar).toBeCloseTo(0.03);
  });

  it("übernimmt Faktoren ohne Umrechnung (bereits als Bruch gespeichert)", () => {
    const { settings } = normalizeSettingsRow(fixtureRow());
    expect(settings.dodLifepo4).toBe(0.95);
    expect(settings.simultaneousModerate).toBe(0.5);
    expect(settings.recommendedSolarYieldFactor).toBe(1.2);
    expect(settings.copperResistivity).toBe(0.0178);
  });

  it("parst CSV-Klassen in sortierte number-Arrays", () => {
    const row = fixtureRow({
      inverterClasses: "3000, 500,1000",
      cableSizes: "10,6,1.5",
      solarControllerClasses: "",
      chargerClasses: "30",
    });
    const { componentClasses } = normalizeSettingsRow(row);
    expect(componentClasses.inverter).toEqual([500, 1000, 3000]);
    expect(componentClasses.cable).toEqual([1.5, 6, 10]);
    expect(componentClasses.charger).toEqual([30]);
    expect(componentClasses.solarController).toBeUndefined();
  });

  it("dropt undefined/non-finite-Werte, damit getSetting auf Fallback fällt", () => {
    const { settings } = normalizeSettingsRow(fixtureRow({ dodLifepo4: Number.NaN as unknown as number }));
    expect(settings).not.toHaveProperty("dodLifepo4");
  });
});

describe("mergeAlgorithmSettings", () => {
  it("merged DB-Row in Input, ohne Input-Overrides zu überschreiben", () => {
    const input = {
      ...DEFAULT_ALGORITHM_INPUT,
      settings: { dodLifepo4: 0.99 },
    };
    const merged = mergeAlgorithmSettings(input, fixtureRow());
    expect(merged.settings?.dodLifepo4).toBe(0.99); // Input-Override gewinnt
    expect(merged.settings?.batterySafetyFactor).toBe(1.2); // DB-Wert greift
    expect(merged.componentClasses?.inverter).toEqual([500, 800, 1000]);
  });

  it("bleibt No-Op wenn kein Row vorhanden", () => {
    const input = { ...DEFAULT_ALGORITHM_INPUT };
    const merged = mergeAlgorithmSettings(input, null);
    expect(merged.settings).toEqual({});
    expect(merged.componentClasses).toEqual({});
  });
});
