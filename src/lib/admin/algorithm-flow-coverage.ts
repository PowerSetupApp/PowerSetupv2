import { ALGORITHM_SETTINGS_GROUPS } from "@/components/admin/settings/algorithm-settings-groups";

/** Every form field plus Recommendation Engine modes — must each appear once in Algorithm-Check narrative. */
export function getAllAlgorithmFlowRequiredKeys(): string[] {
  const fromGroups = ALGORITHM_SETTINGS_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
  return [...fromGroups, "productSelectionMode", "reasonGenerationMode"];
}
