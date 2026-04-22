import { ALGORITHM_SETTINGS_GROUPS } from "@/components/admin/settings/algorithm-settings-groups";

/** Every form field plus Recommendation Engine modes — must each appear once in Algorithm-Check narrative. */
export function getAllAlgorithmFlowRequiredKeys(): string[] {
  const fromGroups = ALGORITHM_SETTINGS_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
  return [...fromGroups, "productSelectionMode", "reasonGenerationMode"];
}

/** Stable list for coverage tests — keep in sync with `getAllAlgorithmFlowRequiredKeys()`. */
export const FLOW_NARRATIVE_KEYS_USED = [
  ...ALGORITHM_SETTINGS_GROUPS.flatMap((g) => g.fields.map((f) => f.key)),
  "productSelectionMode",
  "reasonGenerationMode",
] as const;
