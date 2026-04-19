/**
 * Main orchestrator — 1:1 mirror of SECTION G of
 * `docs/reference/algorithm/camper_electrics_sizing.py`.
 *
 * Validates the input, derives intermediate signals, runs every sub-phase in
 * dependency order and returns an `AlgorithmOutput` of raw numbers.
 *
 * The algorithm is a pure function. It ignores `customOverrides` and
 * `brandPreferences` — those are applied post-compute (see
 * `apply-custom-overrides.ts` and the recommendation layer respectively).
 */

import {
  ABSORPTION_TAIL_H,
  ALTERNATOR_CONTINUOUS_LIMIT_A,
  AUTARCHY_MAX_BRIDGE_DAYS,
  AUTARCHY_PSH_DERATE,
  TOP_UP_COVERAGE_CAP,
  TOP_UP_COVERAGE_STANDING_CAP_MULT,
  C_RATE_CHARGE_MAX,
  DOD_DEFAULTS,
  HARD_BRIDGE_DAYS,
  INVERTER_EFFICIENCY,
  SOLAR_SYSTEM_EFFICIENCY,
  INVERTER_STANDBY_HOURS,
  INVERTER_STANDBY_W,
  PEAK_FACTOR,
  ROUNDTRIP_DEFAULTS,
} from "./constants";
import {
  alternatorTopUpEstimateWh,
  autarchyMaxDays,
  autarchyTopUpProfile,
  classifyConsumers,
  driveHours,
  psh as computePsh,
  shoreAvailability,
} from "./derive";
import { sizeBattery, topUpCoverageBaseCapForPsh } from "./phases/battery";
import { sizeBooster } from "./phases/booster";
import { sizeCables } from "./phases/cables";
import { sizeCharger } from "./phases/charger";
import { sizeController, sizePortableController } from "./phases/controller";
import { sizeInverter } from "./phases/inverter";
import { sizeSolar } from "./phases/solar";
import type { AlgorithmInput, AlgorithmOutput } from "./types";
import { validate } from "./validate";

export interface ComputeOptions {
  /** When true, `AlgorithmOutput.breakdown` is populated. */
  explain?: boolean;
  /**
   * Safe continuous alternator current override. Defaults to
   * `ALTERNATOR_CONTINUOUS_LIMIT_A` (60 A). Override for documented
   * higher-output alternators.
   */
  alternatorLimitA?: number;
}

/**
 * Compute a camper 12 / 24 / 48 V electrical system.
 *
 * Raises `Error` on any invalid input or cross-field rule violation.
 * The return value is an `AlgorithmOutput` of raw numbers — the downstream
 * product-matching AI is responsible for rounding to standard Ah / Wp / mm²
 * sizes.
 */
export function computeAlgorithm(
  input: AlgorithmInput,
  options: ComputeOptions = {},
): AlgorithmOutput {
  const { explain = false, alternatorLimitA = ALTERNATOR_CONTINUOUS_LIMIT_A } =
    options;

  // Boundary validation — fail fast with a field-specific message.
  validate(input);

  // Clamp the autarky-days sentinel into the output domain.
  const maxDays = autarchyMaxDays(input);
  const effectiveAutarchyDays = Math.min(input.autarchyDays, maxDays);

  // Derived signals.
  const driveHoursPerDay = driveHours(
    input.travelBehavior,
    input.energySources,
  );
  const shoreAvail = shoreAvailability(input);
  const peakFactor = PEAK_FACTOR[input.simultaneousLoad];
  const psh = computePsh(input.travelBehavior);

  // Energy classification.
  const { dcWh, acWh, peakAcW, peakDcW } = classifyConsumers(input.consumers);

  // Inverter standby only when there is at least one AC load.
  const inverterStandbyWh =
    peakAcW > 0 ? INVERTER_STANDBY_W * INVERTER_STANDBY_HOURS : 0;
  const dailyWh = dcWh + acWh / INVERTER_EFFICIENCY + inverterStandbyWh;

  // Sub-calculations in dependency order.
  //
  // Battery sizing now subtracts an estimated solar + alternator top-up
  // from the daily load ("soft autarky"), so we have to know `totalAvailableWp`
  // and the alternator-only top-up before sizing the bank. The booster still
  // runs after battery because its output current is clamped by battery
  // acceptance (C-rate × recommendedCapacityAh) — see
  // `alternatorTopUpEstimateWh` for why this is intentional and not circular.
  const solar = sizeSolar(dailyWh, psh, input);
  const alternatorTopUpWh = alternatorTopUpEstimateWh(
    driveHoursPerDay,
    input,
    alternatorLimitA,
  );
  const portableBridgeSolarWh = input.energySources.includes("solar")
    ? solar.portableEffectiveWp *
      psh *
      AUTARCHY_PSH_DERATE *
      SOLAR_SYSTEM_EFFICIENCY
    : 0;
  const battery = sizeBattery(dailyWh, effectiveAutarchyDays, input, {
    psh,
    totalAvailableWp: solar.totalAvailableWp,
    alternatorTopUpWh,
    portableBridgeSolarWh,
  });
  const booster = sizeBooster(battery, driveHoursPerDay, input, alternatorLimitA);
  const charger = sizeCharger(battery, shoreAvail, dailyWh, input);
  const inverter = sizeInverter(peakAcW, peakFactor);
  const controller = sizeController(solar, input);
  const portableController = sizePortableController(solar, input);
  const cables = sizeCables(input, booster, charger, inverter, controller, peakDcW);

  const output: AlgorithmOutput = {
    battery,
    solar,
    booster,
    charger,
    inverter,
    controller,
    portableController,
    cables,
  };

  if (explain) {
    output.breakdown = {
      driveHoursPerDay,
      shoreAvailability: shoreAvail,
      peakFactor,
      psh,
      dcWh,
      acWh,
      peakAcW,
      peakDcW,
      inverterStandbyWh,
      dailyWh,
      effectiveAutarchyDays,
      maxAutarchyDaysForTrip: maxDays,
      autarchyTopUpProfile: autarchyTopUpProfile(input),
      alternatorLimitA,
      dod: DOD_DEFAULTS[input.batteryPreference],
      roundtripEfficiency: ROUNDTRIP_DEFAULTS[input.batteryPreference],
      chemCRateMax: C_RATE_CHARGE_MAX[input.batteryPreference],
      absorptionTailH: ABSORPTION_TAIL_H[input.batteryPreference],
      autarchyPshDerate: AUTARCHY_PSH_DERATE,
      autarchyMaxBridgeDays: AUTARCHY_MAX_BRIDGE_DAYS,
      topUpCoverageCap: TOP_UP_COVERAGE_CAP,
      topUpCoveragePshBaseCap: topUpCoverageBaseCapForPsh(psh),
      topUpCoverageStandingCapMult:
        battery.hasAlternator &&
        input.travelBehavior.tripDuration === "permanent" &&
        input.travelBehavior.standingDuration !== "short"
          ? TOP_UP_COVERAGE_STANDING_CAP_MULT[
              input.travelBehavior.standingDuration
            ]
          : 1,
      hardBridgeDays: HARD_BRIDGE_DAYS,
      autarchySolarTopUpWh: battery.solarTopUpWh,
      autarchyAlternatorTopUpWh: battery.alternatorTopUpWh,
      autarchyDailyTopUpWh: battery.dailyTopUpWh,
      autarchyDailyTopUpWhForCoverage:
        battery.dailyTopUpWhForCoverage ?? battery.dailyTopUpWh,
      alternatorBridgeStandingCredit:
        battery.alternatorBridgeStandingCredit ??
        (battery.hasAlternator ? 1 : 0),
      autarchyNetDailyDeficitWh: battery.netDailyDeficitWh,
      autarchyPortableBridgeSolarWh: portableBridgeSolarWh,
      autarchyCoverageRatio: battery.coverageRatio ?? 0,
      autarchyEffectiveCoverageCap: battery.effectiveCoverageCap ?? 0,
      autarchyBridgeDailyDeficitWh: battery.bridgeDailyDeficitWh ?? 0,
      autarchyBindingBranch: battery.bindingBranch,
    };
  }

  return output;
}
