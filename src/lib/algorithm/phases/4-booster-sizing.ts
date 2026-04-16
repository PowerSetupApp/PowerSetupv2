import type { AlgorithmInput, BoosterRecommendation } from "../types";
import { ALTERNATOR_DRIVE_HOURS, BOOSTER_EFFICIENCY, DEFAULT_BOOSTER_AMPS } from "../constants";
import { getSetting } from "./settings";

export function calculateBooster(input: AlgorithmInput, standingDays: number): BoosterRecommendation {
  const hasAlternator = input.energySources.includes("alternator");

  if (!hasAlternator) {
    return {
      needed: false,
      inputCurrentA: 0,
      outputCurrentA: 0,
      currentA: 0,
      inputVoltage: input.vehicleVoltage,
      outputVoltage: input.systemVoltage,
      needsConversion: false,
      dailyAlternatorChargeWh: 0,
    };
  }

  const defaultAmps = getSetting(input, "defaultBoosterAmps", DEFAULT_BOOSTER_AMPS);
  const boosterEff = getSetting(input, "boosterEfficiency", BOOSTER_EFFICIENCY);
  const driveHours = getSetting(input, "alternatorDriveHours", ALTERNATOR_DRIVE_HOURS);

  const standardInputCurrentA = defaultAmps;
  const standardOutputCurrentA =
    (input.vehicleVoltage * standardInputCurrentA * boosterEff) / input.systemVoltage;

  let effectiveInputCurrentA = standardInputCurrentA;
  let effectiveOutputCurrentA = standardOutputCurrentA;

  if (input.customOverrides.booster !== null) {
    effectiveOutputCurrentA = input.customOverrides.booster;
    effectiveInputCurrentA =
      (input.systemVoltage * effectiveOutputCurrentA) / (input.vehicleVoltage * boosterEff);
  }

  const dailyAlternatorChargeWh =
    (effectiveOutputCurrentA * input.systemVoltage * driveHours) / standingDays;

  return {
    needed: true,
    inputCurrentA: effectiveInputCurrentA,
    outputCurrentA: effectiveOutputCurrentA,
    currentA: effectiveOutputCurrentA,
    originalCurrentA: standardOutputCurrentA,
    inputVoltage: input.vehicleVoltage,
    outputVoltage: input.systemVoltage,
    needsConversion: input.vehicleVoltage !== input.systemVoltage,
    dailyAlternatorChargeWh: Math.round(dailyAlternatorChargeWh),
  };
}
