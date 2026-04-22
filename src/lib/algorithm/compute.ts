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
  mergeAlgorithmTuning,
  type AlgorithmTuning,
  type ComputeOptions,
} from "./algorithm-tuning";
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

export type { ComputeOptions } from "./algorithm-tuning";

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
  const { explain = false, alternatorLimitA: alternatorLimitOpt, ...tuningOverrides } = options;
  const tuning = mergeAlgorithmTuning(tuningOverrides as Partial<AlgorithmTuning>);
  const alternatorLimitA = alternatorLimitOpt ?? tuning.alternatorContinuousLimitA;

  validate(input, tuning);

  const maxDays = autarchyMaxDays(input, tuning);
  const effectiveAutarchyDays = Math.min(input.autarchyDays, maxDays);

  const driveHoursPerDay = driveHours(
    input.travelBehavior,
    input.energySources,
    tuning,
  );
  const shoreAvail = shoreAvailability(input);
  const peakFactor = tuning.peakFactor[input.simultaneousLoad];
  const psh = computePsh(input.travelBehavior, tuning);

  const { dcWh, acWh, peakAcW, peakDcW } = classifyConsumers(input.consumers);

  const inverterStandbyWh =
    peakAcW > 0 ? tuning.inverterStandbyW * tuning.inverterStandbyHours : 0;
  const dailyWh =
    dcWh + acWh / tuning.inverterEfficiency + inverterStandbyWh;

  const solar = sizeSolar(dailyWh, psh, input, tuning);
  const alternatorTopUpWh = alternatorTopUpEstimateWh(
    driveHoursPerDay,
    input,
    alternatorLimitA,
    tuning,
  );
  const portableBridgeSolarWh = input.energySources.includes("solar")
    ? solar.portableEffectiveWp *
      psh *
      tuning.autarchyPshDerate *
      tuning.solarSystemEfficiency
    : 0;
  const battery = sizeBattery(dailyWh, effectiveAutarchyDays, input, {
    psh,
    shoreAvailability: shoreAvail,
    totalAvailableWp: solar.totalAvailableWp,
    alternatorTopUpWh,
    portableBridgeSolarWh,
  }, tuning);
  const booster = sizeBooster(battery, driveHoursPerDay, input, alternatorLimitA, tuning);
  const charger = sizeCharger(battery, shoreAvail, dailyWh, input, tuning);
  const inverter = sizeInverter(peakAcW, peakFactor);
  const controller = sizeController(solar, input);
  const portableController = sizePortableController(solar, input);
  const cables = sizeCables(input, booster, charger, inverter, controller, peakDcW, tuning);

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
      dod: tuning.dodDefaults[input.batteryPreference],
      roundtripEfficiency: tuning.roundtripDefaults[input.batteryPreference],
      chemCRateMax: tuning.cRateChargeMax[input.batteryPreference],
      absorptionTailH: tuning.absorptionTailH[input.batteryPreference],
      autarchyPshDerate: tuning.autarchyPshDerate,
      autarchyMaxBridgeDays: tuning.autarchyMaxBridgeDays,
      topUpCoverageCap: tuning.topUpCoverageCap,
      topUpCoveragePshBaseCap: topUpCoverageBaseCapForPsh(psh, tuning),
      topUpCoverageStandingCapMult:
        battery.hasAlternator &&
        input.travelBehavior.tripDuration === "permanent" &&
        input.travelBehavior.standingDuration !== "short"
          ? tuning.topUpCoverageStandingCapMult[
              input.travelBehavior.standingDuration
            ]
          : 1,
      hardBridgeDays: tuning.hardBridgeDays,
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
      shoreBridgeReliefBaseDays: battery.shoreBridgeReliefBaseDays,
      shoreBridgeReliefEffectiveDays: battery.shoreBridgeReliefEffectiveDays,
      shoreReliefAlternatorScale: battery.shoreReliefAlternatorScale,
      autarchyBridgeDaysRaw: battery.autarchyBridgeDaysRaw,
      autarchyBridgeDaysForSoft: battery.autarchyBridgeDaysForSoft,
      shoreBatteryReliefAutarchyThreshold:
        tuning.shoreBatteryReliefAutarchyThresholdDays,
    };
  }

  return output;
}
