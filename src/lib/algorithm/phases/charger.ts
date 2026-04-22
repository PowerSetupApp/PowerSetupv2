/**
 * Phase: shore charger sizing — 1:1 mirror of `_size_charger` in
 * `docs/reference/algorithm/camper_electrics_sizing.py`.
 *
 * Formulas (references/shore-power.md + inputs.md C.4):
 *   targetC         = CHARGER_TARGET_C_RATE[shoreAvailability]
 *   iTarget         = targetC * recommendedCapacityAh
 *                     (full_time uses max(iTarget, iAvgLoad))
 *   iRecommended    = min(iTarget, C_RATE_CHARGE_MAX[chem] * cap)
 *   chargingTimeH   = cap * DoD / (iRec * CHARGER_EFFICIENCY) + ABSORPTION_TAIL_H[chem]
 */

import type { AlgorithmTuning } from "../algorithm-tuning";
import type {
  AlgorithmInput,
  BatteryRecommendation,
  ChargerRecommendation,
  ShoreAvailability,
} from "../types";

export function sizeCharger(
  battery: BatteryRecommendation,
  shoreAvail: ShoreAvailability,
  dailyWh: number,
  input: AlgorithmInput,
  tuning: AlgorithmTuning,
): ChargerRecommendation {
  if (shoreAvail === "never") {
    return {
      needed: false,
      targetCurrentA: 0,
      recommendedCurrentA: 0,
      chargingTimeHours: 0,
    };
  }

  const chem = input.batteryPreference;
  const cAh = battery.recommendedCapacityAh;
  const dod = tuning.dodDefaults[chem];
  const chemCeilingA = tuning.cRateChargeMax[chem] * cAh;

  let targetCurrentA: number;
  if (shoreAvail === "full_time") {
    // Cover the 24 h rolling-average load as a floor, otherwise use 0.25 C.
    const iAvgLoad =
      input.systemVoltage > 0 ? dailyWh / 24 / input.systemVoltage : 0;
    targetCurrentA = Math.max(
      tuning.chargerTargetCRate.full_time * cAh,
      iAvgLoad,
    );
  } else {
    targetCurrentA = tuning.chargerTargetCRate[shoreAvail] * cAh;
  }

  const recommendedCurrentA = Math.min(targetCurrentA, chemCeilingA);

  let chargingTimeHours = 0;
  if (recommendedCurrentA > 0) {
    chargingTimeHours =
      (cAh * dod) / (recommendedCurrentA * tuning.chargerEfficiency) +
      tuning.absorptionTailH[chem];
  }

  return {
    needed: true,
    targetCurrentA,
    recommendedCurrentA,
    chargingTimeHours,
  };
}
