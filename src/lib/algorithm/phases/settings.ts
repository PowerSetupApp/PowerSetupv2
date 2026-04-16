import type { AlgorithmInput, AlgorithmSettingsData } from "../types";

/**
 * Get a setting value with fallback to hardcoded constant
 */
export function getSetting<T>(input: AlgorithmInput, key: keyof AlgorithmSettingsData, fallback: T): T {
  if (!input.settings) return fallback;
  const val = input.settings[key];
  if (val !== undefined && val !== null) {
    return val as unknown as T;
  }
  return fallback;
}
