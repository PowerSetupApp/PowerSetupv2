/**
 * Public surface of the new camper-electrics algorithm.
 *
 * Source of truth:
 *   - Reference implementation: `docs/reference/algorithm/camper_electrics_sizing.py`
 *   - Specification:             `docs/reference/algorithm/inputs.md`
 *
 * The algorithm is pure — it does NOT read from the database and does NOT
 * consume `input.customOverrides` or `input.brandPreferences`. Manual
 * overrides from the result page are applied post-compute via
 * `applyCustomOverrides`. `brandPreferences` is reserved for the downstream
 * product-matching layer.
 */

export { computeAlgorithm, type ComputeOptions } from "./compute";
export {
  mergeAlgorithmTuning,
  DEFAULT_ALGORITHM_TUNING,
  type AlgorithmTuning,
} from "./algorithm-tuning";
export { algorithmSettingsToComputeOptions } from "./options-from-db";
export { validate } from "./validate";
export { applyCustomOverrides } from "./apply-custom-overrides";
export * from "./types";
export * as constants from "./constants";
