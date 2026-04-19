/**
 * Derived signals — 1:1 mirror of SECTION E of
 * `docs/reference/algorithm/camper_electrics_sizing.py`.
 *
 * Deterministic, pure lookups from input into intermediate signals used by
 * the sub-calculations. Each maps 1:1 to a table in inputs.md A.7 or a
 * reference file.
 */

import {
  BOOSTER_EFFICIENCY,
  DRIVE_HOURS_PER_DAY,
  MAX_AUTARCHY_DAYS,
  PSH_TABLE,
  ROOF_PACKING_FACTOR,
  WP_PER_M2,
  type AutarchyTopUpProfile,
} from "./constants";
import type {
  AlgorithmInput,
  Consumer,
  EnergySource,
  RoofArea,
  RoofModuleType,
  ShoreAvailability,
  TravelBehavior,
} from "./types";

/**
 * inputs.md A.7.1. Drive-hours per day from `(tripDuration, standingDuration)`.
 * Returns 0 when `'alternator'` is not in `energySources`.
 */
export function driveHours(
  travel: TravelBehavior,
  energySources: readonly EnergySource[],
): number {
  if (!energySources.includes("alternator")) return 0;
  // `DRIVE_HOURS_PER_DAY[trip][standing]` covers both 2-axis rows
  // (`week`/`extended`) and "any standing" rows (`weekend`/`permanent`, where
  // all three standing-duration entries hold the same value).
  return DRIVE_HOURS_PER_DAY[travel.tripDuration][travel.standingDuration];
}

/**
 * inputs.md A.7.2.
 *
 * Precedence:
 *   1. `'shore_power'` not in `energySources` -> `'never'`
 *   2. `permanent` + non-`slow` charger -> `'full_time'`
 *   3. `chargerSpeed` mapping -> `occasional` / `nightly` / `nightly_fast`
 */
export function shoreAvailability(input: AlgorithmInput): ShoreAvailability {
  if (!input.energySources.includes("shore_power")) return "never";
  if (
    input.travelBehavior.tripDuration === "permanent" &&
    input.chargerSpeed !== "slow"
  ) {
    return "full_time";
  }
  if (input.chargerSpeed === "slow") return "occasional";
  if (input.chargerSpeed === "normal") return "nightly";
  if (input.chargerSpeed === "fast") return "nightly_fast";
  // Defensive — unreachable after validation.
  throw new Error(
    `chargerSpeed=${JSON.stringify(input.chargerSpeed)} has no shoreAvailability mapping`,
  );
}

/** PSH lookup (references/solar.md). `all_year` is the annual average. */
export function psh(travel: TravelBehavior): number {
  return PSH_TABLE[travel.winterLocation][travel.season];
}

/**
 * Split consumers into DC / AC Wh and peak W totals.
 *
 * `loadWh` per consumer:
 *   `loadWh = power * daily * (averageLoadPercent / 100 ?? 1)`
 *   if `coolingMethod === 'absorber'` and `electricShare` set:
 *     `loadWh *= electricShare`
 *
 * `voltage === 230` routes the load through the inverter (AC side); all
 * other voltages stay on the DC bus.
 */
export function classifyConsumers(consumers: readonly Consumer[]): {
  dcWh: number;
  acWh: number;
  peakAcW: number;
  peakDcW: number;
} {
  let dcWh = 0;
  let acWh = 0;
  let peakAcW = 0;
  let peakDcW = 0;
  for (const c of consumers) {
    const factor =
      c.averageLoadPercent !== undefined ? c.averageLoadPercent / 100 : 1;
    let loadWh = c.power * c.daily * factor;
    if (c.coolingMethod === "absorber" && c.electricShare !== undefined) {
      loadWh *= c.electricShare;
    }
    if (c.voltage === 230) {
      acWh += loadWh;
      peakAcW += c.power;
    } else {
      dcWh += loadWh;
      peakDcW += c.power;
    }
  }
  return { dcWh, acWh, peakAcW, peakDcW };
}

/** Total roof Wp from rectangular patches × density × packing factor. */
export function roofWp(
  roofAreas: readonly RoofArea[],
  roofModuleType: RoofModuleType,
): number {
  const wpPerM2 = WP_PER_M2[roofModuleType];
  let total = 0;
  for (const area of roofAreas) {
    // cm × cm → m² (divide by 10 000).
    const areaM2 = (area.length * area.width) / 10_000;
    total += areaM2 * wpPerM2 * ROOF_PACKING_FACTOR;
  }
  return total;
}

/**
 * Classify the user's selected `energySources` into the three top-up
 * profiles used by `MAX_AUTARCHY_DAYS`. `shore_power` is intentionally
 * ignored — shore power does not help while off-grid (that's the whole
 * point of the autarky window).
 */
export function autarchyTopUpProfile(
  input: AlgorithmInput,
): AutarchyTopUpProfile {
  const hasSolar = input.energySources.includes("solar");
  const hasAlternator = input.energySources.includes("alternator");
  if (hasSolar && hasAlternator) return "solar_and_alt";
  if (hasSolar || hasAlternator) return "solar_or_alt";
  return "battery_only";
}

/**
 * Inclusive soft-autarky cap from `(tripDuration, topUpProfile)`. This is
 * the value the wizard slider max must match and the value `validate` and
 * `computeAlgorithm` clamp user input against.
 */
export function autarchyMaxDays(input: AlgorithmInput): number {
  const profile = autarchyTopUpProfile(input);
  return MAX_AUTARCHY_DAYS[input.travelBehavior.tripDuration][profile];
}

/**
 * Estimate the daily alternator top-up [Wh/day] available during the
 * autarky window, **without** the battery-acceptance clamp that
 * `sizeBooster` applies.
 *
 * Why: the real booster output is clamped by `C_rate × battery.capacity`,
 * but the battery size is what we are computing. Using the battery clamp
 * here would create a circular dependency (small battery → small top-up →
 * bigger battery → bigger top-up → …). We therefore use the alternator
 * ceiling alone for the battery-sizing estimate and accept that this is
 * slightly optimistic for AGM/Gel banks whose acceptance may be the
 * binding limit in the final product. The `RESERVE_FACTOR` + `HARD_BRIDGE_DAYS`
 * floor in `sizeBattery` absorb that optimism.
 *
 * Returns 0 when `alternator` is not in `energySources`.
 */
export function alternatorTopUpEstimateWh(
  driveHoursPerDay: number,
  input: AlgorithmInput,
  alternatorLimitA: number,
): number {
  if (!input.energySources.includes("alternator")) return 0;
  const alternatorMaxOutputA =
    (alternatorLimitA * input.vehicleVoltage) / input.systemVoltage;
  return (
    driveHoursPerDay *
    alternatorMaxOutputA *
    input.systemVoltage *
    BOOSTER_EFFICIENCY
  );
}
