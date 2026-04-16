import type { AlgorithmInput, AlgorithmOutput } from "./types";
import { calculateRequirements } from "./calculate-requirements";

/**
 * Orchestrator for the camper electric algorithm (ported from `docs/reference/algorithm/`).
 * Follow-up (PS-2): split logic into `phases/*.ts` without changing outputs.
 */
export function calculate(input: AlgorithmInput): AlgorithmOutput {
  return calculateRequirements(input);
}

export { calculateRequirements } from "./calculate-requirements";
export type { AlgorithmInput, AlgorithmOutput } from "./types";
