import { describe, expect, it } from "vitest";

import { calculateRequirements } from "./calculate";
import { mergeAlgorithmSettings } from "./settings-adapter";
import { createTrace, tracedGetSetting } from "./trace";
import { DEFAULT_ALGORITHM_INPUT, type AlgorithmInput } from "./types";

function baseInput(overrides: Partial<AlgorithmInput> = {}): AlgorithmInput {
  return {
    ...DEFAULT_ALGORITHM_INPUT,
    energySources: ["solar"],
    roofModuleType: "rigid",
    roofAreas: [{ id: "roof-1", name: "Dach", length: 300, width: 200 }],
    consumers: [{ id: "c-1", name: "LED", power: 40, daily: 4, voltage: 12 }],
    ...overrides,
  };
}

describe("AlgorithmTrace / tracedGetSetting", () => {
  it("returns fallback when no trace provided", () => {
    const input = baseInput();
    const val = tracedGetSetting(input, "batterySafetyFactor", 1.2, "battery");
    expect(val).toBe(1.2);
  });

  it("records provenance = 'db' when value comes from the DB snapshot", () => {
    const trace = createTrace();
    trace.dbSettings = { batterySafetyFactor: 1.5 };
    trace.inputOverrides = {};
    const input: AlgorithmInput = { ...baseInput(), settings: { batterySafetyFactor: 1.5 } };
    const val = tracedGetSetting(input, "batterySafetyFactor", 1.2, "battery", trace);
    expect(val).toBe(1.5);
    expect(trace.constants).toHaveLength(1);
    expect(trace.constants[0]).toMatchObject({
      key: "batterySafetyFactor",
      value: 1.5,
      fallback: 1.2,
      dbValue: 1.5,
      source: "db",
    });
  });

  it("records provenance = 'input-override' when override beats DB", () => {
    const trace = createTrace();
    trace.dbSettings = { batterySafetyFactor: 1.5 };
    trace.inputOverrides = { batterySafetyFactor: 1.8 };
    const input: AlgorithmInput = { ...baseInput(), settings: { batterySafetyFactor: 1.8 } };
    tracedGetSetting(input, "batterySafetyFactor", 1.2, "battery", trace);
    expect(trace.constants[0].source).toBe("input-override");
  });

  it("records provenance = 'fallback' when neither DB nor override have the key", () => {
    const trace = createTrace();
    trace.dbSettings = {};
    trace.inputOverrides = {};
    const input = baseInput();
    const val = tracedGetSetting(input, "batterySafetyFactor", 1.2, "battery", trace);
    expect(val).toBe(1.2);
    expect(trace.constants[0].source).toBe("fallback");
  });

  it("does not duplicate the same constant within a phase", () => {
    const trace = createTrace();
    trace.dbSettings = { batterySafetyFactor: 1.5 };
    trace.inputOverrides = {};
    const input: AlgorithmInput = { ...baseInput(), settings: { batterySafetyFactor: 1.5 } };
    tracedGetSetting(input, "batterySafetyFactor", 1.2, "battery", trace);
    tracedGetSetting(input, "batterySafetyFactor", 1.2, "battery", trace);
    expect(trace.constants).toHaveLength(1);
  });
});

describe("mergeAlgorithmSettings with trace", () => {
  it("attaches DB + override snapshots to the trace", () => {
    const trace = createTrace();
    const input: AlgorithmInput = { ...baseInput(), settings: { dodLifepo4: 0.99 } };
    mergeAlgorithmSettings(
      input,
      {
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
        inverterClasses: "500,1000",
        chargerClasses: "10,20",
        chargerTimeHoursSlow: 12,
        chargerTimeHoursNormal: 8,
        chargerTimeHoursFast: 5,
        solarControllerClasses: "10,20",
        cableSizes: "6,10",
        voltageDropCritical: 2,
        voltageDropNormal: 3,
        voltageDropSolar: 3,
        copperResistivity: 0.0178,
        minPreselectionScore: 30,
        productSelectionMode: "algorithm",
        reasonGenerationMode: "algorithm",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-04-18T00:00:00.000Z"),
      } as never,
      trace,
    );
    expect(trace.meta.hasDbRow).toBe(true);
    expect(trace.meta.dbUpdatedAt).toBe("2026-04-18T00:00:00.000Z");
    expect(trace.dbSettings?.batterySafetyFactor).toBe(1.2);
    expect(trace.inputOverrides?.dodLifepo4).toBe(0.99);
  });
});

describe("calculateRequirements with trace", () => {
  it("pushes at least one step per phase and records constants", () => {
    const trace = createTrace();
    trace.dbSettings = { dodLifepo4: 0.95, batterySafetyFactor: 1.2 };
    trace.inputOverrides = {};
    const input: AlgorithmInput = {
      ...baseInput(),
      settings: { dodLifepo4: 0.95, batterySafetyFactor: 1.2 },
    };
    calculateRequirements(input, trace);
    expect(trace.steps.some((s) => s.phase === "energy")).toBe(true);
    expect(trace.steps.some((s) => s.phase === "solar")).toBe(true);
    expect(trace.steps.some((s) => s.phase === "battery")).toBe(true);
    expect(trace.steps.some((s) => s.phase === "controller")).toBe(true);
    expect(trace.constants.some((c) => c.key === "dodLifepo4")).toBe(true);
  });

  it("behaves identically without a trace (existing snapshot path)", () => {
    const input = baseInput();
    const a = calculateRequirements(input);
    const b = calculateRequirements(input);
    expect(a).toEqual(b);
  });
});
