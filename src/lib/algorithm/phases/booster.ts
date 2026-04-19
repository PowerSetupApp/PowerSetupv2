/**
 * Phase: booster sizing — 1:1 mirror of `_size_booster` in
 * `docs/reference/algorithm/camper_electrics_sizing.py`.
 *
 * Formulas (references/alternator.md + inputs.md C.3):
 *   iOut = min(
 *     C_RATE_CHARGE_MAX[chem] * recommendedCapacityAh,
 *     alternatorLimitA * vehicleVoltage / systemVoltage,
 *   )
 *   iIn       = systemVoltage * iOut / (vehicleVoltage * BOOSTER_EFFICIENCY)
 *   eDriveWh  = driveHours * iOut * systemVoltage * BOOSTER_EFFICIENCY
 */

import { BOOSTER_EFFICIENCY, C_RATE_CHARGE_MAX } from "../constants";
import type {
  AlgorithmInput,
  BatteryRecommendation,
  BoosterRecommendation,
} from "../types";

export function sizeBooster(
  battery: BatteryRecommendation,
  driveHoursPerDay: number,
  input: AlgorithmInput,
  alternatorLimitA: number,
): BoosterRecommendation {
  const chem = input.batteryPreference;
  const needsConversion = input.vehicleVoltage !== input.systemVoltage;
  const needed = input.energySources.includes("alternator");

  if (!needed) {
    return {
      needed: false,
      inputCurrentA: 0,
      outputCurrentA: 0,
      currentA: 0,
      inputVoltage: input.vehicleVoltage,
      outputVoltage: input.systemVoltage,
      needsConversion,
      dailyAlternatorChargeWh: 0,
    };
  }

  const batteryAcceptA =
    C_RATE_CHARGE_MAX[chem] * battery.recommendedCapacityAh;
  // Alternator's safe continuous power translated to house-side current.
  //   P_alt   = alternatorLimitA * vehicleVoltage
  //   I_house = P_alt / systemVoltage
  const alternatorMaxOutputA =
    (alternatorLimitA * input.vehicleVoltage) / input.systemVoltage;
  const outputCurrentA = Math.min(batteryAcceptA, alternatorMaxOutputA);
  const inputCurrentA =
    (input.systemVoltage * outputCurrentA) /
    (input.vehicleVoltage * BOOSTER_EFFICIENCY);
  const dailyAlternatorChargeWh =
    driveHoursPerDay *
    outputCurrentA *
    input.systemVoltage *
    BOOSTER_EFFICIENCY;

  return {
    needed: true,
    inputCurrentA,
    outputCurrentA,
    // Legacy alias — kept equal to `outputCurrentA`.
    currentA: outputCurrentA,
    inputVoltage: input.vehicleVoltage,
    outputVoltage: input.systemVoltage,
    needsConversion,
    dailyAlternatorChargeWh,
  };
}
