import {
  applyCustomOverrides,
  computeAlgorithm,
  type ComputeOptions,
} from "@/lib/algorithm";
import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";

/**
 * Centralised algorithm entry point used by both wizard-side preview and the
 * `/api/generate/[id]` pipeline. Runs the pure algorithm and then applies the
 * user's manual overrides (battery capacity / solar Wp only — see
 * `src/lib/algorithm/apply-custom-overrides.ts` for the full list).
 *
 * Everything else — brand preferences, product matching, AI selection —
 * happens downstream of this function.
 */
export function runAlgorithm(
  input: AlgorithmInput,
  options: ComputeOptions = {},
): AlgorithmOutput {
  const raw = computeAlgorithm(input, options);
  return applyCustomOverrides(raw, input.customOverrides);
}
