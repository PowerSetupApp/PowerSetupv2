import type { AlgorithmInput, AlgorithmOutput } from "../types";

export function applyOverrides(
  output: AlgorithmOutput,
  overrides: AlgorithmInput["customOverrides"],
): AlgorithmOutput {
  const result = { ...output };

  if (overrides.battery !== null) {
    result.battery = { ...result.battery, recommendedCapacityAh: overrides.battery };
  }
  if (overrides.solar !== null) {
    result.solar = { ...result.solar, requiredWp: overrides.solar };
  }

  return result;
}
