/**
 * Algorithm Constants
 * 
 * REGEL: Diese Konstanten MÜSSEN exakt wie spezifiziert verwendet werden.
 * Keine anderen Werte hardcoden!
 * 
 * Quelle: 01-constants.md
 */

// =============================================================================
// BATTERY CONSTANTS
// =============================================================================

/** Usable capacity LiFePO4 (95%) */
export const DOD_LIFEPO4 = 0.95;

/** Usable capacity AGM (50%) */
export const DOD_AGM = 0.50;

/** Usable capacity GEL (50%) */
export const DOD_GEL = 0.50;

/** Buffer multiplier (+20%) */
export const BATTERY_SAFETY_FACTOR = 1.20;

/** Max days pure battery reserve (no charging) */
export const MAX_BACKUP_DAYS = 5;

// =============================================================================
// SOLAR YIELD - PEAK SUN HOURS (PSH) MATRIX
// =============================================================================

/**
 * PSH Matrix - Peak Sun Hours by Region and Season
 * 
 * Logic:
 * - summer: Use Summer column
 * - winter: Use Winter column  
 * - all_year: Use Winter column × 1.1 (10% more than strict winter)
 */
export const PSH_MATRIX = {
  scandinavia: { summer: 5.8, mix: 2.5, winter: 0.4 },
  germany: { summer: 5.2, mix: 3.0, winter: 0.8 },
  southern: { summer: 6.5, mix: 4.2, winter: 2.2 },
  eastern: { summer: 5.5, mix: 3.2, winter: 1.0 },
  varies: { summer: 5.5, mix: 3.5, winter: 1.1 },
} as const;

/** all_year PSH multiplier (Winter × 1.1) */
export const ALL_YEAR_PSH_MULTIPLIER = 1.1;

/** Yield factor bad weather - Base (30% of normal PSH) */
export const CLOUDY_YIELD_FACTOR = 0.30;

/** Yield factor bad weather - Summer (50% of normal PSH) */
export const CLOUDY_YIELD_FACTOR_SUMMER = 0.50;

/** Yield factor bad weather - Winter (20% of normal PSH) */
export const CLOUDY_YIELD_FACTOR_WINTER = 0.20;

/** Safety buffer for recommended Wp (+20%) */
export const RECOMMENDED_SOLAR_FACTOR = 1.20;

/** Max portable solar bag Wp */
export const MAX_PORTABLE_WP = 400;

/** Trip duration to max backup days mapping */
export const TRIP_MAX_BACKUP_DAYS = {
  weekend: 2,
  week: 4,
  extended: 6,
  permanent: 8,
} as const;

// =============================================================================
// SOLAR TECHNICAL CONSTANTS
// =============================================================================

/** Wp per m² rigid panels */
export const WP_PER_M2_RIGID = 235;

/** Wp per m² flexible panels */
export const WP_PER_M2_FLEXIBLE = 180;

/** Usable roof area (80%) */
export const ROOF_UTILIZATION_FACTOR = 0.80;

/** Flat mounting loss (85% efficiency) */
export const ROOF_ORIENTATION_FACTOR = 0.85;

/** Aligned portable panels (100% efficiency) */
export const PORTABLE_ORIENTATION_FACTOR = 1.00;

/** MPPT/system losses (15% loss = 85% efficiency) */
export const SOLAR_SYSTEM_EFFICIENCY = 0.85;

/** Controller sizing buffer (+10%) */
export const SOLAR_CONTROLLER_SAFETY = 1.10;

// =============================================================================
// ALTERNATOR / BOOSTER CONSTANTS
// =============================================================================

/** Default B2B booster current (A) - Input current from alternator */
export const DEFAULT_BOOSTER_AMPS = 30;

/** B2B booster efficiency (typically 95%) */
export const BOOSTER_EFFICIENCY = 0.95;

/** Average driving hours when moving spots */
export const ALTERNATOR_DRIVE_HOURS = 2.0;

// =============================================================================
// SHORE POWER CHARGER CONSTANTS
// =============================================================================

/** Target charge time slow (hours) */
export const CHARGER_TIME_HOURS_SLOW = 12;

/** Target charge time normal (hours) */
export const CHARGER_TIME_HOURS_NORMAL = 8;

/** Target charge time fast (hours) */
export const CHARGER_TIME_HOURS_FAST = 5;

// =============================================================================
// SIMULTANEITY FACTORS (INVERTER SIZING)
// =============================================================================

/** Factor for "low" simultaneous usage */
export const SIMULTANEOUS_LOW = 0.3;

/** Factor for "moderate" simultaneous usage */
export const SIMULTANEOUS_MODERATE = 0.5;

/** Factor for "high" simultaneous usage */
export const SIMULTANEOUS_HIGH = 0.8;

// =============================================================================
// COOLING DUTY CYCLES
// =============================================================================

/** Compressor fridge (~35% runtime) */
export const DUTY_CYCLE_COMPRESSOR = 0.35;

/** Absorber fridge (~70% runtime) */
export const DUTY_CYCLE_ABSORBER = 0.70;

// =============================================================================
// WIRING CONSTANTS
// =============================================================================

/** Max 2% voltage drop for critical connections (inverter, charger) */
export const VOLTAGE_DROP_CRITICAL = 0.02;

/** Max 3% voltage drop for standard loads */
export const VOLTAGE_DROP_NORMAL = 0.03;

/** Max 3% voltage drop for solar lines */
export const VOLTAGE_DROP_SOLAR = 0.03;

/** Copper resistivity ρ in Ω·mm²/m */
export const COPPER_RESISTIVITY = 0.0178;

/** Copper conductivity for cable formula (m/Ω·mm²) */
export const COPPER_CONDUCTIVITY = 56;

// =============================================================================
// STANDARD SIZES FOR ROUNDING
// =============================================================================

/** Standard charger/controller current sizes (A) - DISABLED: AI will pick products */
// export const STANDARD_CURRENT_SIZES = [10, 20, 30, 40, 50, 60, 80, 100, 120, 150] as const;
export const STANDARD_CURRENT_SIZES: readonly number[] = []; // Empty = no rounding

/** Standard inverter sizes (W) - DISABLED: AI will pick products */
// export const STANDARD_INVERTER_SIZES = [500, 1000, 1500, 2000, 3000, 4000, 5000] as const;
export const STANDARD_INVERTER_SIZES: readonly number[] = []; // Empty = no rounding

/** Standard cable cross-sections (mm²) */
export const STANDARD_CABLE_SIZES = [1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95] as const;

/**
 * Max current (Ampacity) per cable size (ISO 6722 / DIN 72551 approximation)
 * Conservative values for continuous load in conduit/bundled
 */
export const CABLE_AMPACITY_LIMITS: Record<number, number> = {
  1.5: 12,  // Reduced from 15
  2.5: 18,  // Reduced from 22
  4: 25,    // Reduced from 30 - this ensures 30A upgrades to 6mm²
  6: 35,    // Reduced from 40
  10: 50,   // Reduced from 60
  16: 70,   // Reduced from 80
  25: 90,   // Reduced from 110 (conservative)
  35: 120,  // Reduced from 150
  50: 170,  // Reduced from 200
  70: 220,  // Reduced from 250
  95: 280,  // Reduced from 300
};

/** Standard battery capacity step (Ah) */
export const BATTERY_CAPACITY_STEP = 50;

/** Standard portable solar step (Wp) */
export const PORTABLE_SOLAR_STEP = 100;

// =============================================================================
// STANDING DURATION DAYS MAPPING
// =============================================================================

/** Days without driving for each standing duration option */
export const STANDING_DAYS_MAP = {
  short: 2,
  medium: 5,
  long: 8,
} as const;

// =============================================================================
// AUTARCHY DAYS CONSTRAINTS
// =============================================================================

/** Available autarchy days based on trip duration */
export const AUTARCHY_DAYS_CONSTRAINTS = {
  weekend: [2],
  week: [2, 6],
  extended: [2, 6, 10, 14, 20],
  permanent: [2, 6, 10, 14, 20, 999],
} as const;

/** Special value for unlimited autarchy */
export const AUTARCHY_UNLIMITED = 999;
