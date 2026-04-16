import type { AlgorithmInput, Consumer, InverterRecommendation } from "../types";
import { STANDARD_INVERTER_SIZES } from "../constants";
import { roundUpToStandard } from "./1-energy-demand";

export function calculateInverter(
  input: AlgorithmInput,
  consumers: Consumer[],
  simultaneousFactor: number,
): InverterRecommendation {
  const consumers230V = consumers.filter((c) => c.voltage === 230);

  if (consumers230V.length === 0) {
    return {
      needed: false,
      peakLoadW: 0,
      recommendedW: 0,
    };
  }

  const total230VPower = consumers230V.reduce((sum, c) => sum + c.power, 0);
  const maxSingleLoad = Math.max(...consumers230V.map((c) => c.power));
  const peakLoadW = maxSingleLoad + (total230VPower - maxSingleLoad) * simultaneousFactor;
  const standardRecommendedW = roundUpToStandard(peakLoadW, STANDARD_INVERTER_SIZES);

  let effectiveRecommendedW = standardRecommendedW;
  if (input.customOverrides.inverter !== null) {
    effectiveRecommendedW = input.customOverrides.inverter;
  }

  return {
    needed: true,
    peakLoadW: Math.round(peakLoadW),
    recommendedW: effectiveRecommendedW,
    originalRecommendedW: standardRecommendedW,
  };
}
