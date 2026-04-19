/**
 * Phase: battery sizing — coverage-capped bridge + 1-day hard floor.
 *
 * Every wizard input (autarky days, solar panels, solar bags, alternator,
 * trip duration, standing duration, season, location, consumers) affects
 * the recommendation linearly or monotonically — no binary cliffs.
 *
 * Model (see `references/batteries.md` + `references/solar.md`):
 *
 *   solarTopUpWh   = hasSolar      ? totalWp × psh × AUTARCHY_PSH_DERATE
 *                                    × SOLAR_SYSTEM_EFFICIENCY            : 0
 *   alternatorTopUpWh = hasAlternator ? ctx.alternatorTopUpWh             : 0
 *   dailyTopUpWh   = solarTopUpWh + alternatorTopUpWh
 *
 *   dailyTopUpWh   = solar + alternator (full — display / net deficit)
 *   dailyTopUpCov  = solar + alternator × STANDING_CREDIT[stand] (coverage only)
 *   rawCoverage    = dailyTopUpCov / dailyWh
 *   baseCap        = topUpCoverageBaseCapForPsh(psh)  ← falls with low PSH
 *   capStand       = (baseCap + portableBump) × STANDING_CAP_MULT[stand]
 *                    (×1 without alternator) — breaks `permanent` plateau
 *   coverageRatio  = min(rawCoverage, min(capStand, ABS_MAX))
 *   bridgeDailyDeficitWh = dailyWh × (1 − coverageRatio)     ← always > 0
 *
 *   bridgeDays     = min(autarchyDays, AUTARCHY_MAX_BRIDGE_DAYS)
 *   softBridgeWh   = bridgeDailyDeficitWh × bridgeDays
 *   hardFloorWh    = dailyWh × HARD_BRIDGE_DAYS              ← 1 day
 *   energyWh       = max(softBridgeWh, hardFloorWh)
 *
 *   C_usable_Wh    = energyWh / η_roundtrip
 *   C_nom_Wh       = C_usable_Wh / DoD
 *   minAh          = C_nom_Wh / systemVoltage
 *   recAh          = minAh × RESERVE_FACTOR
 *
 * Why cap coverage? Without it, `max(daily − topUp, 0)` collapses to 0 as
 * soon as solar + alternator cover daily demand — which made the autarky
 * slider, solar-bag toggle and alternator on/off invisible in the UI (only
 * the hard floor binds). The **base** cap (PSH-scaled, then portable bump)
 * reflects that part of daily demand is not offsettable from PV+alt alone;
 * at high PSH it matches the historical ~0.75 plateau, at low PSH it drops
 * so grey winters grow the bank even when raw coverage barely exceeds 0.75.
 *
 * `netDailyDeficitWh` (output field) keeps the RAW deficit
 * (`max(daily − topUp, 0)`) for downstream displays; `bridgeDailyDeficitWh`
 * is the coverage-capped value that actually drives `softBridgeWh`.
 */

import {
  AUTARCHY_MAX_BRIDGE_DAYS,
  AUTARCHY_PSH_DERATE,
  DOD_DEFAULTS,
  HARD_BRIDGE_DAYS,
  RESERVE_FACTOR,
  ROUNDTRIP_DEFAULTS,
  SOLAR_SYSTEM_EFFICIENCY,
  TOP_UP_COVERAGE_ABS_MAX,
  TOP_UP_COVERAGE_CAP,
  TOP_UP_COVERAGE_CAP_AT_LOW_PSH,
  TOP_UP_COVERAGE_PORTABLE_CAP_BUMP,
  TOP_UP_COVERAGE_PORTABLE_WEIGHT,
  TOP_UP_COVERAGE_PSH_BAND_HIGH,
  TOP_UP_COVERAGE_PSH_BAND_LOW,
  ALTERNATOR_BRIDGE_STANDING_CREDIT,
  TOP_UP_COVERAGE_STANDING_CAP_MULT,
} from "../constants";
import type { AlgorithmInput, BatteryRecommendation, TripDuration } from "../types";

/**
 * Base `min(rawCoverage, …)` cap before the portable-solar bump. High PSH
 * (south / summer) keeps the full {@link TOP_UP_COVERAGE_CAP}; low PSH
 * reduces trusted offset so winter location affects battery Ah even when
 * raw coverage sits just above the nominal 0.75 plateau.
 */
export function topUpCoverageBaseCapForPsh(psh: number): number {
  const hi = TOP_UP_COVERAGE_PSH_BAND_HIGH;
  const lo = TOP_UP_COVERAGE_PSH_BAND_LOW;
  const capHi = TOP_UP_COVERAGE_CAP;
  const capLo = TOP_UP_COVERAGE_CAP_AT_LOW_PSH;
  if (psh >= hi) return capHi;
  if (psh <= lo) return capLo;
  const t = (psh - lo) / (hi - lo);
  return capLo + (capHi - capLo) * t;
}

export interface BatteryTopUpContext {
  /** Peak sun hours for the chosen season / winter location (already in `compute.ts`). */
  psh: number;
  /** Roof + portable Wp available to the user (from `sizeSolar`). */
  totalAvailableWp: number;
  /**
   * Daily alternator top-up estimate [Wh/day] from
   * `alternatorTopUpEstimateWh(...)` — uses the alternator ceiling, NOT the
   * battery-acceptance clamp, to avoid circular sizing.
   */
  alternatorTopUpWh: number;
  /**
   * Bridge solar top-up [Wh/day] from **portable bags only** — same physics
   * as the portable slice of `solarTopUpWh` but split out so the coverage
   * cap can rise when the user adds deployable panels (see
   * `TOP_UP_COVERAGE_PORTABLE_*` constants). `0` when no solar or no bags.
   */
  portableBridgeSolarWh?: number;
}

export function sizeBattery(
  dailyWh: number,
  effectiveAutarchyDays: number,
  input: AlgorithmInput,
  context: BatteryTopUpContext,
): BatteryRecommendation {
  const chem = input.batteryPreference;
  const dod = DOD_DEFAULTS[chem];
  const etaRt = ROUNDTRIP_DEFAULTS[chem];
  const uSys = input.systemVoltage;

  const hasSolar = input.energySources.includes("solar");
  const hasAlternator = input.energySources.includes("alternator");

  const solarTopUpWh = hasSolar
    ? context.totalAvailableWp *
      context.psh *
      AUTARCHY_PSH_DERATE *
      SOLAR_SYSTEM_EFFICIENCY
    : 0;
  // Full alternator Wh (drive-hours × limit × η) — same for display,
  // `netDailyDeficitWh`, and phases after battery. Coverage bridge below
  // applies `ALTERNATOR_BRIDGE_STANDING_CREDIT` so long-standing profiles
  // do not hit the same `min(raw, cap)` plateau as short-standing when both
  // raw averages exceed the PSH-based cap.
  const alternatorTopUpWh = hasAlternator ? context.alternatorTopUpWh : 0;
  const dailyTopUpWh = solarTopUpWh + alternatorTopUpWh;
  const alternatorBridgeStandingCredit = hasAlternator
    ? ALTERNATOR_BRIDGE_STANDING_CREDIT[input.travelBehavior.standingDuration]
    : undefined;
  const alternatorTopUpForCoverageWh = hasAlternator
    ? alternatorTopUpWh * (alternatorBridgeStandingCredit ?? 1)
    : 0;
  const dailyTopUpWhForCoverage = solarTopUpWh + alternatorTopUpForCoverageWh;

  // Cap the bad-weather streak we size for. Over horizons longer than
  // AUTARCHY_MAX_BRIDGE_DAYS the seasonal average dominates and the
  // "every day is bad" assumption stops being physical — otherwise the
  // formula produces absurd multi-thousand-Ah banks for permanent users
  // who set 60+ days on the slider.
  const bridgeDays = Math.min(effectiveAutarchyDays, AUTARCHY_MAX_BRIDGE_DAYS);

  // RAW deficit for display / telemetry — collapses to 0 when solar+alt
  // fully cover daily demand.
  const netDailyDeficitWh = Math.max(dailyWh - dailyTopUpWh, 0);

  // COVERAGE-CAPPED deficit that actually drives the bridge. Even with
  // surplus solar, we assume at least (1 − TOP_UP_COVERAGE_CAP) of daily
  // demand must come from the battery during each autarky day (night,
  // dawn/dusk, fridge cycle, router + heater controller), so the slider
  // always has leverage.
  const rawCoverage = dailyWh > 0 ? dailyTopUpWhForCoverage / dailyWh : 0;
  // Base cap keeps the slider alive when roof+alt already oversupply dailyWh.
  // Portable-only bridge Wh bumps the cap: bags are aimable in bad weather,
  // so they marginally increase how much of `dailyWh` we trust top-ups to
  // cover — without this bump, `min(raw, 0.75)` ignores every extra bag Wp.
  const portableBridgeSolarWh = context.portableBridgeSolarWh ?? 0;
  const portableCredibilityBump =
    dailyWh > 0 && portableBridgeSolarWh > 0
      ? Math.min(
          TOP_UP_COVERAGE_PORTABLE_CAP_BUMP,
          (portableBridgeSolarWh / dailyWh) * TOP_UP_COVERAGE_PORTABLE_WEIGHT,
        )
      : 0;
  const baseCoverageCap = topUpCoverageBaseCapForPsh(context.psh);
  const capBeforeStanding = Math.min(
    TOP_UP_COVERAGE_ABS_MAX,
    baseCoverageCap + portableCredibilityBump,
  );
  const trip: TripDuration = input.travelBehavior.tripDuration;
  const standingCoverageCapMult =
    hasAlternator &&
    trip === "permanent" &&
    input.travelBehavior.standingDuration !== "short"
      ? TOP_UP_COVERAGE_STANDING_CAP_MULT[input.travelBehavior.standingDuration]
      : 1;
  const effectiveCoverageCap = Math.min(
    TOP_UP_COVERAGE_ABS_MAX,
    capBeforeStanding * standingCoverageCapMult,
  );
  const coverageRatio = Math.min(rawCoverage, effectiveCoverageCap);
  const bridgeDailyDeficitWh = dailyWh * (1 - coverageRatio);
  const softBridgeWh = bridgeDailyDeficitWh * bridgeDays;

  // Storm reserve: one full off-grid day with no top-up at all. Applies
  // uniformly; the soft bridge above scales when the user sets more
  // autarky days.
  const hardFloorWh = dailyWh * HARD_BRIDGE_DAYS;

  const bindingBranch: "soft" | "hard" =
    softBridgeWh >= hardFloorWh ? "soft" : "hard";
  const energyWh = Math.max(softBridgeWh, hardFloorWh);

  const cUsableWh = energyWh / etaRt;
  const cNomWh = cUsableWh / dod;
  const minCapacityAh = uSys > 0 ? cNomWh / uSys : 0;
  const recommendedCapacityAh = minCapacityAh * RESERVE_FACTOR;

  return {
    dailyWh,
    minCapacityAh,
    recommendedCapacityAh,
    type: chem,
    voltage: uSys,
    autarchyDays: effectiveAutarchyDays,
    hasSolar,
    hasAlternator,
    solarTopUpWh,
    alternatorTopUpWh,
    dailyTopUpWh,
    ...(dailyTopUpWhForCoverage !== dailyTopUpWh
      ? {
          dailyTopUpWhForCoverage,
          alternatorBridgeStandingCredit,
        }
      : {}),
    netDailyDeficitWh,
    coverageRatio,
    effectiveCoverageCap,
    bridgeDailyDeficitWh,
    bindingBranch,
  };
}
