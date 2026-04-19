import { MAX_AUTARCHY_DAYS, type AutarchyTopUpProfile } from "@/lib/algorithm/constants";
import type { EnergySource, TripDuration } from "@/lib/algorithm/types";

export type AutarchyPreset = "weekend" | "holiday" | "full";

/**
 * Classify the user's energy sources into the top-up profile used by
 * `MAX_AUTARCHY_DAYS`. Mirrors `autarchyTopUpProfile` in
 * `src/lib/algorithm/derive.ts` — shore power is intentionally ignored
 * because it does not help while off-grid.
 */
export function autarchyTopUpProfileFromSources(
  energySources: readonly EnergySource[],
): AutarchyTopUpProfile {
  const hasSolar = energySources.includes("solar");
  const hasAlternator = energySources.includes("alternator");
  if (hasSolar && hasAlternator) return "solar_and_alt";
  if (hasSolar || hasAlternator) return "solar_or_alt";
  return "battery_only";
}

/**
 * Inclusive upper bound for the "autarky days" slider in wizard step 5.
 *
 * These are **soft-autarky** values — how many days the user wants to stay
 * off-grid while solar and/or the alternator keep topping up the bank. The
 * battery only needs to cover the residual deficit (see the battery phase
 * in `src/lib/algorithm/phases/battery.ts`), which is why the cap grows
 * when a top-up source is present and shrinks when the bank is on its own.
 *
 * Mirrors `MAX_AUTARCHY_DAYS` in `src/lib/algorithm/constants.ts` — the two
 * tables must stay in sync.
 */
export function getAutarchyWizardMaxDays(
  tripDuration: TripDuration,
  energySources: readonly EnergySource[],
): number {
  const profile = autarchyTopUpProfileFromSources(energySources);
  return MAX_AUTARCHY_DAYS[tripDuration][profile];
}

/**
 * Adaptive target days for a preset card. Scales with the live slider max
 * so the three buckets remain meaningful whether the cap is 3 days (no
 * top-up, weekend trip) or 90 days (solar + alternator, permanent).
 *
 *   - `weekend`: ~short buffer, floor 1 day
 *   - `holiday`: ~40 % of the cap, floor 3 days (or max if max < 3)
 *   - `full`:    ~85 % of the cap, floor 5 days (or max if max < 5)
 */
export function presetDaysAdaptive(
  preset: AutarchyPreset,
  maxDays: number,
): number {
  const clamp = (value: number, floor: number): number =>
    Math.max(1, Math.min(Math.max(value, Math.min(floor, maxDays)), maxDays));
  switch (preset) {
    case "weekend":
      return Math.min(2, maxDays);
    case "holiday":
      return clamp(Math.round(maxDays * 0.4), 3);
    case "full":
      return clamp(Math.round(maxDays * 0.85), 5);
    default:
      return maxDays;
  }
}

/**
 * Classify a raw `autarchyDays` value into one of the preset buckets used
 * by the card selector in step 5. Thresholds are derived from the live
 * `maxDays` so the classification matches the adaptive preset days.
 */
export function autarchyPresetFromDays(
  days: number,
  maxDays: number,
): AutarchyPreset {
  const weekendTarget = presetDaysAdaptive("weekend", maxDays);
  const holidayTarget = presetDaysAdaptive("holiday", maxDays);
  if (days <= weekendTarget) return "weekend";
  if (days <= holidayTarget) return "holiday";
  return "full";
}
