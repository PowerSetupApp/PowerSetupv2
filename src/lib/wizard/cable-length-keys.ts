import type { AlgorithmInput, CableLengths } from "@/lib/algorithm/types";

/**
 * Returns the set of `CableLengths` fields the user is required to fill for
 * the current wizard configuration.
 *
 * Rules (mirror the shape of `sizeCables` in the new algorithm — the algorithm
 * always emits 7 cables in a stable order, but the wizard only demands a
 * length for the routes that actually exist):
 *
 *   - Always: `batteryToFuseBox`
 *   - `alternator` in `energySources` → `starterToService`, `boosterToService`
 *   - `solar` in `energySources` AND (at least one roof area OR at least one
 *     solar bag) → `solarToRegulator`, `regulatorToService`
 *   - `shore_power` in `energySources` → `chargerToService`
 *   - any consumer with `voltage === 230` → `serviceToInverter`
 */
export function getRequiredCableLengthKeys(
  input: AlgorithmInput,
): (keyof CableLengths)[] {
  const keys: (keyof CableLengths)[] = ["batteryToFuseBox"];

  if (input.energySources.includes("alternator")) {
    keys.push("starterToService", "boosterToService");
  }
  if (
    input.energySources.includes("solar") &&
    (input.roofAreas.length > 0 || input.solarBags.length > 0)
  ) {
    keys.push("solarToRegulator", "regulatorToService");
  }
  if (input.energySources.includes("shore_power")) {
    keys.push("chargerToService");
  }
  if (input.consumers.some((c) => c.voltage === 230)) {
    keys.push("serviceToInverter");
  }

  return keys;
}

export function areRequiredCableLengthsValid(input: AlgorithmInput): boolean {
  return getRequiredCableLengthKeys(input).every(
    (k) => input.cableLengths[k] > 0,
  );
}
