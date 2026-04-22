/**
 * Vitest port of SECTION H of
 * `docs/reference/algorithm/camper_electrics_sizing.py`.
 *
 * Every hand-computed number from the Python test suite is preserved. If a
 * test fails here, either the Python source or the TS port drifted — diff
 * the two and reconcile. Never edit the algorithm math to make a test pass.
 */

import { describe, expect, it } from "vitest";

import { roundUpToStandardMm2 } from "./cable-standards";
import { mergeAlgorithmTuning } from "./algorithm-tuning";
import { computeAlgorithm } from "./compute";
import { validate } from "./validate";
import {
  AUTARCHY_UNBOUNDED,
  COPPER_RHO,
  MAX_AUTARCHY_DAYS,
  ROUTES,
} from "./constants";
import {
  alternatorTopUpEstimateWh,
  autarchyMaxDays,
  autarchyTopUpProfile,
  shoreAvailability,
} from "./derive";
import { sizeBooster } from "./phases/booster";
import { roofWp } from "./derive";
import type {
  AlgorithmInput,
  BatteryRecommendation,
  Consumer,
  RoofArea,
  SolarBag,
  TravelBehavior,
} from "./types";
import {
  DEFAULT_BRAND_PREFERENCES,
  DEFAULT_CUSTOM_OVERRIDES,
} from "./types";

// ---------------------------------------------------------------------------
// Small fixture builders (mirror Python `_minimal_input`).
// ---------------------------------------------------------------------------

function defaultTravelBehavior(): TravelBehavior {
  return {
    season: "all_year",
    tripDuration: "week",
    winterLocation: "germany",
    standingDuration: "medium",
  };
}

function defaultCableLengths(length = 2) {
  return {
    starterToService: length,
    boosterToService: length,
    solarToRegulator: length,
    regulatorToService: length,
    chargerToService: length,
    serviceToInverter: length,
    batteryToFuseBox: length,
  };
}

function minimalInput(
  overrides: Partial<AlgorithmInput> = {},
): AlgorithmInput {
  return {
    systemVoltage: 12,
    vehicleVoltage: 12,
    batteryPreference: "lifepo4",
    energySources: [],
    roofModuleType: "rigid",
    roofAreas: [],
    solarBags: [],
    chargerSpeed: "normal",
    consumers: [],
    simultaneousLoad: "low",
    travelBehavior: defaultTravelBehavior(),
    autarchyDays: 1,
    cableLengths: defaultCableLengths(2),
    brandPreferences: DEFAULT_BRAND_PREFERENCES,
    customOverrides: DEFAULT_CUSTOM_OVERRIDES,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("compute_algorithm — hand-computable case", () => {
  // Plan test 1: 12 V LFP, fridge 60 W / 24 h DC, laptop 90 W / 4 h AC,
  // 2 m cable, autarky 1 day, no energy sources.
  //
  // Pocket-calculator trace:
  //   dcWh      = 60 * 24                 = 1440
  //   acWh      = 90 * 4                  =  360
  //   standby   = 10 * 24                 =  240  (peakAcW > 0 -> on)
  //   dailyWh   = 1440 + 360/0.9 + 240    = 2080 Wh
  //   battery (LFP, DoD=0.85, RT=0.95):
  //     cUsable = 2080 * 1 / 0.95         =   2189.47 Wh
  //     cNom    = cUsable / 0.85          =   2575.85 Wh
  //     minAh   = cNom / 12               =    214.65 Ah
  //     recAh   = minAh * 1.25            =    268.32 Ah
  //   inverter (low sim -> 1.25):
  //     recW    = 90 * 1.25               =    112.5 W
  //   cable battery_to_fuse_box (critical, 1 % drop, 12 V):
  //     iInvDc  = 112.5 / (12 * 0.9)      =     10.4167 A
  //     peakDc  = 60 / 12                 =      5.0    A
  //     iTotal  = 15.4167 A
  //     dUMax   = 12 * 0.01               =      0.12 V
  //     minMm²  = 2 * 2 * 15.4167 * 0.0178 / 0.12 = 9.147 mm²
  const consumers: Consumer[] = [
    { id: "fridge", name: "Fridge", power: 60, daily: 24, voltage: 12 },
    { id: "laptop", name: "Laptop", power: 90, daily: 4, voltage: 230 },
  ];
  const input = minimalInput({
    consumers,
    autarchyDays: 1,
    cableLengths: defaultCableLengths(2),
  });

  const out = computeAlgorithm(input, { explain: true });

  it("classifies DC / AC consumption correctly", () => {
    expect(out.breakdown).toBeDefined();
    expect(out.breakdown!.dcWh).toBeCloseTo(1440, 9);
    expect(out.breakdown!.acWh).toBeCloseTo(360, 9);
    expect(out.breakdown!.inverterStandbyWh).toBeCloseTo(240, 9);
    expect(out.breakdown!.dailyWh).toBeCloseTo(2080, 9);
    expect(out.battery.dailyWh).toBeCloseTo(2080, 9);
  });

  it("sizes the battery from dailyWh / DoD / roundtrip / reserve", () => {
    const expectedMinAh = 2080 / 0.95 / 0.85 / 12;
    const expectedRecAh = expectedMinAh * 1.25;
    expect(out.battery.minCapacityAh).toBeCloseTo(expectedMinAh, 9);
    expect(out.battery.recommendedCapacityAh).toBeCloseTo(expectedRecAh, 9);
  });

  it("sizes the inverter using the low simultaneous peak factor (1.25)", () => {
    expect(out.inverter.needed).toBe(true);
    expect(out.inverter.peakLoadW).toBeCloseTo(90, 9);
    expect(out.inverter.recommendedW).toBeCloseTo(112.5, 9);
  });

  it("keeps every supply path quiet when no energy source is selected", () => {
    expect(out.solar.needed).toBe(false);
    expect(out.booster.needed).toBe(false);
    expect(out.charger.needed).toBe(false);
    expect(out.controller.needed).toBe(false);
  });

  it("computes battery_to_fuse_box cable with the critical drop budget", () => {
    const b2f = out.cables.find((c) => c.route === "battery_to_fuse_box");
    expect(b2f).toBeDefined();
    expect(b2f!.isCritical).toBe(true);
    const expectedI = 60 / 12 + 112.5 / (12 * 0.9);
    expect(b2f!.currentA).toBeCloseTo(expectedI, 9);
    const expectedMinMm2 = (2 * 2 * expectedI * COPPER_RHO) / (12 * 0.01);
    expect(b2f!.minCrossSection).toBeCloseTo(expectedMinMm2, 9);
    expect(b2f!.recommendedCrossSection).toBe(
      roundUpToStandardMm2(b2f!.minCrossSection),
    );
  });

  it("emits every route exactly once, in ROUTES order", () => {
    expect(out.cables.map((c) => c.route)).toEqual(ROUTES.map(([id]) => id));
  });
});

describe("compute_algorithm — empty consumers", () => {
  it("returns all-zero quantities without crashing", () => {
    const out = computeAlgorithm(minimalInput());
    expect(out.battery.dailyWh).toBe(0);
    expect(out.battery.minCapacityAh).toBe(0);
    expect(out.battery.recommendedCapacityAh).toBe(0);
    expect(out.inverter.needed).toBe(false);
    expect(out.inverter.peakLoadW).toBe(0);
    expect(out.inverter.recommendedW).toBe(0);
    for (const c of out.cables) {
      expect(c.currentA).toBe(0);
      expect(c.minCrossSection).toBe(0);
      expect(c.recommendedCrossSection).toBe(0);
    }
    expect(out.cables).toHaveLength(7);
    expect(out.cables.map((c) => c.route)).toEqual(ROUTES.map(([id]) => id));
  });
});

describe("compute_algorithm — all DC, no AC", () => {
  it("disables the inverter and skips the standby Wh", () => {
    const consumers: Consumer[] = [
      { id: "f", name: "Fridge", power: 60, daily: 24, voltage: 12 },
      { id: "p", name: "Pump", power: 50, daily: 0.5, voltage: 12 },
    ];
    const out = computeAlgorithm(minimalInput({ consumers }), { explain: true });
    expect(out.inverter.needed).toBe(false);
    expect(out.inverter.peakLoadW).toBe(0);
    expect(out.inverter.recommendedW).toBe(0);
    expect(out.breakdown!.inverterStandbyWh).toBe(0);
    const expectedDaily = 60 * 24 + 50 * 0.5;
    expect(out.battery.dailyWh).toBeCloseTo(expectedDaily, 9);
  });
});

describe("compute_algorithm — invalid input raises", () => {
  it("rejects a consumer with voltage=100", () => {
    expect(() =>
      computeAlgorithm(
        minimalInput({
          consumers: [
            { id: "x", name: "X", power: 10, daily: 1, voltage: 100 as unknown as 12 },
          ],
        }),
      ),
    ).toThrow();
  });

  it("rejects autarchyDays=1000", () => {
    expect(() => computeAlgorithm(minimalInput({ autarchyDays: 1000 }))).toThrow();
  });

  it("rejects autarchyDays=5 for weekend (cap=3)", () => {
    const tb: TravelBehavior = {
      season: "summer",
      tripDuration: "weekend",
      winterLocation: "germany",
      standingDuration: "short",
    };
    expect(() =>
      computeAlgorithm(minimalInput({ travelBehavior: tb, autarchyDays: 5 })),
    ).toThrow();
  });

  it("rejects negative power", () => {
    expect(() =>
      computeAlgorithm(
        minimalInput({
          consumers: [{ id: "x", name: "X", power: -5, daily: 1, voltage: 12 }],
        }),
      ),
    ).toThrow();
  });

  it("rejects permanent + non-all_year season (cross-field rule)", () => {
    const tb: TravelBehavior = {
      season: "summer",
      tripDuration: "permanent",
      winterLocation: "germany",
      standingDuration: "long",
    };
    expect(() =>
      computeAlgorithm(minimalInput({ travelBehavior: tb, autarchyDays: 30 })),
    ).toThrow();
  });

  it("rejects systemVoltage=110", () => {
    const bad = minimalInput();
    (bad as { systemVoltage: number }).systemVoltage = 110;
    expect(() => computeAlgorithm(bad)).toThrow();
  });
});

describe("compute_algorithm — monotonic battery", () => {
  it("adding a consumer never reduces recommended battery capacity", () => {
    const base: Consumer[] = [
      { id: "f", name: "Fridge", power: 60, daily: 24, voltage: 12 },
    ];
    const more: Consumer[] = [
      ...base,
      { id: "l", name: "Laptop", power: 90, daily: 4, voltage: 230 },
    ];
    const baseOut = computeAlgorithm(minimalInput({ consumers: base }));
    const moreOut = computeAlgorithm(minimalInput({ consumers: more }));
    expect(moreOut.battery.recommendedCapacityAh).toBeGreaterThanOrEqual(
      baseOut.battery.recommendedCapacityAh,
    );
    expect(moreOut.battery.dailyWh).toBeGreaterThanOrEqual(baseOut.battery.dailyWh);
    expect(moreOut.inverter.recommendedW).toBeGreaterThanOrEqual(
      baseOut.inverter.recommendedW,
    );
  });
});

describe("compute_algorithm — unit round-trip Wh / Ah", () => {
  it("Wh at 12 V -> Ah -> Wh comes back exactly", () => {
    const wh = 1200;
    const u = 12;
    const ah = wh / u;
    expect(ah * u).toBeCloseTo(wh, 9);

    // For a consumer that burns exactly 1 200 Wh/day at 12 V DC, 1 day
    // autarky, LFP: cNomWh = 1200 / 0.95 / 0.85 ; minAh = cNom / 12.
    const out = computeAlgorithm(
      minimalInput({
        consumers: [{ id: "x", name: "X", power: 100, daily: 12, voltage: 12 }],
      }),
    );
    const expectedCNomWh = 1200 / 0.95 / 0.85;
    expect(out.battery.minCapacityAh * 12).toBeCloseTo(expectedCNomWh, 9);
  });
});

describe("compute_algorithm — autarchyDays sentinel 999 clamps per trip + profile", () => {
  it("echoes MAX_AUTARCHY_DAYS[tripDuration][profile] back in the output", () => {
    // minimalInput: energySources = [] -> battery_only profile.
    const out = computeAlgorithm(minimalInput({ autarchyDays: AUTARCHY_UNBOUNDED }));
    expect(out.battery.autarchyDays).toBe(MAX_AUTARCHY_DAYS.week.battery_only);
  });

  it("picks the dual-top-up cap when solar + alternator are both selected", () => {
    const out = computeAlgorithm(
      minimalInput({
        autarchyDays: AUTARCHY_UNBOUNDED,
        energySources: ["solar", "alternator"],
      }),
    );
    expect(out.battery.autarchyDays).toBe(MAX_AUTARCHY_DAYS.week.solar_and_alt);
  });
});

describe("shoreAvailability — precedence rules (A.7.2)", () => {
  const tbPerm: TravelBehavior = {
    season: "all_year",
    tripDuration: "permanent",
    winterLocation: "germany",
    standingDuration: "long",
  };

  it("shore_power absent -> 'never' regardless of chargerSpeed", () => {
    const input = minimalInput({
      travelBehavior: tbPerm,
      autarchyDays: 30,
      energySources: [],
    });
    expect(shoreAvailability(input)).toBe("never");
  });

  it("permanent + slow charger -> 'occasional' (row precedence)", () => {
    const input = minimalInput({
      travelBehavior: tbPerm,
      autarchyDays: 30,
      energySources: ["shore_power"],
      chargerSpeed: "slow",
    });
    expect(shoreAvailability(input)).toBe("occasional");
  });

  it("permanent + normal -> 'full_time'", () => {
    const input = minimalInput({
      travelBehavior: tbPerm,
      autarchyDays: 30,
      energySources: ["shore_power"],
      chargerSpeed: "normal",
    });
    expect(shoreAvailability(input)).toBe("full_time");
  });

  it("permanent + fast -> 'full_time'", () => {
    const input = minimalInput({
      travelBehavior: tbPerm,
      autarchyDays: 30,
      energySources: ["shore_power"],
      chargerSpeed: "fast",
    });
    expect(shoreAvailability(input)).toBe("full_time");
  });

  it("non-permanent follows chargerSpeed (fast -> nightly_fast)", () => {
    const input = minimalInput({
      energySources: ["shore_power"],
      chargerSpeed: "fast",
    });
    expect(shoreAvailability(input)).toBe("nightly_fast");
  });
});

describe("cable sizing — cables.md worked example", () => {
  it("120 A at 12 V over 3 m with 3 % drop ≈ 35.6 mm²", () => {
    const L = 3;
    const I = 120;
    const U = 12;
    const duMaxPct = 3;
    const duMaxV = (U * duMaxPct) / 100;
    const aMin = (2 * L * I * COPPER_RHO) / duMaxV;
    expect(Math.abs(aMin - 35.6)).toBeLessThan(0.1);
  });
});

describe("cable sizing — ampacity lower bound (short run)", () => {
  it("dominates voltage-drop for battery->inverter on a very short run", () => {
    // Back-oven on AC: high inverter; 0.2 m -> ΔU would imply ~3–4 mm², but
    // ~100 A+ needs ~50 mm² (bundled ampacity × 1.25) per mobile-home ref.
    const out = computeAlgorithm(
      minimalInput({
        systemVoltage: 24,
        vehicleVoltage: 24,
        consumers: [
          { id: "o", name: "Oven", power: 2000, daily: 0.1, voltage: 230 },
        ],
        energySources: [],
        cableLengths: {
          starterToService: 1.5,
          boosterToService: 1,
          solarToRegulator: 4.75,
          regulatorToService: 0.2,
          chargerToService: 1,
          serviceToInverter: 0.2,
          batteryToFuseBox: 2,
        },
        simultaneousLoad: "moderate",
      }),
    );
    const inv = out.cables.find((c) => c.route === "service_to_inverter");
    expect(inv).toBeDefined();
    expect(inv!.minCrossSection).toBeGreaterThan(25);
  });
});

describe("booster sizing — 24 V bank fed from 12 V alternator", () => {
  it("40 A out / 88.89 A starter side when battery acceptance wins", () => {
    // Build a case that forces outputCurrentA = 40 A. Set
    // recommendedCapacityAh so 0.5 * cap = 40 (-> cap = 80), and give the
    // alternator a very generous limit so the battery-acceptance ceiling wins.
    const battery: BatteryRecommendation = {
      dailyWh: 0,
      minCapacityAh: 80,
      recommendedCapacityAh: 80,
      type: "lifepo4",
      voltage: 24,
      autarchyDays: 1,
      hasSolar: false,
      hasAlternator: true,
      solarTopUpWh: 0,
      alternatorTopUpWh: 0,
      dailyTopUpWh: 0,
      netDailyDeficitWh: 0,
      bindingBranch: "hard",
      shoreBridgeReliefBaseDays: 0,
      shoreBridgeReliefEffectiveDays: 0,
      shoreReliefAlternatorScale: 1,
      autarchyBridgeDaysRaw: 1,
      autarchyBridgeDaysForSoft: 1,
    };
    const input = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 12,
      energySources: ["alternator"],
    });
    const booster = sizeBooster(battery, 1, input, 500, mergeAlgorithmTuning({}));
    expect(booster.outputCurrentA).toBeCloseTo(40, 9);
    const expectedIn = (24 * 40) / (12 * 0.9);
    expect(booster.inputCurrentA).toBeCloseTo(expectedIn, 9);
    expect(booster.needsConversion).toBe(true);
  });
});

describe("solar — shortfall is never negative", () => {
  it("solarShortfallWh >= 0 even when yield exceeds demand", () => {
    const bigBags: SolarBag[] = [
      { id: "a", power: 2000 },
      { id: "b", power: 2000 },
    ];
    const out = computeAlgorithm(
      minimalInput({
        consumers: [{ id: "f", name: "F", power: 60, daily: 24, voltage: 12 }],
        energySources: ["solar"],
        solarBags: bigBags,
      }),
    );
    expect(out.solar.solarShortfallWh).toBeGreaterThanOrEqual(0);
  });

  it("adding a solar bag strictly increases totalAvailableWp vs roof-only", () => {
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Roof", length: 200, width: 100 },
    ];
    const consumers: Consumer[] = [
      { id: "x", name: "X", power: 100, daily: 10, voltage: 12 },
    ];
    const travelBehavior: TravelBehavior = {
      season: "winter",
      tripDuration: "week",
      winterLocation: "germany",
      standingDuration: "medium",
    };
    const base = minimalInput({
      energySources: ["solar"],
      roofAreas,
      consumers,
      travelBehavior,
    });
    const noBag = computeAlgorithm(base);
    const withBag = computeAlgorithm({
      ...base,
      solarBags: [{ id: "bag", power: 100 }],
    });
    expect(withBag.solar.totalAvailableWp).toBeGreaterThan(
      noBag.solar.totalAvailableWp,
    );
    expect(withBag.solar.portableEffectiveWp).toBeGreaterThan(0);
  });
});

describe("roofWp — cm^2 → m^2 → Wp conversion", () => {
  it("2 m × 1 m rigid = 2 m² ⇒ 2 × 200 × 0.8 = 320 Wp", () => {
    const ra: RoofArea[] = [{ id: "r", name: "Roof", length: 200, width: 100 }];
    expect(roofWp(ra, "rigid", mergeAlgorithmTuning({}))).toBeCloseTo(320, 9);
  });
});

describe("legacy-compat output stubs", () => {
  it("solar.recommendation = '' and recommended is standard size ≥ minCrossSection", () => {
    const consumers: Consumer[] = [
      { id: "l", name: "Laptop", power: 90, daily: 4, voltage: 230 },
    ];
    const out = computeAlgorithm(minimalInput({ consumers }));
    expect(out.solar.recommendation).toBe("");
    for (const c of out.cables) {
      expect(c.recommendedCrossSection).toBe(
        roundUpToStandardMm2(c.minCrossSection),
      );
    }
  });

  it("booster.currentA mirrors booster.outputCurrentA", () => {
    const out = computeAlgorithm(
      minimalInput({
        consumers: [{ id: "f", name: "F", power: 60, daily: 24, voltage: 12 }],
        energySources: ["alternator"],
        autarchyDays: 2,
      }),
    );
    expect(out.booster.currentA).toBe(out.booster.outputCurrentA);
  });
});

describe("output shape stability", () => {
  it("always has 7 cables in the ROUTES order", () => {
    const out = computeAlgorithm(minimalInput());
    expect(out.cables).toHaveLength(7);
    expect(out.cables.map((c) => c.route)).toEqual(ROUTES.map(([id]) => id));
  });
});

describe("sizeBattery — soft-autarky with top-ups", () => {
  it("battery_only reduces to the pure cloudy-bridge formula", () => {
    // No solar, no alternator. softBridge = dailyWh * days, hardFloor = dailyWh * 1,
    // softBridge wins for days >= 1 (ties resolve to 'soft').
    const consumers: Consumer[] = [
      { id: "f", name: "Fridge", power: 60, daily: 24, voltage: 12 },
    ];
    const out = computeAlgorithm(minimalInput({ consumers, autarchyDays: 3 }));
    const expectedMinAh = (60 * 24 * 3) / 0.95 / 0.85 / 12;
    expect(out.battery.minCapacityAh).toBeCloseTo(expectedMinAh, 6);
    expect(out.battery.dailyTopUpWh).toBe(0);
    expect(out.battery.netDailyDeficitWh).toBeCloseTo(60 * 24, 6);
    expect(out.battery.bindingBranch).toBe("soft");
  });

  it("solar + alternator shrinks the bank vs. battery-only at identical days", () => {
    const tb: TravelBehavior = {
      season: "all_year",
      tripDuration: "permanent",
      winterLocation: "southern",
      standingDuration: "long",
    };
    const consumers: Consumer[] = [
      { id: "f", name: "Fridge", power: 60, daily: 24, voltage: 24 },
    ];
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Roof", length: 400, width: 200 },
    ];
    const base = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      autarchyDays: 21,
      travelBehavior: tb,
    });
    const batteryOnly = computeAlgorithm(base);
    const withTopUps = computeAlgorithm({
      ...base,
      energySources: ["solar", "alternator"],
      roofAreas,
    });

    expect(withTopUps.battery.dailyTopUpWh).toBeGreaterThan(0);
    expect(withTopUps.battery.solarTopUpWh).toBeGreaterThan(0);
    expect(withTopUps.battery.alternatorTopUpWh).toBeGreaterThan(0);
    expect(withTopUps.battery.recommendedCapacityAh).toBeLessThan(
      batteryOnly.battery.recommendedCapacityAh,
    );
  });

  it("exposes the topUp / netDeficit / bindingBranch fields on the output", () => {
    const tb: TravelBehavior = {
      season: "all_year",
      tripDuration: "extended",
      winterLocation: "southern",
      standingDuration: "long",
    };
    const consumers: Consumer[] = [
      { id: "f", name: "Fridge", power: 60, daily: 24, voltage: 24 },
    ];
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Roof", length: 400, width: 200 },
    ];
    const out = computeAlgorithm(
      minimalInput({
        systemVoltage: 24,
        vehicleVoltage: 24,
        consumers,
        energySources: ["solar"],
        roofAreas,
        travelBehavior: tb,
        autarchyDays: 10,
      }),
      { explain: true },
    );
    expect(out.battery.solarTopUpWh).toBeGreaterThan(0);
    expect(out.battery.alternatorTopUpWh).toBe(0);
    expect(out.battery.dailyTopUpWh).toBeCloseTo(out.battery.solarTopUpWh, 6);
    expect(out.battery.netDailyDeficitWh).toBe(
      Math.max(out.battery.dailyWh - out.battery.dailyTopUpWh, 0),
    );
    expect(["soft", "hard"]).toContain(out.battery.bindingBranch);
    expect(out.breakdown!.autarchyTopUpProfile).toBe("solar_or_alt");
    expect(out.breakdown!.autarchySolarTopUpWh).toBe(out.battery.solarTopUpWh);
  });
});

describe("sizeBattery — coverage-capped bridge keeps every input alive", () => {
  // The old formula (`netDeficit = max(daily − topUp, 0)`) collapsed to 0
  // as soon as solar+alternator covered daily demand — which silently
  // killed the autarky slider, the solar-bag toggle and the alternator
  // on/off for any realistic permanent-camper setup. These tests pin
  // the new coverage-cap behaviour that users actually perceive.

  it("autarchyDays slider MOVES the Ah for a solar+alternator permanent user (2 d ≠ 77 d)", () => {
    // Exactly the scenario the user complained about: solar+alt over-supply
    // → `netDailyDeficitWh = 0` in the old formula → slider flat. With the
    // 0.75 coverage cap, the bridge deficit is always `daily × 0.25`, so
    // autarky days 2 vs 77 must produce clearly different recommendations.
    const consumers: Consumer[] = [
      { id: "led", name: "LED", power: 20, daily: 2, voltage: 24 },
      { id: "router", name: "WLAN", power: 7, daily: 24, voltage: 24 },
      { id: "heater", name: "Standheizung", power: 30, daily: 2, voltage: 24 },
      { id: "laptop", name: "Laptop", power: 60, daily: 2, voltage: 230 },
      { id: "oven", name: "Backofen", power: 1135, daily: 0.5, voltage: 230 },
    ];
    const tb: TravelBehavior = {
      season: "all_year",
      tripDuration: "permanent",
      winterLocation: "southern",
      standingDuration: "long",
    };
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Roof", length: 400, width: 200 },
    ];
    const base = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      energySources: ["solar", "alternator"],
      roofAreas,
      travelBehavior: tb,
    });
    const shortAut = computeAlgorithm({ ...base, autarchyDays: 2 });
    const longAut = computeAlgorithm({ ...base, autarchyDays: 77 });

    // Raw deficit is zero (top-up covers daily) — the old code path —
    // but the coverage-capped bridge is not, so the slider moves.
    expect(shortAut.battery.netDailyDeficitWh).toBe(0);
    expect(longAut.battery.netDailyDeficitWh).toBe(0);
    expect(shortAut.battery.coverageRatio).toBeGreaterThan(0);
    expect(longAut.battery.coverageRatio).toBeGreaterThan(0);

    // Short autarky binds on the 1-day hard floor; long autarky binds on
    // the coverage-capped bridge. The user sees a clear step.
    expect(shortAut.battery.bindingBranch).toBe("hard");
    expect(longAut.battery.bindingBranch).toBe("soft");
    expect(longAut.battery.recommendedCapacityAh).toBeGreaterThan(
      shortAut.battery.recommendedCapacityAh * 1.4,
    );
  });

  it("coverage-capped bridge deficit never collapses to 0 (fraction × daily)", () => {
    // Tiny daily load, gigantic roof → top-up massively oversupplies.
    // The new formula gives `bridgeDailyDeficit = daily × 0.25` (the
    // non-offsetable residual), not 0.
    const consumers: Consumer[] = [
      { id: "led", name: "LED", power: 10, daily: 1, voltage: 24 },
    ];
    const tb: TravelBehavior = {
      season: "summer",
      tripDuration: "extended",
      winterLocation: "southern",
      standingDuration: "short",
    };
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Roof", length: 400, width: 200 },
    ];
    const out = computeAlgorithm(
      minimalInput({
        systemVoltage: 24,
        vehicleVoltage: 24,
        consumers,
        energySources: ["solar"],
        roofAreas,
        travelBehavior: tb,
        autarchyDays: 20,
      }),
    );
    expect(out.battery.dailyTopUpWh).toBeGreaterThanOrEqual(out.battery.dailyWh);
    expect(out.battery.netDailyDeficitWh).toBe(0);
    expect(out.battery.coverageRatio).toBeCloseTo(0.75, 6); // == TOP_UP_COVERAGE_CAP
    expect(out.battery.bridgeDailyDeficitWh).toBeCloseTo(10 * 0.25, 6);
  });

  it("battery-only users get a 1-day hard floor (no top-up → formula is the classic bridge)", () => {
    const consumers: Consumer[] = [
      { id: "led", name: "LED", power: 10, daily: 1, voltage: 24 },
    ];
    const out = computeAlgorithm(
      minimalInput({
        systemVoltage: 24,
        vehicleVoltage: 24,
        consumers,
        autarchyDays: 1,
      }),
    );
    expect(out.battery.hasSolar).toBe(false);
    expect(out.battery.hasAlternator).toBe(false);
    expect(out.battery.coverageRatio).toBe(0);
    // Soft and hard tie at `dailyWh × 1`; the 1-day hard floor is the
    // exact raw daily consumption, as expected.
    const expectedMinAh = 10 / 0.95 / 0.85 / 24;
    expect(out.battery.minCapacityAh).toBeCloseTo(expectedMinAh, 6);
  });
});

describe("step-8 battery-only preview (energySources minus solar)", () => {
  it("rejects alternator-only when autarchyDays exceeds the smaller solar_or_alt cap", () => {
    const tb: TravelBehavior = {
      season: "summer",
      tripDuration: "weekend",
      winterLocation: "germany",
      standingDuration: "medium",
    };
    const withSolarAndAlt = minimalInput({
      energySources: ["solar", "alternator"],
      autarchyDays: 7,
      travelBehavior: tb,
    });
    expect(() => validate(withSolarAndAlt)).not.toThrow();
    const alternatorOnly = {
      ...withSolarAndAlt,
      energySources: ["alternator"] as typeof withSolarAndAlt.energySources,
    };
    expect(() => validate(alternatorOnly)).toThrow();
    expect(() => validate({ ...alternatorOnly, autarchyDays: 5 })).not.toThrow();
  });
});

describe("autarchyTopUpProfile / autarchyMaxDays", () => {
  it("derives the profile from energySources (shore_power ignored)", () => {
    expect(autarchyTopUpProfile(minimalInput({ energySources: [] }))).toBe(
      "battery_only",
    );
    expect(
      autarchyTopUpProfile(minimalInput({ energySources: ["shore_power"] })),
    ).toBe("battery_only");
    expect(
      autarchyTopUpProfile(minimalInput({ energySources: ["solar"] })),
    ).toBe("solar_or_alt");
    expect(
      autarchyTopUpProfile(minimalInput({ energySources: ["alternator"] })),
    ).toBe("solar_or_alt");
    expect(
      autarchyTopUpProfile(
        minimalInput({ energySources: ["solar", "alternator"] }),
      ),
    ).toBe("solar_and_alt");
  });

  it("autarchyMaxDays echoes MAX_AUTARCHY_DAYS[td][profile]", () => {
    const input = minimalInput({ energySources: ["solar", "alternator"] });
    expect(autarchyMaxDays(input, mergeAlgorithmTuning({}))).toBe(
      MAX_AUTARCHY_DAYS.week.solar_and_alt,
    );
  });
});

describe("alternatorTopUpEstimateWh", () => {
  it("returns 0 without alternator in energySources", () => {
    const input = minimalInput({ energySources: ["solar"] });
    expect(alternatorTopUpEstimateWh(1.0, input, 60, mergeAlgorithmTuning({}))).toBe(0);
  });

  it("uses alternator ceiling (no battery-acceptance clamp)", () => {
    const input = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 12,
      energySources: ["alternator"],
    });
    // maxOut = 60 * 12 / 24 = 30 A ; Wh = 1 h * 30 A * 24 V * 0.9 = 648 Wh
    expect(alternatorTopUpEstimateWh(1.0, input, 60, mergeAlgorithmTuning({}))).toBeCloseTo(648, 6);
  });
});

describe("sizeBattery — solar bag reduces battery in a realistic summer setup", () => {
  // Regression: with `AUTARCHY_PSH_DERATE = 0.7` (too optimistic) adding a
  // solar bag to a summer / week / moderate-load user silently left the
  // battery recommendation unchanged because `dailyTopUpWh >= dailyWh` and
  // the HARD_BRIDGE_DAYS=1 floor always won. The new 0.30 derate keeps the
  // soft bridge dominant in this scenario so the bag visibly shrinks the
  // bank.
  it("adding a 200 Wp bag strictly reduces recommendedCapacityAh (solar-only, autarchy 7 days)", () => {
    // Must be a setup where the soft bridge binds for BOTH variants —
    // otherwise the hard-floor floor masks the bag's effect. Solar-only
    // summer Germany with a modest roof hits that regime cleanly.
    const consumers: Consumer[] = [
      { id: "f", name: "Fridge", power: 60, daily: 24, voltage: 12 },
      { id: "l", name: "Laptop", power: 90, daily: 4, voltage: 230 },
    ];
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Roof", length: 200, width: 100 }, // 2 m × 1 m = 320 Wp rigid
    ];
    const tb: TravelBehavior = {
      season: "summer",
      tripDuration: "week",
      winterLocation: "germany",
      standingDuration: "short",
    };
    const base = minimalInput({
      consumers,
      energySources: ["solar"],
      roofAreas,
      travelBehavior: tb,
      autarchyDays: 7,
    });
    const withoutBag = computeAlgorithm(base);
    const withBag = computeAlgorithm({
      ...base,
      solarBags: [{ id: "bag", power: 200 }],
    });

    expect(withoutBag.battery.bindingBranch).toBe("soft");
    expect(withBag.battery.bindingBranch).toBe("soft");
    expect(withBag.solar.portableEffectiveWp).toBeGreaterThan(0);
    expect(withBag.battery.solarTopUpWh).toBeGreaterThan(
      withoutBag.battery.solarTopUpWh,
    );
    expect(withBag.battery.recommendedCapacityAh).toBeLessThan(
      withoutBag.battery.recommendedCapacityAh,
    );
  });
});

describe("sizeBattery — winterLocation breaks the 0.75 raw-coverage plateau", () => {
  it("germany all_year yields larger Ah than southern with identical consumers/roof (77 d)", () => {
    const consumers: Consumer[] = [
      { id: "led", name: "LED Beleuchtung", power: 20, daily: 2, voltage: 24 },
      {
        id: "heater",
        name: "Diesel-Standheizung",
        power: 30,
        daily: 2,
        voltage: 24,
      },
      { id: "router", name: "WLAN-Router", power: 7, daily: 24, voltage: 24 },
      { id: "laptop", name: "Laptop", power: 60, daily: 2, voltage: 230 },
      { id: "tv", name: "TV / Monitor", power: 35, daily: 3, voltage: 230 },
      { id: "boiler", name: "Boiler (elektrisch)", power: 550, daily: 0.5, voltage: 230 },
      { id: "fan", name: "Dachlüfter", power: 25, daily: 2, voltage: 24 },
      { id: "oven", name: "Backofen", power: 1135, daily: 0.5, voltage: 230 },
    ];
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Hauptfläche", length: 400, width: 200 },
    ];
    const tbSouth: TravelBehavior = {
      season: "all_year",
      tripDuration: "permanent",
      winterLocation: "southern",
      standingDuration: "long",
    };
    const base = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      energySources: ["solar", "alternator"],
      roofAreas,
      travelBehavior: tbSouth,
      simultaneousLoad: "moderate",
      autarchyDays: 77,
    });
    const south = computeAlgorithm(base);
    const de = computeAlgorithm({
      ...base,
      travelBehavior: { ...tbSouth, winterLocation: "germany" },
    });

    expect(de.battery.recommendedCapacityAh).toBeGreaterThan(
      south.battery.recommendedCapacityAh,
    );
    expect(de.battery.bridgeDailyDeficitWh ?? 0).toBeGreaterThan(
      south.battery.bridgeDailyDeficitWh ?? 0,
    );
    expect(de.battery.coverageRatio ?? 0).toBeLessThan(
      south.battery.coverageRatio ?? 1,
    );
  });
});

describe("sizeBattery — standingDuration vs LM bridge credit (variant A)", () => {
  it("long standing yields larger Ah than short when both raw averages exceed the PSH cap", () => {
    const consumers: Consumer[] = [
      { id: "led", name: "LED Beleuchtung", power: 20, daily: 2, voltage: 24 },
      {
        id: "heater",
        name: "Diesel-Standheizung",
        power: 30,
        daily: 2,
        voltage: 24,
      },
      { id: "router", name: "WLAN-Router", power: 7, daily: 24, voltage: 24 },
      { id: "laptop", name: "Laptop", power: 60, daily: 2, voltage: 230 },
      { id: "tv", name: "TV / Monitor", power: 35, daily: 3, voltage: 230 },
      { id: "boiler", name: "Boiler (elektrisch)", power: 550, daily: 0.5, voltage: 230 },
      { id: "fan", name: "Dachlüfter", power: 25, daily: 2, voltage: 24 },
      { id: "oven", name: "Backofen", power: 1135, daily: 0.5, voltage: 230 },
    ];
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Hauptfläche", length: 400, width: 200 },
    ];
    const tbBase = {
      season: "winter" as const,
      tripDuration: "extended" as const,
      winterLocation: "southern" as const,
    };
    const base = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      energySources: ["solar", "alternator"],
      roofAreas,
      travelBehavior: { ...tbBase, standingDuration: "short" },
      simultaneousLoad: "moderate",
      autarchyDays: 18,
    });
    const shortStand = computeAlgorithm(base);
    const longStand = computeAlgorithm({
      ...base,
      travelBehavior: { ...tbBase, standingDuration: "long" },
    });

    expect(longStand.battery.recommendedCapacityAh).toBeGreaterThan(
      shortStand.battery.recommendedCapacityAh,
    );
    expect(longStand.battery.bridgeDailyDeficitWh ?? 0).toBeGreaterThan(
      shortStand.battery.bridgeDailyDeficitWh ?? 0,
    );
    expect(longStand.battery.alternatorTopUpWh).toBeLessThan(
      shortStand.battery.alternatorTopUpWh,
    );
    expect(longStand.battery.dailyTopUpWhForCoverage).toBeDefined();
    expect(longStand.battery.dailyTopUpWhForCoverage).toBeLessThan(
      longStand.battery.dailyTopUpWh,
    );
  });
});

describe("sizeBattery — permanent + alternator: standing cap mult breaks plateau", () => {
  it("long standing yields larger Ah than short (DRIVE_HOURS identical for permanent)", () => {
    const consumers: Consumer[] = [
      { id: "led", name: "LED Beleuchtung", power: 20, daily: 2, voltage: 24 },
      {
        id: "heater",
        name: "Diesel-Standheizung",
        power: 30,
        daily: 2,
        voltage: 24,
      },
      { id: "router", name: "WLAN-Router", power: 7, daily: 24, voltage: 24 },
      { id: "laptop", name: "Laptop", power: 60, daily: 2, voltage: 230 },
      { id: "tv", name: "TV / Monitor", power: 35, daily: 3, voltage: 230 },
      { id: "boiler", name: "Boiler (elektrisch)", power: 550, daily: 0.5, voltage: 230 },
      { id: "fan", name: "Dachlüfter", power: 25, daily: 2, voltage: 24 },
      { id: "oven", name: "Backofen", power: 1135, daily: 0.5, voltage: 230 },
    ];
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Hauptfläche", length: 400, width: 200 },
    ];
    const tbBase = {
      season: "all_year" as const,
      tripDuration: "permanent" as const,
      winterLocation: "southern" as const,
    };
    const base = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      energySources: ["solar", "alternator"],
      roofAreas,
      travelBehavior: { ...tbBase, standingDuration: "short" },
      simultaneousLoad: "moderate",
      autarchyDays: 77,
    });
    const shortStand = computeAlgorithm(base, { explain: true });
    const longStand = computeAlgorithm(
      {
        ...base,
        travelBehavior: { ...tbBase, standingDuration: "long" },
      },
      { explain: true },
    );

    expect(shortStand.breakdown!.driveHoursPerDay).toBe(
      longStand.breakdown!.driveHoursPerDay,
    );
    expect(longStand.battery.recommendedCapacityAh).toBeGreaterThan(
      shortStand.battery.recommendedCapacityAh,
    );
    expect(longStand.battery.coverageRatio ?? 0).toBeLessThan(
      shortStand.battery.coverageRatio ?? 1,
    );
    expect(longStand.breakdown!.topUpCoverageStandingCapMult).toBe(0.9);
    expect(shortStand.breakdown!.topUpCoverageStandingCapMult).toBe(1);
  });
});

describe("solar bags vs saturated TOP_UP_COVERAGE_CAP (solar + alternator)", () => {
  // When roof + alternator already push rawCoverage > 1, the base cap at
  // 0.75 used to swallow every extra bag Wp — `coverageRatio` stayed 0.75
  // forever. Portable bridge Wh now bumps `effectiveCoverageCap` so bags
  // still shrink the bank.
  it("400 Wp bag lowers Ah at autarchy 51 (permanent southern, solar+alt)", () => {
    const consumers: Consumer[] = [
      { id: "led", name: "LED", power: 20, daily: 2, voltage: 24 },
      { id: "heater", name: "Diesel-Standheizung", power: 30, daily: 2, voltage: 24 },
      { id: "router", name: "WLAN-Router", power: 7, daily: 24, voltage: 24 },
      { id: "laptop", name: "Laptop", power: 60, daily: 2, voltage: 230 },
      { id: "tv", name: "TV", power: 35, daily: 3, voltage: 230 },
      { id: "boiler", name: "Boiler", power: 550, daily: 0.5, voltage: 230 },
      { id: "fan", name: "Dachlüfter", power: 25, daily: 2, voltage: 24 },
      { id: "oven", name: "Backofen", power: 1135, daily: 0.5, voltage: 230 },
    ];
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Hauptfläche", length: 400, width: 200 },
    ];
    const tb: TravelBehavior = {
      season: "all_year",
      tripDuration: "permanent",
      winterLocation: "southern",
      standingDuration: "long",
    };
    const base = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      energySources: ["solar", "alternator"],
      roofAreas,
      travelBehavior: tb,
      simultaneousLoad: "moderate",
      autarchyDays: 51,
    });
    const noBag = computeAlgorithm(base);
    const withBag = computeAlgorithm({
      ...base,
      solarBags: [{ id: "b", power: 400 }],
    });

    // Permanent + long standing lowers the effective cap (LM plateau fix).
    expect(noBag.battery.coverageRatio).toBeCloseTo(0.675, 4);
    expect(withBag.battery.effectiveCoverageCap ?? 0).toBeGreaterThan(
      noBag.battery.effectiveCoverageCap ?? 0,
    );
    expect(withBag.battery.recommendedCapacityAh).toBeLessThan(
      noBag.battery.recommendedCapacityAh,
    );
  });
});

describe("sizeBattery — long-autarky horizon stays physically realistic", () => {
  // Regression: before AUTARCHY_MAX_BRIDGE_DAYS was introduced, a permanent
  // southern-Europe user with solar + alternator and the "Lang" preset
  // (autarchyDays ≈ 77) got a 2 672 Ah @ 24 V recommendation — absurd.
  // Over 77 days the seasonal average dominates, not a sustained
  // bad-weather stretch, so we cap the effective bridge at 14 days and
  // the recommendation lands in the realistic 150–350 Ah range for this
  // setup.
  it("77-day slider on a solar+alternator permanent user stays under 400 Ah @ 24 V", () => {
    const consumers: Consumer[] = [
      { id: "led", name: "LED", power: 20, daily: 2, voltage: 24 },
      { id: "heater", name: "Diesel-Standheizung", power: 30, daily: 2, voltage: 24 },
      { id: "router", name: "WLAN-Router", power: 7, daily: 24, voltage: 24 },
      { id: "laptop", name: "Laptop", power: 60, daily: 2, voltage: 230 },
      { id: "tv", name: "TV", power: 35, daily: 3, voltage: 230 },
      { id: "boiler", name: "Boiler", power: 550, daily: 0.5, voltage: 230 },
      { id: "fan", name: "Dachlüfter", power: 25, daily: 2, voltage: 24 },
      { id: "oven", name: "Backofen", power: 1135, daily: 0.5, voltage: 230 },
    ];
    const tb: TravelBehavior = {
      season: "all_year",
      tripDuration: "permanent",
      winterLocation: "southern",
      standingDuration: "long",
    };
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Hauptfläche", length: 400, width: 200 },
    ];
    const out = computeAlgorithm(
      minimalInput({
        systemVoltage: 24,
        vehicleVoltage: 24,
        consumers,
        energySources: ["solar", "alternator"],
        roofAreas,
        // No bags here — portable panels raise `effectiveCoverageCap` and
        // can shrink this number below 150 Ah while still being healthy.
        solarBags: [],
        travelBehavior: tb,
        autarchyDays: 77,
        simultaneousLoad: "moderate",
      }),
      { explain: true },
    );

    // Hard ceiling — must not regress to the old multi-thousand-Ah output.
    expect(out.battery.recommendedCapacityAh).toBeLessThan(400);
    // And must still grow beyond the 1-day hard floor (≈ 90 Ah here),
    // otherwise the autarky slider is meaningless for this user.
    expect(out.battery.recommendedCapacityAh).toBeGreaterThan(150);

    // Full alternator top-up is used — no silent halving.
    const expectedAltWh = 0.5 * 60 * 24 * 0.9; // drive 0.5 h × 60 A × 24 V × η_B2B
    expect(out.battery.alternatorTopUpWh).toBeCloseTo(expectedAltWh, 6);
  });

  describe("user-reported scenarios must all produce distinct, monotonic Ah", () => {
    // Four scenarios from a real wizard debug export. The user moved only
    // autarchyDays and energySources between them and the recommended Ah
    // was flat — exactly what this regression guards against.
    //
    //   A: solar+alt, permanent southern short,  2 d autarky
    //   B: solar+alt, permanent southern short, 77 d autarky
    //   (`short` avoids permanent+long standing-cap mult — this block pins
    //   autarky-slider monotonicity, not standing-plateau behaviour.)
    //   C: solar-only, extended southern long, 30 d autarky
    //   D: solar-only, extended southern long,  2 d autarky
    const consumers: Consumer[] = [
      { id: "led", name: "LED", power: 20, daily: 2, voltage: 24 },
      { id: "heater", name: "Diesel-Standheizung", power: 30, daily: 2, voltage: 24 },
      { id: "router", name: "WLAN-Router", power: 7, daily: 24, voltage: 24 },
      { id: "laptop", name: "Laptop", power: 60, daily: 2, voltage: 230 },
      { id: "tv", name: "TV", power: 35, daily: 3, voltage: 230 },
      { id: "boiler", name: "Boiler", power: 550, daily: 0.5, voltage: 230 },
      { id: "fan", name: "Dachlüfter", power: 25, daily: 2, voltage: 24 },
      { id: "oven", name: "Backofen", power: 1135, daily: 0.5, voltage: 230 },
    ];
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Hauptfläche", length: 400, width: 200 },
    ];
    const baseWithAlt: AlgorithmInput = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      energySources: ["solar", "alternator"],
      roofAreas,
      travelBehavior: {
        season: "all_year",
        tripDuration: "permanent",
        winterLocation: "southern",
        standingDuration: "short",
      },
      simultaneousLoad: "moderate",
    });
    const baseSolarOnly: AlgorithmInput = {
      ...baseWithAlt,
      energySources: ["solar"],
      travelBehavior: {
        season: "all_year",
        tripDuration: "extended",
        winterLocation: "southern",
        standingDuration: "long",
      },
    };

    const A = computeAlgorithm({ ...baseWithAlt, autarchyDays: 2 });
    const B = computeAlgorithm({ ...baseWithAlt, autarchyDays: 77 });
    const C = computeAlgorithm({ ...baseSolarOnly, autarchyDays: 30 });
    const D = computeAlgorithm({ ...baseSolarOnly, autarchyDays: 2 });

    it("A (2 d) stays modest around the 1-day hard floor, under 150 Ah", () => {
      expect(A.battery.bindingBranch).toBe("hard");
      expect(A.battery.recommendedCapacityAh).toBeLessThan(150);
    });

    it("B (77 d) is clearly larger than A — the autarky slider works", () => {
      expect(B.battery.bindingBranch).toBe("soft");
      expect(B.battery.recommendedCapacityAh).toBeGreaterThan(
        A.battery.recommendedCapacityAh * 1.4,
      );
      expect(B.battery.recommendedCapacityAh).toBeLessThan(250); // no runaway
    });

    it("C (solar-only 30 d) is strictly larger than B (solar+alt 77 d) — alternator helps", () => {
      // Removing the alternator forces the battery to carry more of the
      // daily demand during the bridge. Even though C has fewer days, the
      // larger per-day deficit should win.
      expect(C.battery.recommendedCapacityAh).toBeGreaterThan(
        B.battery.recommendedCapacityAh,
      );
    });

    it("D (solar-only 2 d) falls back to the hard floor, same ballpark as A", () => {
      expect(D.battery.bindingBranch).toBe("hard");
      expect(D.battery.recommendedCapacityAh).toBeCloseTo(
        A.battery.recommendedCapacityAh,
        6,
      );
    });
  });

  it("calibrated against 7-year camper experience: 1 kWp solar-only south-Spain permanent stays ≈ 250 Ah @ 24 V", () => {
    // Real-world anchor from a user living this exact setup for 7 years
    // and reporting 200 Ah @ 24 V LFP is "enough, 250 Ah would be
    // comfortable". Before calibration the algorithm suggested 924 Ah —
    // ~4× the empirical sweet spot.
    //
    // This is the user's exact wizard input (paraphrased for brevity).
    const consumers: Consumer[] = [
      { id: "led", name: "LED", power: 20, daily: 2, voltage: 24 },
      { id: "heater", name: "Diesel-Standheizung", power: 30, daily: 2, voltage: 24 },
      { id: "router", name: "WLAN-Router", power: 7, daily: 24, voltage: 24 },
      { id: "laptop", name: "Laptop", power: 60, daily: 2, voltage: 230 },
      { id: "tv", name: "TV", power: 35, daily: 3, voltage: 230 },
      { id: "boiler", name: "Boiler", power: 550, daily: 0.5, voltage: 230 },
      { id: "fan", name: "Dachlüfter", power: 25, daily: 2, voltage: 24 },
      { id: "oven", name: "Backofen", power: 1135, daily: 0.5, voltage: 230 },
    ];
    const tb: TravelBehavior = {
      season: "all_year",
      tripDuration: "permanent",
      winterLocation: "southern",
      standingDuration: "long",
    };
    const roofAreas: RoofArea[] = [
      // 4 m × 2 m rigid = 8 m² × 200 Wp/m² × 0.8 packing = 1 280 Wp
      { id: "r", name: "Hauptfläche", length: 400, width: 200 },
    ];
    const out = computeAlgorithm(
      minimalInput({
        systemVoltage: 24,
        vehicleVoltage: 24,
        consumers,
        energySources: ["solar"], // NO alternator, NO bags — user's real setup
        roofAreas,
        travelBehavior: tb,
        autarchyDays: 60, // max for permanent + solar_or_alt
        simultaneousLoad: "moderate",
      }),
    );
    // Must land inside the "empirical comfort zone": 200 Ah is known-sufficient,
    // 250 Ah is "comfortable"; we aim for recommended ≈ 220–320 Ah (includes
    // the 1.25 reserve on top of the 200 Ah empirical floor).
    expect(out.battery.recommendedCapacityAh).toBeGreaterThan(200);
    expect(out.battery.recommendedCapacityAh).toBeLessThan(320);
  });

  it("autarchyDays beyond AUTARCHY_MAX_BRIDGE_DAYS yields the same Ah as the cap", () => {
    // Anything > 14 days maps to the same effective bridge, so 30 d and
    // 77 d must produce the same recommendation on a solar+alternator
    // permanent user.
    const consumers: Consumer[] = [
      { id: "led", name: "LED", power: 20, daily: 2, voltage: 24 },
      { id: "router", name: "WLAN", power: 7, daily: 24, voltage: 24 },
    ];
    const tb: TravelBehavior = {
      season: "all_year",
      tripDuration: "permanent",
      winterLocation: "southern",
      standingDuration: "long",
    };
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Roof", length: 400, width: 200 },
    ];
    const base = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      energySources: ["solar", "alternator"],
      roofAreas,
      travelBehavior: tb,
    });
    const at30 = computeAlgorithm({ ...base, autarchyDays: 30 });
    const at77 = computeAlgorithm({ ...base, autarchyDays: 77 });
    expect(at77.battery.recommendedCapacityAh).toBeCloseTo(
      at30.battery.recommendedCapacityAh,
      6,
    );
  });
});

describe("sizeBattery — autarchyDays grows the bank with solar+alternator", () => {
  // Regression: before the AUTARCHY_PSH_DERATE + AUTARCHY_ALTERNATOR_DERATE
  // tightening, a typical camper with solar+alternator landed in the
  // `netDailyDeficitWh = 0` branch, so the autarky slider had no visible
  // effect on the recommended Ah — it clamped against the 1-day hard floor
  // regardless. This test nails down that the user sees a growing bank when
  // they push the "Lang" preset.
  it("autarchyDays 2 → 7 strictly grows recommendedCapacityAh for a realistic van", () => {
    const consumers: Consumer[] = [
      { id: "f", name: "Fridge", power: 60, daily: 24, voltage: 12 },
      { id: "l", name: "Laptop", power: 90, daily: 4, voltage: 230 },
    ];
    const roofAreas: RoofArea[] = [
      { id: "r", name: "Roof", length: 200, width: 100 },
    ];
    const tb: TravelBehavior = {
      season: "summer",
      tripDuration: "week",
      winterLocation: "germany",
      standingDuration: "short",
    };
    const base = minimalInput({
      consumers,
      energySources: ["solar", "alternator"],
      roofAreas,
      travelBehavior: tb,
    });
    const low = computeAlgorithm({ ...base, autarchyDays: 2 });
    const high = computeAlgorithm({ ...base, autarchyDays: 7 });

    // At 7 days the soft bridge has overtaken the 2-day hard floor for
    // this realistic setup, so the slider starts moving the Ah up again.
    expect(high.battery.bindingBranch).toBe("soft");
    expect(high.battery.recommendedCapacityAh).toBeGreaterThan(
      low.battery.recommendedCapacityAh,
    );
  });
});

describe("sizeBattery — monotonicity on autarchyDays", () => {
  it("more autarky days never shrinks the recommended battery", () => {
    const consumers: Consumer[] = [
      { id: "f", name: "Fridge", power: 60, daily: 24, voltage: 12 },
    ];
    const base = minimalInput({ consumers, autarchyDays: 1 });
    const a = computeAlgorithm({ ...base, autarchyDays: 1 });
    const b = computeAlgorithm({ ...base, autarchyDays: 2 });
    const c = computeAlgorithm({ ...base, autarchyDays: 3 });
    expect(b.battery.recommendedCapacityAh).toBeGreaterThanOrEqual(
      a.battery.recommendedCapacityAh,
    );
    expect(c.battery.recommendedCapacityAh).toBeGreaterThanOrEqual(
      b.battery.recommendedCapacityAh,
    );
  });
});

describe("shore power — battery soft-bridge relief", () => {
  const tb: TravelBehavior = {
    season: "all_year",
    tripDuration: "permanent",
    winterLocation: "southern",
    standingDuration: "long",
  };
  const consumers: Consumer[] = [
    { id: "f", name: "Fridge", power: 60, daily: 24, voltage: 24 },
  ];
  const roofAreas: RoofArea[] = [
    { id: "r", name: "Roof", length: 400, width: 200 },
  ];

  it("autarchy at threshold leaves shore relief at 0 and matches solar-only Ah", () => {
    const base = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      energySources: ["solar"],
      roofAreas,
      travelBehavior: tb,
      autarchyDays: 2,
    });
    const solarOnly = computeAlgorithm(base);
    const withShore = computeAlgorithm({
      ...base,
      energySources: ["solar", "shore_power"],
    });
    expect(withShore.battery.shoreBridgeReliefEffectiveDays).toBe(0);
    expect(withShore.battery.recommendedCapacityAh).toBeCloseTo(
      solarOnly.battery.recommendedCapacityAh,
      6,
    );
  });

  it("long autarchy + shore shrinks soft-bridge days vs solar-only", () => {
    const base = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      energySources: ["solar"],
      roofAreas,
      travelBehavior: tb,
      autarchyDays: 14,
    });
    const solarOnly = computeAlgorithm(base);
    const withShore = computeAlgorithm({
      ...base,
      energySources: ["solar", "shore_power"],
    });
    expect(withShore.battery.shoreBridgeReliefEffectiveDays).toBeGreaterThan(0);
    expect(withShore.battery.autarchyBridgeDaysForSoft).toBeLessThan(
      solarOnly.battery.autarchyBridgeDaysForSoft,
    );
    expect(withShore.battery.recommendedCapacityAh).toBeLessThanOrEqual(
      solarOnly.battery.recommendedCapacityAh,
    );
  });

  it("adding shore never increases recommended Ah (monotonicity)", () => {
    const base = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      energySources: ["solar"],
      roofAreas,
      travelBehavior: tb,
      autarchyDays: 10,
    });
    const without = computeAlgorithm(base);
    const withShore = computeAlgorithm({
      ...base,
      energySources: ["solar", "shore_power"],
    });
    expect(withShore.battery.recommendedCapacityAh).toBeLessThanOrEqual(
      without.battery.recommendedCapacityAh,
    );
  });

  it("alternator + short standing zeros shore relief despite shore_power", () => {
    const shortTb: TravelBehavior = { ...tb, standingDuration: "short" };
    const base = minimalInput({
      systemVoltage: 24,
      vehicleVoltage: 24,
      consumers,
      energySources: ["solar", "alternator", "shore_power"],
      roofAreas,
      travelBehavior: shortTb,
      autarchyDays: 30,
    });
    const out = computeAlgorithm(base);
    expect(out.battery.hasAlternator).toBe(true);
    expect(out.battery.shoreReliefAlternatorScale).toBe(0);
    expect(out.battery.shoreBridgeReliefEffectiveDays).toBe(0);
  });
});
