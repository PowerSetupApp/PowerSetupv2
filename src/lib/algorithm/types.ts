/**
 * Algorithm types — 1:1 TypeScript mirror of the dataclasses in
 * `docs/reference/algorithm/camper_electrics_sizing.py` (SECTIONS A + C) and
 * the canonical spec `docs/reference/algorithm/inputs.md`.
 *
 * Rules:
 *   - Identifiers mirror the Python source but in `camelCase`.
 *   - Enum unions follow inputs.md Part B.4 (closed, no extra strings).
 *   - `AlgorithmInput` additionally carries `brandPreferences` and
 *     `customOverrides` as REQUIRED fields (kept from the previous wizard
 *     payload for downstream use in `apply-custom-overrides.ts` and the
 *     recommendation layer). The algorithm itself ignores both.
 *   - `AlgorithmOutput` carries Python's optional `breakdown` dict
 *     (populated only when `computeAlgorithm(input, { explain: true })`).
 */

// ---------------------------------------------------------------------------
// Literal type aliases (inputs.md Part B.4)
// ---------------------------------------------------------------------------

/** `systemVoltage`, `vehicleVoltage`, `battery.voltage`, booster I/O voltages. */
export type SystemVoltage = 12 | 24 | 48;

/** Same closed set as `SystemVoltage`. */
export type VehicleVoltage = SystemVoltage;

/** `230` is ONLY valid on `Consumer.voltage` and marks an AC load. */
export type ConsumerVoltage = SystemVoltage | 230;

export type BatteryPreference = "lifepo4" | "agm" | "gel";
export type EnergySource = "solar" | "alternator" | "shore_power";
export type RoofModuleType = "rigid" | "flexible";
export type ChargerSpeed = "slow" | "normal" | "fast";
export type SimultaneousLoad = "low" | "moderate" | "high";
export type Season = "summer" | "all_year" | "winter";
export type TripDuration = "weekend" | "week" | "extended" | "permanent";
export type WinterLocation =
  | "scandinavia"
  | "germany"
  | "southern"
  | "eastern"
  | "varies";
export type StandingDuration = "short" | "medium" | "long";
export type CoolingMethod = "compressor" | "absorber";

/** Derived signal (A.7.2) — never a user input. */
export type ShoreAvailability =
  | "never"
  | "occasional"
  | "nightly"
  | "nightly_fast"
  | "full_time";

/** Output only — the new algorithm always emits `"mppt"`. */
export type ControllerType = "mppt" | "pwm";

// ---------------------------------------------------------------------------
// Input sub-shapes (inputs.md Part A)
// ---------------------------------------------------------------------------

/** One rectangular roof patch (A.2.1). Dimensions in CM. */
export interface RoofArea {
  id: string;
  name: string;
  /** Length in cm. 0 ≤ length ≤ MAX_ROOF_DIM_CM. */
  length: number;
  /** Width in cm. 0 ≤ width ≤ MAX_ROOF_DIM_CM. */
  width: number;
}

/** One portable solar bag (A.2.2). */
export interface SolarBag {
  id: string;
  /** Peak power in Wp. 0 ≤ power ≤ MAX_SOLAR_BAG_W. */
  power: number;
}

/**
 * One electrical consumer (A.3.1).
 *
 * `voltage === 230` is the ONLY marker that identifies an AC load (goes
 * through the inverter). Do not introduce a secondary `loadType` flag.
 */
export interface Consumer {
  id: string;
  name: string;
  /** Nominal power in W. 0 ≤ power ≤ MAX_POWER_W. */
  power: number;
  /** Hours per day. 0 ≤ daily ≤ MAX_HOURS_PER_DAY. */
  daily: number;
  voltage: ConsumerVoltage;
  /** Cooling category (absorber uses `electricShare` to pro-rate). */
  coolingMethod?: CoolingMethod;
  /** Absorber's electric share of total energy, 0.0..1.0. */
  electricShare?: number;
  /** Average load relative to nominal, 1..100 (undefined = 100 %). */
  averageLoadPercent?: number;
  /** Catalogue reference (metadata only, no algorithmic effect). */
  sourceDeviceId?: string;

  // UI-only metadata (round-tripped; algorithm ignores)
  deviceIcon?: string | null;
  categoryIcon?: string | null;
  showHoursField?: boolean;
  dailyStep?: number;
}

/** Trip context (A.4). */
export interface TravelBehavior {
  season: Season;
  tripDuration: TripDuration;
  winterLocation: WinterLocation;
  standingDuration: StandingDuration;
}

/**
 * One-way cable lengths in metres (A.6). Zero means "route absent" — the
 * algorithm still emits a CableRecommendation with `minCrossSection = 0` for
 * a stable output shape.
 */
export interface CableLengths {
  /** Starter battery → Ladebooster */
  starterToService: number;
  /** Ladebooster → Versorgerbatterie */
  boosterToService: number;
  /** PV → Laderegler */
  solarToRegulator: number;
  /** Laderegler → Versorgerbatterie */
  regulatorToService: number;
  /** Landlader → Versorgerbatterie */
  chargerToService: number;
  /** Versorgerbatterie → Wechselrichter */
  serviceToInverter: number;
  /** Versorgerbatterie → Sicherungskasten */
  batteryToFuseBox: number;
}

/**
 * Optional brand preferences from wizard step 7. The algorithm ignores
 * these; they are reserved for the recommendation / product-matching layer.
 */
export interface BrandPreferences {
  charger: string | null;
  battery: string | null;
  solar: string | null;
}

/**
 * Optional manual overrides from the result page. Only `battery` and `solar`
 * are applied today (see `apply-custom-overrides.ts`); the remaining fields
 * are persisted for forwards compatibility.
 */
export interface CustomOverrides {
  /** Manual battery capacity (Ah). */
  battery: number | null;
  /** Manual total solar Wp. */
  solar: number | null;
  /** Manual booster output current (A). */
  booster: number | null;
  /** Manual controller current (A). */
  controller: number | null;
  /** Manual inverter power (W). */
  inverter: number | null;
  /** Manual charger current (A). */
  charger: number | null;
}

/** Full wizard payload (inputs.md Part A). */
export interface AlgorithmInput {
  // A.1 system basis
  systemVoltage: SystemVoltage;
  vehicleVoltage: VehicleVoltage;
  batteryPreference: BatteryPreference;

  // A.2 energy sources
  energySources: EnergySource[];
  roofModuleType: RoofModuleType;
  roofAreas: RoofArea[];
  solarBags: SolarBag[];
  chargerSpeed: ChargerSpeed;

  // A.3 consumers
  consumers: Consumer[];
  simultaneousLoad: SimultaneousLoad;

  // A.4 travel behaviour
  travelBehavior: TravelBehavior;

  // A.5 autarky (1..999; 999 = "maximum" sentinel, see inputs.md B.3)
  autarchyDays: number;

  // A.6 cable lengths
  cableLengths: CableLengths;

  // Wizard-only payload (algorithm ignores)
  brandPreferences: BrandPreferences;
  customOverrides: CustomOverrides;
}

// ---------------------------------------------------------------------------
// Output sub-shapes (inputs.md Part C)
// ---------------------------------------------------------------------------

/** Battery recommendation (C.1). */
export interface BatteryRecommendation {
  /** Computed daily demand (Wh/day). */
  dailyWh: number;
  /** Minimum capacity before the reserve factor (Ah, raw). */
  minCapacityAh: number;
  /** Recommended capacity with reserve factor (Ah, raw). */
  recommendedCapacityAh: number;
  type: BatteryPreference;
  voltage: SystemVoltage;
  /** Echoed, clamped per `autarchyMaxDays(input)`. */
  autarchyDays: number;
  /** Convenience mirrors of `"solar" in energySources` etc. for downstream AI. */
  hasSolar: boolean;
  hasAlternator: boolean;
  /**
   * Estimated daily solar top-up during the autarky bridge window [Wh/day].
   * Already applies `AUTARCHY_PSH_DERATE`. 0 when solar is not selected.
   */
  solarTopUpWh: number;
  /**
   * Estimated daily alternator top-up during the autarky bridge window
   * [Wh/day]. Uses the alternator ceiling (no battery-acceptance clamp) to
   * avoid circular sizing — see `alternatorTopUpEstimateWh`. 0 when the
   * alternator is not selected.
   */
  alternatorTopUpWh: number;
  /** `solarTopUpWh + alternatorTopUpWh`. */
  dailyTopUpWh: number;
  /**
   * Solar + alternator top-up [Wh/day] used **only** for `rawCoverage` in
   * the soft bridge: alternator term is multiplied by
   * `ALTERNATOR_BRIDGE_STANDING_CREDIT[standingDuration]` when the alternator
   * is selected. Omitted when identical to {@link dailyTopUpWh} (no alternator).
   */
  dailyTopUpWhForCoverage?: number;
  /**
   * Standing-duration factor applied to alternator Wh in the coverage bridge;
   * only set when `hasAlternator` is true.
   */
  alternatorBridgeStandingCredit?: number;
  /**
   * RAW deficit `max(dailyWh - dailyTopUpWh, 0)`. Collapses to 0 when
   * top-ups fully cover daily demand. For display / telemetry only —
   * the *bridge* uses the coverage-capped variant below.
   */
  netDailyDeficitWh: number;
  /**
   * Fraction of daily demand actually offset by top-ups after applying
   * the dynamic cap (`min(rawCoverage, effectiveCoverageCap)`). 0..1.
   */
  coverageRatio?: number;
  /**
   * The cap actually used in `coverageRatio = min(rawCoverage, cap)` —
   * starts from a PSH-scaled base (see `topUpCoverageBaseCapForPsh` in
   * `phases/battery.ts`, asymptotic to `TOP_UP_COVERAGE_CAP` in sunny
   * conditions) and rises when portable bridge solar is present
   * (`TOP_UP_COVERAGE_PORTABLE_*`), up to `TOP_UP_COVERAGE_ABS_MAX`, then
   * optionally scaled by `TOP_UP_COVERAGE_STANDING_CAP_MULT` for
   * `tripDuration === "permanent"` + alternator + medium/long stand (see
   * `phases/battery.ts`).
   */
  effectiveCoverageCap?: number;
  /**
   * Per-day energy the battery has to bridge, after applying the
   * coverage cap: `dailyWh × (1 − coverageRatio)`. This is the value
   * that actually drives `softBridgeWh = bridgeDailyDeficitWh × bridgeDays`.
   */
  bridgeDailyDeficitWh?: number;
  /**
   * Which branch determined the final Ah:
   *   - `"soft"` — the N-day coverage-capped bridge won
   *   - `"hard"` — the `HARD_BRIDGE_DAYS` (1 day) floor won (typical at
   *     very short autarky settings or when top-ups cover daily demand).
   */
  bindingBranch: "soft" | "hard";
}

/** Solar recommendation (C.2). */
export interface SolarRecommendation {
  needed: boolean;
  requiredWp: number;
  maxRoofWp: number;
  /** Sum of nominal `SolarBag.power` [Wp] — user-visible. */
  portableWp: number;
  /**
   * Nominal portable Wp × location/season alignment uplift × utilization
   * (algorithm-only; used in `totalAvailableWp` and yield).
   */
  portableEffectiveWp: number;
  totalAvailableWp: number;
  dailySolarYieldWh: number;
  /** Never negative. */
  solarShortfallWh: number;
  /**
   * Legacy-compat stub per inputs.md C.2 note — always the empty string from
   * the algorithm (downstream text generation writes this).
   */
  recommendation: string;
}

/** Booster recommendation (C.3). */
export interface BoosterRecommendation {
  needed: boolean;
  /** Starter-side current (A). */
  inputCurrentA: number;
  /** House-bank-side current (A). */
  outputCurrentA: number;
  /** Legacy alias: always equal to `outputCurrentA`. */
  currentA: number;
  inputVoltage: VehicleVoltage;
  outputVoltage: SystemVoltage;
  /** `vehicleVoltage !== systemVoltage`. */
  needsConversion: boolean;
  dailyAlternatorChargeWh: number;
  /** Optional intermediate, reserved for future override bookkeeping. */
  originalCurrentA?: number;
}

/** Charger recommendation (C.4). */
export interface ChargerRecommendation {
  needed: boolean;
  /** Raw target current before chemistry clamp (A). */
  targetCurrentA: number;
  /** Raw recommended current after chemistry clamp (A). */
  recommendedCurrentA: number;
  /** Bulk-from-empty time + absorption tail (h). */
  chargingTimeHours: number;
  originalRecommendedCurrentA?: number;
}

/** Inverter recommendation (C.5). */
export interface InverterRecommendation {
  needed: boolean;
  /** Sum of AC consumer nominal power (W). */
  peakLoadW: number;
  /** `peakLoadW * peakFactor` — raw (no rounding to product classes). */
  recommendedW: number;
  originalRecommendedW?: number;
}

/** Controller recommendation (C.6). */
export interface ControllerRecommendation {
  needed: boolean;
  type: ControllerType;
  /** Battery-side current (A). */
  currentA: number;
  /** Maximum Wp the controller must accept. */
  maxInputWp: number;
  /**
   * Marks the "scope" this regulator is sized for:
   *   - `"roof"`      — roof-mounted array only (current = maxRoofWp / U)
   *   - `"portable"`  — portable bag kit (current = nominal portableWp / U)
   */
  scope?: "roof" | "portable";
  originalCurrentA?: number;
}

/** Cable recommendation (C.7). Always 7 entries in `ROUTES` order. */
export interface CableRecommendation {
  /** One of the stable route IDs from `ROUTES`. */
  route: string;
  displayName: string;
  lengthM: number;
  currentA: number;
  /** Typically 12 / 24 / 48; reserved 230 for future AC routes. */
  voltage: number;
  /** Raw mm², voltage-drop-limited minimum. */
  minCrossSection: number;
  /**
   * Legacy-compat stub per inputs.md C.7 — always equal to `minCrossSection`.
   * Downstream SKU matching rounds to standard cable sizes.
   */
  recommendedCrossSection: number;
  /** Critical routes use the 1 %-drop budget, standard routes use 3 %. */
  isCritical: boolean;
}

/** Full output (inputs.md Part C). */
export interface AlgorithmOutput {
  battery: BatteryRecommendation;
  solar: SolarRecommendation;
  booster: BoosterRecommendation;
  charger: ChargerRecommendation;
  inverter: InverterRecommendation;
  /** Roof-mounted array's MPPT regulator. Always emitted (shape stability). */
  controller: ControllerRecommendation;
  /**
   * Second regulator for portable solar bags. Always emitted (shape stability).
   * `needed === false` when no bags are configured.
   */
  portableController: ControllerRecommendation;
  cables: CableRecommendation[];
  /**
   * Populated only when `computeAlgorithm(input, { explain: true })`. Mirrors
   * the Python `breakdown` dict — a flat key / value map of the intermediate
   * quantities used by the formulas.
   */
  breakdown?: Record<string, number | string>;
}

// ---------------------------------------------------------------------------
// Defaults (kept from the legacy wizard payload — SHAPE-compatible)
// ---------------------------------------------------------------------------

export const DEFAULT_CABLE_LENGTHS: CableLengths = {
  starterToService: 2,
  boosterToService: 1,
  solarToRegulator: 3,
  regulatorToService: 1,
  chargerToService: 1,
  serviceToInverter: 1,
  batteryToFuseBox: 1,
};

export const DEFAULT_BRAND_PREFERENCES: BrandPreferences = {
  charger: null,
  battery: null,
  solar: null,
};

export const DEFAULT_CUSTOM_OVERRIDES: CustomOverrides = {
  battery: null,
  solar: null,
  booster: null,
  controller: null,
  inverter: null,
  charger: null,
};

export const DEFAULT_ALGORITHM_INPUT: AlgorithmInput = {
  systemVoltage: 12,
  vehicleVoltage: 12,
  batteryPreference: "lifepo4",
  energySources: [],
  roofModuleType: "rigid",
  roofAreas: [],
  solarBags: [],
  chargerSpeed: "normal",
  consumers: [],
  simultaneousLoad: "moderate",
  travelBehavior: {
    season: "summer",
    tripDuration: "week",
    winterLocation: "germany",
    standingDuration: "medium",
  },
  // Conservative starting value. The actual slider cap in step 5 is
  // computed from `(tripDuration, energySources)` via `autarchyMaxDays` —
  // the default `week` + empty sources yields the `battery_only` cap (7),
  // so `2` fits comfortably inside and the step 5 clamp nudges it up if
  // the user adds a top-up source.
  autarchyDays: 2,
  cableLengths: DEFAULT_CABLE_LENGTHS,
  brandPreferences: DEFAULT_BRAND_PREFERENCES,
  customOverrides: DEFAULT_CUSTOM_OVERRIDES,
};
