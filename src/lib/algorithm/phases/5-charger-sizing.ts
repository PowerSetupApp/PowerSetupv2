import type { AlgorithmInput, ChargerRecommendation } from "../types";
import { STANDARD_CURRENT_SIZES } from "../constants";
import { getChargerTimeHours, roundUpToStandard } from "./1-energy-demand";

export function calculateCharger(input: AlgorithmInput, batteryAh: number): ChargerRecommendation {
  const hasShorePower = input.energySources.includes("shore_power");

  if (!hasShorePower) {
    return {
      needed: false,
      targetCurrentA: 0,
      recommendedCurrentA: 0,
      chargingTimeHours: 0,
    };
  }

  const chargerTimeHours = getChargerTimeHours(input.chargerSpeed, input);
  const standardSizes = STANDARD_CURRENT_SIZES;
  const targetCurrentA = batteryAh / chargerTimeHours;
  const standardRecommendedCurrentA = roundUpToStandard(targetCurrentA, standardSizes);

  let effectiveRecommendedCurrentA = standardRecommendedCurrentA;
  if (input.customOverrides.charger !== null) {
    effectiveRecommendedCurrentA = input.customOverrides.charger;
  }

  const actualChargingTimeHours = batteryAh / effectiveRecommendedCurrentA;

  return {
    needed: true,
    targetCurrentA: Math.round(targetCurrentA * 10) / 10,
    recommendedCurrentA: effectiveRecommendedCurrentA,
    originalRecommendedCurrentA: standardRecommendedCurrentA,
    chargingTimeHours: Math.round(actualChargingTimeHours * 10) / 10,
  };
}
