/**
 * DORMANT TYPES — NOT USED BY THE NEW ALGORITHM
 *
 * The current camper-electrics algorithm (a 1:1 port of
 * `docs/reference/algorithm/camper_electrics_sizing.py`) is a pure function
 * with hardcoded constants and does not read the `AlgorithmSettings` Prisma
 * table. The admin „Algorithmus" settings panel + its server actions and the
 * `admin-settings-algorithm.ts` queries still compile and run (they read /
 * write the table) but their output has no effect on calculation results.
 *
 * This file exists so those dormant admin modules keep type-checking. Do NOT
 * import these types from anywhere under `src/lib/algorithm/` (the active
 * algorithm) — if you need algorithm-level constants, use
 * `src/lib/algorithm/constants.ts` instead.
 *
 * Once the hardcoded constants have proven out in production, a future change
 * may re-wire selected fields of `AlgorithmSettings` back into the new
 * algorithm. At that point this file should be deleted and the admin UI
 * should import directly from whichever typed surface owns the override set.
 */

/**
 * Discrete component size classes for inverter / charger / controller /
 * cables. Parsed from the CSV strings stored in `AlgorithmSettings`.
 *
 * The new algorithm emits raw numbers and defers all rounding to the
 * downstream product-selection AI, so this type is effectively unused by the
 * calculation path.
 */
export interface ComponentClasses {
  /** Inverter output power classes (W) */
  inverter?: number[];
  /** Battery charger current classes (A) */
  charger?: number[];
  /** Solar controller current classes (A) */
  solarController?: number[];
  /** Cable cross-section classes (mm²) */
  cable?: number[];
}

/**
 * Mirrors the `AlgorithmSettings` Prisma model column names 1:1 (numeric
 * primitives only; CSV class lists parsed separately into `ComponentClasses`).
 *
 * Percent fields (voltage drops) are stored as percent (`2` = 2 %). The old
 * adapter used to convert them to fractions before feeding the algorithm; the
 * new algorithm hardcodes its own voltage-drop budgets (1 % critical / 3 %
 * standard) in `constants.ts` and ignores these fields entirely.
 */
export interface AlgorithmSettingsData {
  dodLifepo4?: number;
  dodAgm?: number;
  dodGel?: number;

  batterySafetyFactor?: number;
  maxBackupDays?: number;

  standingDaysShort?: number;
  standingDaysMedium?: number;
  standingDaysLong?: number;

  simultaneousLow?: number;
  simultaneousModerate?: number;
  simultaneousHigh?: number;

  dutyCycleCompressor?: number;
  dutyCycleAbsorber?: number;

  alternatorStandard?: number;
  alternatorEnhanced?: number;
  boosterEfficiency?: number;
  alternatorDriveHours?: number;

  chargerTimeHoursSlow?: number;
  chargerTimeHoursNormal?: number;
  chargerTimeHoursFast?: number;
  chargerAbsorptionOverhead?: number;

  sunHoursSummer?: number;
  sunHoursAllYear?: number;
  sunHoursWinter?: number;
  locationGermanyAlps?: number;
  locationSouthernEurope?: number;
  locationScandinavia?: number;
  locationEastern?: number;
  locationVaries?: number;

  cloudyYieldFactor?: number;
  cloudyYieldFactorSummer?: number;
  cloudyYieldFactorWinter?: number;
  recommendedSolarYieldFactor?: number;
  maxPortableWp?: number;

  wpPerM2Rigid?: number;
  wpPerM2Flexible?: number;
  roofUtilizationFactor?: number;
  roofOrientationFactor?: number;
  portableOrientationFactor?: number;
  solarSystemEfficiency?: number;
  solarSafetyFactor?: number;

  voltageDropCritical?: number;
  voltageDropNormal?: number;
  voltageDropSolar?: number;
  copperResistivity?: number;
}
