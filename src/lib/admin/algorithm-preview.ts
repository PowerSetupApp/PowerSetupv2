import type { ComputeOptions } from "@/lib/algorithm";
import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";
import { runAlgorithm } from "@/lib/results/run-algorithm";

export type AlgorithmPreviewResult = {
  output: AlgorithmOutput;
  breakdown: AlgorithmOutput["breakdown"];
};

/**
 * Reproduziert den Live-Berechnungsweg des Admin-Algorithmus-Tests inklusive
 * gespeicherter `AlgorithmSettings` (gleicher Pfad wie Result-Generierung).
 */
export function runAlgorithmPreview(
  input: AlgorithmInput,
  computeOptions: ComputeOptions = {},
): AlgorithmPreviewResult {
  const output = runAlgorithm(input, { explain: true, ...computeOptions });
  return { output, breakdown: output.breakdown };
}
