/**
 * Regressions-Tests für die im Algorithmus gefundenen Bugs (Fix 1 – Fix 8).
 *
 * Jede `describe` entspricht exakt einer TODO-ID aus dem Plan:
 *   fix_1_controller, fix_2_required_wp, fix_3_solar_override,
 *   fix_4_alternator, fix_5_battery_shortfall, fix_6_charger_chemistry,
 *   fix_7_fuse_box, fix_8_edge_cases
 *
 * Die Tests sind bewusst auf *Verhalten* fokussiert (Input → Output), nicht auf
 * interne Variablen. So brechen sie nicht, wenn Zwischenberechnungen umgebaut
 * werden, solange die fachliche Regel stabil bleibt.
 */

import { describe, expect, it } from "vitest";

import { calculateRequirements } from "./calculate";
import { calculateBooster } from "./phases/4-booster-sizing";
import { calculateCharger } from "./phases/5-charger-sizing";
import { calculateDailyConsumption } from "./phases/1-energy-demand";
import type {
  AlgorithmInput,
  Consumer,
  SolarBag,
  SolarRecommendation,
} from "./types";
import { DEFAULT_ALGORITHM_INPUT, DEFAULT_CUSTOM_OVERRIDES } from "./types";
import { createTrace } from "./trace";

// ---------------------------------------------------------------------------
// Test-Fixture-Builder — eine einheitliche Basis, die jeder Test mit
// minimalen Overrides aufruft.
// ---------------------------------------------------------------------------
function baseInput(overrides: Partial<AlgorithmInput> = {}): AlgorithmInput {
  return {
    ...DEFAULT_ALGORITHM_INPUT,
    energySources: ["solar"],
    roofModuleType: "rigid",
    roofAreas: [{ id: "r-1", name: "Dach", length: 400, width: 200 }], // 8 m²
    solarBags: [],
    consumers: [{ id: "c-1", name: "Licht", power: 40, daily: 4, voltage: 12 }],
    simultaneousLoad: "moderate",
    travelBehavior: {
      season: "summer",
      tripDuration: "extended",
      winterLocation: "germany",
      standingDuration: "medium",
    },
    autarchyDays: 3,
    customOverrides: { ...DEFAULT_CUSTOM_OVERRIDES },
    ...overrides,
  };
}

// ===========================================================================
// Fix 1 — Controller wird auf total verfügbare Wp dimensioniert (Dach + Portable)
// ===========================================================================
describe("Fix 1 · Solar-Controller sizing on totalAvailableWp", () => {
  it("considers portable solar bags in controller sizing", () => {
    const portableBags: SolarBag[] = [
      { id: "b-1", power: 200 },
      { id: "b-2", power: 200 },
    ];
    const withBags = calculateRequirements(
      baseInput({
        solarBags: portableBags,
        roofAreas: [{ id: "r-1", name: "Dach", length: 200, width: 100 }], // 2 m² → ~ 220 Wp
      }),
    );
    const withoutBags = calculateRequirements(
      baseInput({
        solarBags: [],
        roofAreas: [{ id: "r-1", name: "Dach", length: 200, width: 100 }],
      }),
    );

    expect(withBags.controller.needed).toBe(true);
    expect(withBags.controller.maxInputWp).toBe(withBags.solar.totalAvailableWp);
    expect(withBags.controller.maxInputWp).toBeGreaterThan(withoutBags.controller.maxInputWp);
    expect(withBags.controller.currentA).toBeGreaterThanOrEqual(withoutBags.controller.currentA);
  });
});

// ===========================================================================
// Fix 2 — rawRequiredWp darf `roofOrientationFactor` nicht doppelt einrechnen
// ===========================================================================
describe("Fix 2 · solar.requiredWp doesn't double-count roofOrientationFactor", () => {
  it("requiredWp ≤ maxRoofWp when roof is generously sized for demand", () => {
    const result = calculateRequirements(
      baseInput({
        roofAreas: [{ id: "r-1", name: "Dach", length: 400, width: 200 }],
        consumers: [{ id: "c-1", name: "Licht", power: 40, daily: 4, voltage: 12 }],
      }),
    );
    const solar = result.solar as SolarRecommendation;

    expect(solar.maxRoofWp).toBeGreaterThan(0);
    expect(solar.requiredWp).toBeGreaterThan(0);
    expect(solar.requiredWp).toBeLessThanOrEqual(solar.maxRoofWp);
  });
});

// ===========================================================================
// Fix 3 — Override-Pfad für Solar liefert denselben Wh/Tag wie der Default
// ===========================================================================
describe("Fix 3 · solar yield is symmetric between override and default path", () => {
  it("override with same totalWp yields the same dailySolarYieldWh as default path", () => {
    const defaultRun = calculateRequirements(baseInput());
    const overrideRun = calculateRequirements(
      baseInput({
        customOverrides: {
          ...DEFAULT_CUSTOM_OVERRIDES,
          solar: defaultRun.solar.totalAvailableWp,
        },
      }),
    );

    expect(overrideRun.solar.totalAvailableWp).toBe(defaultRun.solar.totalAvailableWp);
    expect(overrideRun.solar.dailySolarYieldWh).toBe(defaultRun.solar.dailySolarYieldWh);
  });
});

// ===========================================================================
// Fix 4 — Alternator-Wh wird über den Fahr-Zyklus amortisiert, nicht invers
// proportional zu `standingDays`.
// ===========================================================================
describe("Fix 4 · alternator Wh amortization over cycle days", () => {
  function inputWithAlternator(standingDuration: "short" | "medium" | "long"): AlgorithmInput {
    return baseInput({
      energySources: ["alternator"],
      alternatorTier: "standard",
      travelBehavior: {
        season: "summer",
        tripDuration: "extended",
        winterLocation: "germany",
        standingDuration,
      },
    });
  }

  it("longer standing days → strictly smaller daily amortized Wh", () => {
    const shortBooster = calculateBooster(inputWithAlternator("short"), 2);
    const mediumBooster = calculateBooster(inputWithAlternator("medium"), 5);
    const longBooster = calculateBooster(inputWithAlternator("long"), 13);

    expect(shortBooster.dailyAlternatorChargeWh).toBeGreaterThan(
      mediumBooster.dailyAlternatorChargeWh,
    );
    expect(mediumBooster.dailyAlternatorChargeWh).toBeGreaterThan(
      longBooster.dailyAlternatorChargeWh,
    );
  });

  it("amortizes over (standingDays + 1) calendar days", () => {
    const booster = calculateBooster(inputWithAlternator("medium"), 5);
    const fullDriveDayEnergy = booster.dailyAlternatorChargeWh * 6;
    expect(fullDriveDayEnergy).toBeGreaterThan(0);
    const singleDayEnergy = booster.outputCurrentA * 12 * 2;
    expect(Math.abs(fullDriveDayEnergy - singleDayEnergy)).toBeLessThanOrEqual(3);
  });
});

// ===========================================================================
// Fix 5 — Battery-Defizit-Berechnung zählt Cloudy-Shortfall nicht doppelt
// ===========================================================================
describe("Fix 5 · battery deficit does not double-count solar shortfall", () => {
  it("winter preset with low roof area is not wildly over-sized", () => {
    const wintry = calculateRequirements(
      baseInput({
        travelBehavior: {
          season: "winter",
          tripDuration: "extended",
          winterLocation: "germany",
          standingDuration: "medium",
        },
        autarchyDays: 3,
        consumers: [{ id: "c", name: "LED", power: 40, daily: 4, voltage: 12 }],
      }),
    );
    expect(wintry.battery.recommendedCapacityAh).toBeLessThanOrEqual(300);
  });
});

// ===========================================================================
// Fix 6 — Charger sizing respektiert Chemie (DoD) + Absorption-Overhead
// ===========================================================================
describe("Fix 6 · charger current scales with DoD and absorption overhead", () => {
  function shoreInput(
    preference: "lifepo4" | "agm" | "gel",
    overhead?: number,
  ): AlgorithmInput {
    return {
      ...baseInput(),
      energySources: ["shore_power"],
      batteryPreference: preference,
      chargerSpeed: "normal",
      settings:
        typeof overhead === "number"
          ? { chargerAbsorptionOverhead: overhead }
          : undefined,
    };
  }

  it("AGM (DoD 0.5) charger is ≈ roughly half of LiFePO4 (DoD 0.95) for same battery Ah", () => {
    const ah = 200;
    const lfp = calculateCharger(shoreInput("lifepo4"), ah);
    const agm = calculateCharger(shoreInput("agm"), ah);

    expect(lfp.needed).toBe(true);
    expect(agm.needed).toBe(true);
    expect(lfp.targetCurrentA).toBeGreaterThan(agm.targetCurrentA);
    const ratio = agm.targetCurrentA / lfp.targetCurrentA;
    expect(ratio).toBeGreaterThanOrEqual(0.45);
    expect(ratio).toBeLessThanOrEqual(0.65);
  });

  it("higher absorption overhead produces higher target current", () => {
    const low = calculateCharger(shoreInput("lifepo4", 0.0), 100);
    const high = calculateCharger(shoreInput("lifepo4", 0.5), 100);
    expect(high.targetCurrentA).toBeGreaterThan(low.targetCurrentA);
    expect(high.targetCurrentA / low.targetCurrentA).toBeCloseTo(1.5, 1);
  });
});

// ===========================================================================
// Fix 7 — Sicherungskasten-Kabel: Strom kommt aus den realen DC-Verbrauchern
// ===========================================================================
describe("Fix 7 · fuse-box cable current comes from DC consumer sum", () => {
  it("high DC-load scenario sizes fuse-box well beyond the old 30 A default", () => {
    const heavyDc: Consumer[] = [
      { id: "fridge", name: "Kompressor-Kühlschrank", power: 60, daily: 24, voltage: 12, coolingMethod: "compressor" },
      { id: "boiler", name: "Wasserboiler DC", power: 600, daily: 1, voltage: 12 },
      { id: "fan", name: "Dachlüfter", power: 120, daily: 6, voltage: 12 },
      { id: "cooker", name: "Induktionskocher DC", power: 1200, daily: 0.5, voltage: 12 },
    ];
    const result = calculateRequirements(baseInput({ consumers: heavyDc }));
    const fuseBox = result.cables.find((c) => c.route === "battery_to_fuse_box");
    expect(fuseBox).toBeDefined();
    expect(fuseBox?.currentA).toBeGreaterThan(30);
  });

  it("purely 230V load case stays at the 10 A minimum", () => {
    const acOnly: Consumer[] = [
      { id: "kettle", name: "Wasserkocher 230 V", power: 2000, daily: 0.25, voltage: 230 },
    ];
    const result = calculateRequirements(baseInput({ consumers: acOnly }));
    const fuseBox = result.cables.find((c) => c.route === "battery_to_fuse_box");
    expect(fuseBox?.currentA).toBe(10);
  });
});

// ===========================================================================
// Fix 8 — `averageLoadPercent` Edge-Cases (0 %, 100 %) + Trace-Warning bei ≤ 0.
// ===========================================================================
describe("Fix 8 · effectivePowerForDaily edge cases", () => {
  it("100 % behaves like no discount (full nominal power)", () => {
    const consumers: Consumer[] = [
      { id: "a", name: "A", power: 3000, daily: 1, voltage: 230, averageLoadPercent: 100 },
    ];
    expect(calculateDailyConsumption(consumers)).toBe(3000);
  });

  it("0 % falls back to full nominal power and emits a warning to the trace", () => {
    const consumers: Consumer[] = [
      { id: "z", name: "Zerowatt", power: 500, daily: 2, voltage: 230, averageLoadPercent: 0 },
    ];
    const trace = createTrace();
    const wh = calculateDailyConsumption(consumers, undefined, trace);
    expect(wh).toBe(1000);
    expect(
      trace.warnings.some((w) => w.code === "consumer.averageLoadPercent.invalid"),
    ).toBe(true);
  });

  it("negative percent is treated like 0 (same fallback + warning)", () => {
    const consumers: Consumer[] = [
      { id: "n", name: "Negativ", power: 100, daily: 1, voltage: 12, averageLoadPercent: -10 },
    ];
    const trace = createTrace();
    const wh = calculateDailyConsumption(consumers, undefined, trace);
    expect(wh).toBe(100);
    expect(trace.warnings.length).toBeGreaterThan(0);
  });
});
