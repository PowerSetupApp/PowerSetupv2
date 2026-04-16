import type { AlgorithmInput, ControllerRecommendation } from "../types";
import { SOLAR_CONTROLLER_SAFETY, STANDARD_CURRENT_SIZES } from "../constants";
import { roundUpToStandard } from "./1-energy-demand";
import { getSetting } from "./settings";

export function calculateController(input: AlgorithmInput, totalWp: number): ControllerRecommendation {
  const hasSolar = input.energySources.includes("solar");

  if (!hasSolar || totalWp === 0) {
    return {
      needed: false,
      type: "mppt",
      currentA: 0,
      maxInputWp: 0,
    };
  }

  const safety = getSetting(input, "solarControllerSafetyFactor", SOLAR_CONTROLLER_SAFETY);
  const rawCurrentA = totalWp / input.systemVoltage;
  const bufferedCurrentA = rawCurrentA * safety;
  const standardCurrentA = roundUpToStandard(bufferedCurrentA, STANDARD_CURRENT_SIZES);

  let effectiveCurrentA = standardCurrentA;
  if (input.customOverrides.controller !== null) {
    effectiveCurrentA = input.customOverrides.controller;
  }

  return {
    needed: true,
    type: "mppt",
    currentA: effectiveCurrentA,
    originalCurrentA: standardCurrentA,
    maxInputWp: totalWp,
  };
}
