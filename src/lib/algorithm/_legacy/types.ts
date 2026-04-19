/**
 * Algorithm Types
 * 
 * TypeScript Interfaces für Inputs und Outputs des Algorithmus.
 * 
 * Quellen:
 * - 02-inputs-and-forms.md (Inputs)
 * - 03-outputs.md (Outputs)
 */

// =============================================================================
// ENUMS & LITERAL TYPES
// =============================================================================

/** System voltage options */
export type SystemVoltage = 12 | 24 | 48;

/** Vehicle (starter) battery voltage options */
export type VehicleVoltage = 12 | 24 | 48;

/** Consumer operating voltage: DC rail matches Bordnetz, or 230 V AC */
export type ConsumerVoltage = SystemVoltage | 230;

/** Battery chemistry preference */
export type BatteryPreference = 'lifepo4' | 'agm' | 'gel';

/** Energy source options */
export type EnergySource = 'solar' | 'alternator' | 'shore_power';

/** Expected alternator / B2B charging strength (only when `alternator` is selected). */
export type AlternatorTier = 'standard' | 'enhanced';

/** Roof module type */
export type RoofModuleType = 'rigid' | 'flexible';

/** Charger speed option */
export type ChargerSpeed = 'slow' | 'normal' | 'fast';

/** Cooling method for refrigerators */
export type CoolingMethod = 'compressor' | 'absorber';

/** Simultaneous load level */
export type SimultaneousLoad = 'low' | 'moderate' | 'high';

/** Travel season */
export type Season = 'summer' | 'all_year' | 'winter';

/** Trip duration */
export type TripDuration = 'weekend' | 'week' | 'extended' | 'permanent';

/** Winter location region */
export type WinterLocation = 'scandinavia' | 'germany' | 'southern' | 'eastern' | 'varies';

/** Standing duration without driving */
export type StandingDuration = 'short' | 'medium' | 'long';

/**
 * Ziel-Tage ohne externe Stromquelle (Landstrom), 1–998.
 * 999 = „Maximum“: Algorithmus nutzt die volle erlaubte Reserve (siehe Batteriephase).
 */
export type AutarchyDays = number;

/** Solar setup type (derived) */
export type SolarSetupType = 'roof' | 'mixed';

/** Controller type */
export type ControllerType = 'mppt' | 'pwm';

// =============================================================================
// INPUT INTERFACES
// =============================================================================

/**
 * Roof area definition
 * Dimensions in cm!
 */
export interface RoofArea {
    /** Unique identifier */
    id: string;
    /** Area name (e.g. "Hauptfläche") */
    name: string;
    /** Length in cm */
    length: number;
    /** Width in cm */
    width: number;
}

/**
 * Portable solar bag
 */
export interface SolarBag {
    /** Unique identifier */
    id: string;
    /** Power in Watt */
    power: number;
}

/**
 * Consumer device
 */
export interface Consumer {
    /** Unique identifier (UUID) */
    id: string;
    /** Device name */
    name: string;
    /** Power consumption in Watt (nominale Maximalleistung des Geräts) */
    power: number;
    /** Daily usage in hours */
    daily: number;
    /**
     * Durchschnittliche Leistung in Prozent der Nominal-`power`.
     * Kommt aus dem Admin-Katalog (`ConsumerDevice.averageLoadPercent`).
     *
     * Wirkung:
     * - Tagesverbrauch = `power * (averageLoadPercent/100) * daily`
     * - Wechselrichter/230-V-Peak verwenden weiterhin die volle `power`
     *
     * `undefined` oder `100` ⇒ kein Rabatt (volle Leistung rechnen).
     */
    averageLoadPercent?: number;
    /** Operating voltage: DC (12/24/48 per Bordnetz) or 230 V AC */
    voltage: ConsumerVoltage;
    /** Cooling method (only for cooling devices) */
    coolingMethod?: CoolingMethod;
    /** Electric share 0.0 - 1.0 (only for absorber with gas) */
    electricShare?: number;
    /** Wizard catalog device id when added from Vorlage */
    sourceDeviceId?: string;
    /** Snapshot for UI (emoji or short glyph from Admin) */
    deviceIcon?: string | null;
    categoryIcon?: string | null;
    /** When false, daily hours control is hidden (catalog default) */
    showHoursField?: boolean;
    /** Step size for h/Tag stepper (from catalog `stepHours`) */
    dailyStep?: number;
}

/**
 * Travel behavior settings
 */
export interface TravelBehavior {
    /** Main travel season */
    season: Season;
    /** Typical trip duration */
    tripDuration: TripDuration;
    /** Winter travel region (only for all_year/winter) */
    winterLocation: WinterLocation;
    /** Typical standing duration without driving */
    standingDuration: StandingDuration;
}

/**
 * Cable lengths in meters
 */
export interface CableLengths {
    /** Starter battery → Booster (if alternator) */
    starterToService: number;
    /** Booster → Service battery (if alternator) */
    boosterToService: number;
    /** Solar panels → Regulator (if solar) */
    solarToRegulator: number;
    /** Regulator → Service battery (if solar) */
    regulatorToService: number;
    /** Charger → Service battery (if shore_power) */
    chargerToService: number;
    /** Service battery → Inverter (always) */
    serviceToInverter: number;
    /** Service battery → Fuse box (always) */
    batteryToFuseBox: number;
}

/**
 * Brand preferences (optional)
 */
export interface BrandPreferences {
    /** Brand ID for chargers/boosters */
    charger: string | null;
    /** Brand ID for batteries */
    battery: string | null;
    /** Brand ID for solar panels */
    solar: string | null;
}

/**
 * Custom overrides for calculated values
 */
export interface CustomOverrides {
    /** Manual battery capacity (Ah) */
    battery: number | null;
    /** Manual solar Wp */
    solar: number | null;
    /** Manual booster current (A) */
    booster: number | null;
    /** Manual controller current (A) */
    controller: number | null;
    /** Manual inverter power (W) */
    inverter: number | null;
    /** Manual charger current (A) */
    charger: number | null;
}

/**
 * Complete algorithm input
 */
export interface AlgorithmInput {
    // Step 1: System basics
    /** System voltage (12, 24, 48) */
    systemVoltage: SystemVoltage;
    /** Vehicle starter battery voltage (12, 24, 48) */
    vehicleVoltage: VehicleVoltage;
    /** Battery chemistry preference */
    batteryPreference: BatteryPreference;

    // Step 2: Energy sources
    /** Selected energy sources (min. 1 required) */
    energySources: EnergySource[];
    /** Roof module type (if solar) */
    roofModuleType: RoofModuleType;
    /** Available roof areas (if solar) */
    roofAreas: RoofArea[];
    /** Portable solar bags (added on result screen) */
    solarBags: SolarBag[];
    /** Charger speed (if shore_power) */
    chargerSpeed: ChargerSpeed;
    /**
     * Lichtmaschine vs. Ladebooster-Erwartung (nur bei `alternator`).
     * `standard` ≈ geringerer Ladestrom, `enhanced` ≈ B2B / höherer Strom (siehe AlgorithmSettings alternatorStandard / alternatorEnhanced).
     */
    alternatorTier: AlternatorTier;

    // Step 3: Consumers
    /** List of electrical consumers */
    consumers: Consumer[];
    /** Simultaneous load level for 230V devices */
    simultaneousLoad: SimultaneousLoad;

    // Step 4: Travel behavior
    /** Travel behavior settings */
    travelBehavior: TravelBehavior;

    // Step 5: Autarchy goal
    /** Desired autarchy days (999 = unlimited) */
    autarchyDays: AutarchyDays;

    // Step 6: Cabling
    /** Cable lengths in meters */
    cableLengths: CableLengths;

    // Step 7: Preferences
    /** Brand preferences (optional) */
    brandPreferences: BrandPreferences;

    // Result screen overrides
    /** Custom overrides for calculated values */
    customOverrides: CustomOverrides;

    /**
     * Algorithm Settings from Database (optional).
     * Keys mirror the `AlgorithmSettings` Prisma model 1:1.
     * When missing, each phase falls back to its hardcoded constant (see `constants.ts`).
     */
    settings?: Partial<AlgorithmSettingsData>;

    /**
     * Discrete component size classes (parsed from CSV strings in `AlgorithmSettings`).
     * When a list is provided the sizing phases round up to the next entry;
     * otherwise the phase returns the raw computed value (no rounding).
     */
    componentClasses?: ComponentClasses;
}

/**
 * Discrete component size classes for inverter/charger/controller/cables.
 * Parsed from the CSV strings stored in the `AlgorithmSettings` row.
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
 * Settings data structure — mirrors the `AlgorithmSettings` Prisma model column names 1:1.
 *
 * ONLY numeric primitives live here; CSV class lists are parsed into `AlgorithmInput.componentClasses`.
 * Percent fields stay in percent form (e.g. voltageDropCritical = 2 means 2%) and are converted
 * to fractions inside the adapter (`settings-adapter.ts`) — see `normalizeSettingsRow`.
 */
export interface AlgorithmSettingsData {
    // DoD (fractions, e.g. 0.95 = 95 %)
    dodLifepo4?: number;
    dodAgm?: number;
    dodGel?: number;

    // Battery / autarchy
    batterySafetyFactor?: number;
    maxBackupDays?: number;

    // Standing days (autarchy duration presets)
    standingDaysShort?: number;
    standingDaysMedium?: number;
    standingDaysLong?: number;

    // Simultaneous 230 V load factors
    simultaneousLow?: number;
    simultaneousModerate?: number;
    simultaneousHigh?: number;

    // Duty cycles for cooling devices
    dutyCycleCompressor?: number;
    dutyCycleAbsorber?: number;

    // Alternator / booster (amps per tier + physical efficiency + drive hours)
    alternatorStandard?: number;
    alternatorEnhanced?: number;
    boosterEfficiency?: number;
    alternatorDriveHours?: number;

    // Shore-power target charge times per speed (hours)
    chargerTimeHoursSlow?: number;
    chargerTimeHoursNormal?: number;
    chargerTimeHoursFast?: number;

    /**
     * Overhead-Faktor für die Absorption-Phase (Lade-Taper).
     * Der Ladestrom wird `batteryAh * dod * (1 + overhead) / chargerTimeHours` dimensioniert,
     * damit auch die Konstantspannungs-Phase noch innerhalb der Zielzeit abgeschlossen ist.
     * Default 0.15 (≈ 15 % zusätzlicher Puffer).
     */
    chargerAbsorptionOverhead?: number;

    // Solar — base sun hours and location multipliers (PSH = base × multiplier)
    sunHoursSummer?: number;
    sunHoursAllYear?: number;
    sunHoursWinter?: number;
    locationGermanyAlps?: number;
    locationSouthernEurope?: number;
    locationScandinavia?: number;
    locationEastern?: number;
    locationVaries?: number;

    // Solar — yield factors & dimensioning
    cloudyYieldFactor?: number;
    cloudyYieldFactorSummer?: number;
    cloudyYieldFactorWinter?: number;
    recommendedSolarYieldFactor?: number;
    maxPortableWp?: number;

    // Solar — panel & roof specs
    wpPerM2Rigid?: number;
    wpPerM2Flexible?: number;
    roofUtilizationFactor?: number;
    roofOrientationFactor?: number;
    portableOrientationFactor?: number;
    solarSystemEfficiency?: number;
    solarSafetyFactor?: number;

    // Wiring — voltage drop is stored as fraction in adapter output (e.g. 0.02 for 2 %)
    voltageDropCritical?: number;
    voltageDropNormal?: number;
    voltageDropSolar?: number;
    /** Kupfer-spezifischer Widerstand ρ in Ω·mm²/m (≈ 0.0178). */
    copperResistivity?: number;
}

// =============================================================================
// OUTPUT INTERFACES
// =============================================================================

/**
 * Battery recommendation
 */
export interface BatteryRecommendation {
    /** Total daily consumption (Wh) */
    dailyWh: number;
    /** Minimum capacity worst-case (Ah) */
    minCapacityAh: number;
    /** Recommended capacity with buffer (Ah) */
    recommendedCapacityAh: number;
    /** Recommended battery type */
    type: BatteryPreference;
    /** System voltage (V) */
    voltage: SystemVoltage;
    /** Achievable autarchy days */
    autarchyDays: number;
    /** Solar selected as source */
    hasSolar: boolean;
    /** Alternator selected as source */
    hasAlternator: boolean;
}

/**
 * Solar recommendation
 */
export interface SolarRecommendation {
    /** Is solar required/selected? */
    needed: boolean;
    /** Required total wattage (Wp) */
    requiredWp: number;
    /** Max installable on roof (Wp) */
    maxRoofWp: number;
    /** Recommended portable Wp */
    portableWp: number;
    /** Total available (roof + portable) (Wp) */
    totalAvailableWp: number;
    /** Expected daily yield (Wh) */
    dailySolarYieldWh: number;
    /** Solar shortfall - difference between required and available (Wh) */
    solarShortfallWh: number;
    /** Text recommendation */
    recommendation: string;
}

/**
 * Booster recommendation
 */
export interface BoosterRecommendation {
    /** Is booster required/selected? */
    needed: boolean;
    /** Input current from alternator (A) - used for input cable calculation */
    inputCurrentA: number;
    /** Output current to service battery (A) - used for output cable and product selection */
    outputCurrentA: number;
    /** @deprecated Legacy field - use outputCurrentA instead. Kept for backward compatibility. */
    currentA: number;
    /** Original calculated output current (A) before override */
    originalCurrentA?: number;
    /** Vehicle voltage (V) */
    inputVoltage: VehicleVoltage;
    /** System voltage (V) */
    outputVoltage: SystemVoltage;
    /** Voltage conversion needed? */
    needsConversion: boolean;
    /** Expected daily yield (Wh) */
    dailyAlternatorChargeWh: number;
}

/**
 * Charger recommendation (shore power)
 */
export interface ChargerRecommendation {
    /** Is charger required/selected? */
    needed: boolean;
    /** Calculated charging current (A) */
    targetCurrentA: number;
    /** Rounded to standard size (A) (Effective value used for calculation) */
    recommendedCurrentA: number;
    /** Original recommended current (A) before override */
    originalRecommendedCurrentA?: number;
    /** Expected charge time 0→100% (h) */
    chargingTimeHours: number;
}

/**
 * Inverter recommendation
 */
export interface InverterRecommendation {
    /** Is inverter required? */
    needed: boolean;
    /** Maximum simultaneous load (W) */
    peakLoadW: number;
    /** Rounded to standard size (W) (Effective value used for calculation) */
    recommendedW: number;
    /** Original recommended power (W) before override */
    originalRecommendedW?: number;
}

/**
 * Solar controller recommendation
 */
export interface ControllerRecommendation {
    /** Is controller required? */
    needed: boolean;
    /** Controller type (always mppt) */
    type: ControllerType;
    /** Recommended current rating (A) (Effective value used for calculation) */
    currentA: number;
    /** Original recommended current (A) before override */
    originalCurrentA?: number;
    /** Max input capacity (Wp) */
    maxInputWp: number;
}

/**
 * Cable recommendation
 */
export interface CableRecommendation {
    /** Route identifier */
    route: string;
    /** Display name (e.g. "Starterbatterie → Ladebooster") */
    displayName: string;
    /** Cable length in meters */
    lengthM: number;
    /** Expected current (A) */
    currentA: number;
    /** Line voltage (V) */
    voltage: number;
    /** Calculated minimum cross-section (mm²) */
    minCrossSection: number;
    /** Rounded to standard size (mm²) */
    recommendedCrossSection: number;
    /** Uses critical voltage drop (2%) vs normal (3%) */
    isCritical: boolean;
}

/**
 * Complete algorithm output
 */
export interface AlgorithmOutput {
    /** Battery recommendation */
    battery: BatteryRecommendation;
    /** Solar recommendation */
    solar: SolarRecommendation;
    /** Booster recommendation */
    booster: BoosterRecommendation;
    /** Charger recommendation */
    charger: ChargerRecommendation;
    /** Inverter recommendation */
    inverter: InverterRecommendation;
    /** Controller recommendation */
    controller: ControllerRecommendation;
    /** Cable recommendations */
    cables: CableRecommendation[];
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default cable lengths
 */
export const DEFAULT_CABLE_LENGTHS: CableLengths = {
    starterToService: 2,
    boosterToService: 1,
    solarToRegulator: 3,
    regulatorToService: 1,
    chargerToService: 1,
    serviceToInverter: 1,
    batteryToFuseBox: 1,
};

/**
 * Default brand preferences (no preferences)
 */
export const DEFAULT_BRAND_PREFERENCES: BrandPreferences = {
    charger: null,
    battery: null,
    solar: null,
};

/**
 * Default custom overrides (no overrides)
 */
export const DEFAULT_CUSTOM_OVERRIDES: CustomOverrides = {
    battery: null,
    solar: null,
    booster: null,
    controller: null,
    inverter: null,
    charger: null,
};

/**
 * Default algorithm input
 */
export const DEFAULT_ALGORITHM_INPUT: AlgorithmInput = {
    systemVoltage: 12,
    vehicleVoltage: 12,
    batteryPreference: 'lifepo4',
    energySources: [],
    roofModuleType: 'rigid',
    roofAreas: [],
    solarBags: [],
    chargerSpeed: 'normal',
    alternatorTier: 'standard',
    consumers: [],
    simultaneousLoad: 'moderate',
    travelBehavior: {
        season: 'summer',
        tripDuration: 'week',
        winterLocation: 'germany',
        standingDuration: 'medium',
    },
    autarchyDays: 6,
    cableLengths: DEFAULT_CABLE_LENGTHS,
    brandPreferences: DEFAULT_BRAND_PREFERENCES,
    customOverrides: DEFAULT_CUSTOM_OVERRIDES,
};
