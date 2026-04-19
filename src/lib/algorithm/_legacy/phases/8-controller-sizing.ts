import type { AlgorithmInput, ControllerRecommendation } from "../types";
import { SOLAR_CONTROLLER_SAFETY, STANDARD_CURRENT_SIZES } from "../constants";
import type { AlgorithmTrace } from "../trace";
import { pushStep } from "../trace";
import { roundUpToStandard } from "./1-energy-demand";
import { getSetting } from "./settings";

/**
 * Dimensioniert den Solar-Laderegler.
 *
 * Wichtig: `totalWp` = Dach + Portable. Wenn der Aufruf in `calculate.ts` nur
 * das Dach übergibt, ist der Regler bei portablen Solartaschen unterdimensioniert.
 * Siehe Fix 1 im Plan.
 */
export function calculateController(
  input: AlgorithmInput,
  totalWp: number,
  trace?: AlgorithmTrace,
): ControllerRecommendation {
  const hasSolar = input.energySources.includes("solar");

  if (!hasSolar || totalWp === 0) {
    return {
      needed: false,
      type: "mppt",
      currentA: 0,
      maxInputWp: 0,
    };
  }

  const safety = getSetting(input, "solarSafetyFactor", SOLAR_CONTROLLER_SAFETY, "controller", trace);
  const rawCurrentA = totalWp / input.systemVoltage;
  const bufferedCurrentA = rawCurrentA * safety;
  const controllerClasses = input.componentClasses?.solarController ?? STANDARD_CURRENT_SIZES;
  const standardCurrentA = roundUpToStandard(bufferedCurrentA, controllerClasses);

  let effectiveCurrentA = standardCurrentA;
  if (input.customOverrides.controller !== null) {
    effectiveCurrentA = input.customOverrides.controller;
  }

  pushStep(trace, {
    phase: "controller",
    id: "controller.rawCurrentA",
    label: "Roh-Strom",
    value: Math.round(rawCurrentA * 10) / 10,
    unit: "A",
    kind: "intermediate",
    formula: `${totalWp} Wp / ${input.systemVoltage} V`,
  });
  pushStep(trace, {
    phase: "controller",
    id: "controller.bufferedCurrentA",
    label: "Puffer-Strom",
    value: Math.round(bufferedCurrentA * 10) / 10,
    unit: "A",
    kind: "intermediate",
    formula: `${Math.round(rawCurrentA * 10) / 10} A × ${safety}`,
  });
  pushStep(trace, {
    phase: "controller",
    id: "controller.recommendedA",
    label: "Empfohlener Regler",
    value: effectiveCurrentA,
    unit: "A",
    kind: "output",
  });

  return {
    needed: true,
    type: "mppt",
    currentA: effectiveCurrentA,
    originalCurrentA: standardCurrentA,
    maxInputWp: totalWp,
  };
}
