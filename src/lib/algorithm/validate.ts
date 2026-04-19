/**
 * Algorithm boundary validation — 1:1 mirror of SECTION D of
 * `docs/reference/algorithm/camper_electrics_sizing.py`.
 *
 * One entry point: `validate(input)`. Throws `Error` with a field-specific
 * message on the first violation. No silent repair, no fallback value.
 * Calling `computeAlgorithm` on malformed input produces a diagnosable error
 * at the wizard boundary rather than a wrong-but-plausible number downstream.
 *
 * Note: the wizard already validates the payload with Zod at the API
 * boundary (`src/lib/schemas/wizard-input.ts`). `validate` is the
 * algorithm's own sanity net — useful for unit tests and for callers that
 * construct `AlgorithmInput` outside the wizard.
 */

import {
  AUTARCHY_UNBOUNDED,
  BATTERY_PREFERENCES,
  CHARGER_SPEEDS,
  CONSUMER_VOLTAGES,
  COOLING_METHODS,
  ENERGY_SOURCES,
  MAX_CABLE_LENGTH_M,
  MAX_HOURS_PER_DAY,
  MAX_POWER_W,
  MAX_ROOF_DIM_CM,
  MAX_SOLAR_BAG_W,
  ROOF_MODULE_TYPES,
  SEASONS,
  SIMULTANEOUS_LOADS,
  STANDING_DURATIONS,
  SYSTEM_VOLTAGES,
  TRIP_DURATIONS,
  WINTER_LOCATIONS,
} from "./constants";
import { autarchyMaxDays, autarchyTopUpProfile } from "./derive";
import type {
  AlgorithmInput,
  CableLengths,
  Consumer,
  RoofArea,
  SolarBag,
  TravelBehavior,
} from "./types";

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

function requireEnum<T>(
  value: unknown,
  allowed: readonly T[],
  fieldName: string,
): void {
  if (!allowed.includes(value as T)) {
    throw new Error(
      `${fieldName}=${JSON.stringify(value)} must be one of ${JSON.stringify(
        allowed,
      )}`,
    );
  }
}

function requireRange(
  value: unknown,
  lo: number,
  hi: number,
  fieldName: string,
  options: { inclusive?: boolean } = {},
): void {
  const { inclusive = true } = options;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fieldName}=${JSON.stringify(value)} must be numeric`);
  }
  const inRange = inclusive ? value >= lo && value <= hi : value > lo && value < hi;
  if (!inRange) {
    const bracket = inclusive ? `[${lo}, ${hi}]` : `(${lo}, ${hi})`;
    throw new Error(`${fieldName}=${value} out of range ${bracket}`);
  }
}

function requireNonEmptyString(value: unknown, fieldName: string): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
}

// ---------------------------------------------------------------------------
// Per-sub-shape validators
// ---------------------------------------------------------------------------

function validateConsumer(c: Consumer, idx: number): void {
  const prefix = `consumers[${idx}]`;
  requireNonEmptyString(c.id, `${prefix}.id`);
  requireNonEmptyString(c.name, `${prefix}.name`);
  requireRange(c.power, 0, MAX_POWER_W, `${prefix}.power`);
  requireRange(c.daily, 0, MAX_HOURS_PER_DAY, `${prefix}.daily`);
  requireEnum(c.voltage, CONSUMER_VOLTAGES, `${prefix}.voltage`);
  if (c.coolingMethod !== undefined) {
    requireEnum(c.coolingMethod, COOLING_METHODS, `${prefix}.coolingMethod`);
  }
  if (c.electricShare !== undefined) {
    requireRange(c.electricShare, 0, 1, `${prefix}.electricShare`);
  }
  if (c.averageLoadPercent !== undefined) {
    if (
      !Number.isInteger(c.averageLoadPercent) ||
      c.averageLoadPercent < 1 ||
      c.averageLoadPercent > 100
    ) {
      throw new Error(
        `${prefix}.averageLoadPercent=${c.averageLoadPercent} must be an int in [1, 100]`,
      );
    }
  }
  if (c.dailyStep !== undefined && !(c.dailyStep > 0)) {
    throw new Error(`${prefix}.dailyStep must be > 0 if set`);
  }
}

function validateRoofArea(r: RoofArea, idx: number): void {
  const prefix = `roofAreas[${idx}]`;
  requireNonEmptyString(r.id, `${prefix}.id`);
  requireNonEmptyString(r.name, `${prefix}.name`);
  requireRange(r.length, 0, MAX_ROOF_DIM_CM, `${prefix}.length`);
  requireRange(r.width, 0, MAX_ROOF_DIM_CM, `${prefix}.width`);
}

function validateSolarBag(b: SolarBag, idx: number): void {
  const prefix = `solarBags[${idx}]`;
  requireNonEmptyString(b.id, `${prefix}.id`);
  requireRange(b.power, 0, MAX_SOLAR_BAG_W, `${prefix}.power`);
}

function validateCableLengths(cl: CableLengths): void {
  const keys: (keyof CableLengths)[] = [
    "starterToService",
    "boosterToService",
    "solarToRegulator",
    "regulatorToService",
    "chargerToService",
    "serviceToInverter",
    "batteryToFuseBox",
  ];
  for (const key of keys) {
    requireRange(cl[key], 0, MAX_CABLE_LENGTH_M, `cableLengths.${key}`);
  }
}

function validateTravelBehavior(tb: TravelBehavior): void {
  requireEnum(tb.season, SEASONS, "travelBehavior.season");
  requireEnum(tb.tripDuration, TRIP_DURATIONS, "travelBehavior.tripDuration");
  requireEnum(
    tb.winterLocation,
    WINTER_LOCATIONS,
    "travelBehavior.winterLocation",
  );
  requireEnum(
    tb.standingDuration,
    STANDING_DURATIONS,
    "travelBehavior.standingDuration",
  );
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Full structural + cross-field validation of `AlgorithmInput`.
 * Throws `Error` with a field-specific message on the first violation.
 */
export function validate(input: AlgorithmInput): void {
  // A.1 system basis
  requireEnum(input.systemVoltage, SYSTEM_VOLTAGES, "systemVoltage");
  requireEnum(input.vehicleVoltage, SYSTEM_VOLTAGES, "vehicleVoltage");
  requireEnum(
    input.batteryPreference,
    BATTERY_PREFERENCES,
    "batteryPreference",
  );

  // A.2 energy sources
  if (!Array.isArray(input.energySources)) {
    throw new Error("energySources must be an array");
  }
  input.energySources.forEach((src, i) =>
    requireEnum(src, ENERGY_SOURCES, `energySources[${i}]`),
  );
  requireEnum(input.roofModuleType, ROOF_MODULE_TYPES, "roofModuleType");
  input.roofAreas.forEach((r, i) => validateRoofArea(r, i));
  input.solarBags.forEach((b, i) => validateSolarBag(b, i));
  requireEnum(input.chargerSpeed, CHARGER_SPEEDS, "chargerSpeed");

  // A.3 consumers
  input.consumers.forEach((c, i) => validateConsumer(c, i));
  requireEnum(
    input.simultaneousLoad,
    SIMULTANEOUS_LOADS,
    "simultaneousLoad",
  );

  // A.4 travel behaviour
  validateTravelBehavior(input.travelBehavior);

  // A.5 autarky
  if (!Number.isInteger(input.autarchyDays)) {
    throw new Error(`autarchyDays=${input.autarchyDays} must be int`);
  }
  if (input.autarchyDays < 1 || input.autarchyDays > AUTARCHY_UNBOUNDED) {
    throw new Error(
      `autarchyDays=${input.autarchyDays} must be in [1, ${AUTARCHY_UNBOUNDED}]`,
    );
  }
  const maxDays = autarchyMaxDays(input);
  if (
    input.autarchyDays !== AUTARCHY_UNBOUNDED &&
    input.autarchyDays > maxDays
  ) {
    throw new Error(
      `autarchyDays=${input.autarchyDays} exceeds max ${maxDays} for tripDuration=${JSON.stringify(
        input.travelBehavior.tripDuration,
      )} + topUpProfile=${JSON.stringify(autarchyTopUpProfile(input))} (or use sentinel ${AUTARCHY_UNBOUNDED} for 'maximum')`,
    );
  }

  // A.6 cable lengths
  validateCableLengths(input.cableLengths);

  // Cross-field rules (inputs.md A.4 note)
  if (
    input.travelBehavior.tripDuration === "permanent" &&
    input.travelBehavior.season !== "all_year"
  ) {
    throw new Error(
      "travelBehavior.tripDuration='permanent' requires travelBehavior.season='all_year' (inputs.md A.4 note)",
    );
  }
}
