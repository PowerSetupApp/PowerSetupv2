import type { AlgorithmInput, Consumer, InverterRecommendation } from "../types";
import { STANDARD_INVERTER_SIZES } from "../constants";
import type { AlgorithmTrace } from "../trace";
import { pushStep } from "../trace";
import { roundUpToStandard } from "./1-energy-demand";

export function calculateInverter(
  input: AlgorithmInput,
  consumers: Consumer[],
  simultaneousFactor: number,
  trace?: AlgorithmTrace,
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
  const inverterClasses = input.componentClasses?.inverter ?? STANDARD_INVERTER_SIZES;
  const standardRecommendedW = roundUpToStandard(peakLoadW, inverterClasses);

  let effectiveRecommendedW = standardRecommendedW;
  if (input.customOverrides.inverter !== null) {
    effectiveRecommendedW = input.customOverrides.inverter;
  }

  pushStep(trace, {
    phase: "inverter",
    id: "inverter.peakLoad",
    label: "Peak-Last",
    value: Math.round(peakLoadW),
    unit: "W",
    kind: "intermediate",
    formula: `max(${Math.round(maxSingleLoad)}) + (Σ230V ${Math.round(
      total230VPower,
    )} − max) × ${simultaneousFactor}`,
  });
  pushStep(trace, {
    phase: "inverter",
    id: "inverter.recommendedW",
    label: "Empfohlener Wechselrichter",
    value: effectiveRecommendedW,
    unit: "W",
    kind: "output",
  });

  return {
    needed: true,
    peakLoadW: Math.round(peakLoadW),
    recommendedW: effectiveRecommendedW,
    originalRecommendedW: standardRecommendedW,
  };
}
