/**
 * Camper Electric System Algorithm
 * 
 * Haupt-Algorithmus zur Berechnung der elektrischen Anforderungen
 * für Wohnmobil-Setups.
 * 
 * Quellen:
 * - 01-constants.md (Konstanten)
 * - 02-inputs-and-forms.md (Inputs)
 * - 03-outputs.md (Outputs)
 * - 05-algorithm-flow.md (Berechnungslogik)
 */

import {
    AlgorithmInput,
    AlgorithmOutput,
    BatteryRecommendation,
    SolarRecommendation,
    BoosterRecommendation,
    ChargerRecommendation,
    InverterRecommendation,
    ControllerRecommendation,
    CableRecommendation,
    Consumer,
    BatteryPreference,
    Season,
    WinterLocation,
    ChargerSpeed,
    SimultaneousLoad,
    StandingDuration,
    RoofModuleType,
    AlgorithmSettingsData,
} from './types';

import {
    // Battery
    DOD_LIFEPO4,
    DOD_AGM,
    DOD_GEL,
    BATTERY_SAFETY_FACTOR,
    MAX_BACKUP_DAYS,

    // Solar
    PSH_MATRIX,
    ALL_YEAR_PSH_MULTIPLIER,
    CLOUDY_YIELD_FACTOR,
    CLOUDY_YIELD_FACTOR_SUMMER,
    CLOUDY_YIELD_FACTOR_WINTER,
    RECOMMENDED_SOLAR_FACTOR,
    MAX_PORTABLE_WP,
    TRIP_MAX_BACKUP_DAYS,
    WP_PER_M2_RIGID,
    WP_PER_M2_FLEXIBLE,
    ROOF_UTILIZATION_FACTOR,
    ROOF_ORIENTATION_FACTOR,
    PORTABLE_ORIENTATION_FACTOR,
    SOLAR_SYSTEM_EFFICIENCY,
    SOLAR_CONTROLLER_SAFETY,

    // Booster
    DEFAULT_BOOSTER_AMPS,
    BOOSTER_EFFICIENCY,
    ALTERNATOR_DRIVE_HOURS,

    // Charger
    CHARGER_TIME_HOURS_SLOW,
    CHARGER_TIME_HOURS_NORMAL,
    CHARGER_TIME_HOURS_FAST,

    // Inverter
    SIMULTANEOUS_LOW,
    SIMULTANEOUS_MODERATE,
    SIMULTANEOUS_HIGH,

    // Cooling
    DUTY_CYCLE_COMPRESSOR,
    DUTY_CYCLE_ABSORBER,

    // Wiring
    VOLTAGE_DROP_CRITICAL,
    VOLTAGE_DROP_NORMAL,
    COPPER_CONDUCTIVITY,

    // Standard sizes
    STANDARD_CURRENT_SIZES,
    STANDARD_INVERTER_SIZES,
    STANDARD_CABLE_SIZES,
    CABLE_AMPACITY_LIMITS,

    // Mappings
    STANDING_DAYS_MAP,
    AUTARCHY_UNLIMITED,
} from './constants';

// =============================================================================
// PHASE 1: LOOKUP FUNCTIONS
// =============================================================================

// =============================================================================
// PHASE 0: SETTINGS HELPER
// =============================================================================

/**
 * Get a setting value with fallback to hardcoded constant
 */
function getSetting<T>(input: AlgorithmInput, key: keyof AlgorithmSettingsData, fallback: T): T {
    if (!input.settings) return fallback;
    const val = input.settings[key];
    // Check if val is defined and not null (0 is valid)
    if (val !== undefined && val !== null) {
        return val as unknown as T;
    }
    return fallback;
}

// =============================================================================
// PHASE 1: LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get Depth of Discharge based on battery preference
 */
export function getDoD(batteryPreference: BatteryPreference, input?: AlgorithmInput): number {
    switch (batteryPreference) {
        case 'lifepo4':
            return input ? getSetting(input, 'dodLifepo4', DOD_LIFEPO4) : DOD_LIFEPO4;
        case 'agm':
            return input ? getSetting(input, 'dodAgm', DOD_AGM) : DOD_AGM;
        case 'gel':
            return input ? getSetting(input, 'dodGel', DOD_GEL) : DOD_GEL;
        default:
            return input ? getSetting(input, 'dodLifepo4', DOD_LIFEPO4) : DOD_LIFEPO4;
    }
}

/**
 * Get Peak Sun Hours based on season and winter location
 */
export function getPSH(season: Season, winterLocation: WinterLocation, input?: AlgorithmInput): number {
    const regionData = PSH_MATRIX[winterLocation];
    const allYearMultiplier = input ? getSetting(input, 'allYearPshMultiplier', ALL_YEAR_PSH_MULTIPLIER) : ALL_YEAR_PSH_MULTIPLIER;

    switch (season) {
        case 'summer':
            return regionData.summer;
        case 'winter':
            return regionData.winter;
        case 'all_year':
            // WICHTIG: Winter × Multiplier
            return regionData.winter * allYearMultiplier;
        default:
            return regionData.summer; // Fallback
    }
}

/**
 * Get Wp per m² based on roof module type
 */
export function getWpPerM2(roofModuleType: RoofModuleType, input?: AlgorithmInput): number {
    switch (roofModuleType) {
        case 'rigid':
            return input ? getSetting(input, 'wpPerM2Rigid', WP_PER_M2_RIGID) : WP_PER_M2_RIGID;
        case 'flexible':
            return input ? getSetting(input, 'wpPerM2Flexible', WP_PER_M2_FLEXIBLE) : WP_PER_M2_FLEXIBLE;
        default:
            return input ? getSetting(input, 'wpPerM2Rigid', WP_PER_M2_RIGID) : WP_PER_M2_RIGID;
    }
}

/**
 * Get target charge time in hours based on charger speed
 */
export function getChargerTimeHours(chargerSpeed: ChargerSpeed, input?: AlgorithmInput): number {
    switch (chargerSpeed) {
        case 'slow':
            return input ? getSetting(input, 'chargerTimeSlow', CHARGER_TIME_HOURS_SLOW) : CHARGER_TIME_HOURS_SLOW;
        case 'normal':
            return input ? getSetting(input, 'chargerTimeNormal', CHARGER_TIME_HOURS_NORMAL) : CHARGER_TIME_HOURS_NORMAL;
        case 'fast':
            return input ? getSetting(input, 'chargerTimeFast', CHARGER_TIME_HOURS_FAST) : CHARGER_TIME_HOURS_FAST;
        default:
            return input ? getSetting(input, 'chargerTimeNormal', CHARGER_TIME_HOURS_NORMAL) : CHARGER_TIME_HOURS_NORMAL;
    }
}

/**
 * Get simultaneous factor based on load level
 */
export function getSimultaneousFactor(simultaneousLoad: SimultaneousLoad, input?: AlgorithmInput): number {
    switch (simultaneousLoad) {
        case 'low':
            return input ? getSetting(input, 'simultaneousFactorLow', SIMULTANEOUS_LOW) : SIMULTANEOUS_LOW;
        case 'moderate':
            return input ? getSetting(input, 'simultaneousFactorModerate', SIMULTANEOUS_MODERATE) : SIMULTANEOUS_MODERATE;
        case 'high':
            return input ? getSetting(input, 'simultaneousFactorHigh', SIMULTANEOUS_HIGH) : SIMULTANEOUS_HIGH;
        default:
            return input ? getSetting(input, 'simultaneousFactorModerate', SIMULTANEOUS_MODERATE) : SIMULTANEOUS_MODERATE;
    }
}

/**
 * Get standing days based on standing duration
 */
export function getStandingDays(standingDuration: StandingDuration, input?: AlgorithmInput): number {
    switch (standingDuration) {
        case 'short':
            return input ? getSetting(input, 'standingDaysShort', STANDING_DAYS_MAP.short) : STANDING_DAYS_MAP.short;
        case 'medium':
            return input ? getSetting(input, 'standingDaysMedium', STANDING_DAYS_MAP.medium) : STANDING_DAYS_MAP.medium;
        case 'long':
            return input ? getSetting(input, 'standingDaysLong', STANDING_DAYS_MAP.long) : STANDING_DAYS_MAP.long;
        default:
            return input ? getSetting(input, 'standingDaysMedium', STANDING_DAYS_MAP.medium) : STANDING_DAYS_MAP.medium;
    }
}

// =============================================================================
// PHASE 2: HELPER FUNCTIONS
// =============================================================================

/**
 * Round up to next multiple of 50
 */
export function roundUpTo50(value: number): number {
    return Math.ceil(value / 50) * 50;
}

/**
 * Round up to next multiple of 100
 */
export function roundUpTo100(value: number): number {
    return Math.ceil(value / 100) * 100;
}

/**
 * Round up to next standard value from array
 * If standards array is empty, returns ceil of raw value (no rounding to standards)
 */
export function roundUpToStandard(value: number, standards: readonly number[]): number {
    // If no standards defined, return the raw value rounded up
    if (standards.length === 0) {
        return Math.ceil(value);
    }

    for (const std of standards) {
        if (value <= std) {
            return std;
        }
    }
    // If larger than all standards, return the largest
    return standards[standards.length - 1];
}

/**
 * Round to nearest standard value from array
 */
export function roundToNearest(value: number, standards: readonly number[]): number {
    let closest = standards[0];
    let minDiff = Math.abs(value - closest);

    for (const std of standards) {
        const diff = Math.abs(value - std);
        if (diff < minDiff) {
            closest = std;
            minDiff = diff;
        }
    }

    return closest;
}


/**
 * Determine minimum cable size based on ampacity (Current Carrying Capacity)
 * Returns the smallest standard size that can handle the current.
 */
export function getMinCrossSectionForAmpacity(currentA: number): number {
    // Check defined limits, sorted by size asc
    const sortedLimits = Object.entries(CABLE_AMPACITY_LIMITS)
        .map(([s, l]) => ({ size: parseFloat(s), limit: l }))
        .sort((a, b) => a.size - b.size);

    for (const { size, limit } of sortedLimits) {
        if (currentA <= limit) {
            return size;
        }
    }
    // If logical limit exceeded, return largest
    return 95; // Max defined size
}

// =============================================================================
// PHASE 3: CORE CALCULATIONS
// =============================================================================

/**
 * Calculate daily consumption from consumers
 * 
 * WICHTIG: Duty Cycles für Kühlgeräte beachten!
 */
export function calculateDailyConsumption(consumers: Consumer[], input?: AlgorithmInput): number {
    let totalWh = 0;

    // Duty Cycles
    const dcCompressor = input ? getSetting(input, 'dutyCycleCompressor', DUTY_CYCLE_COMPRESSOR) : DUTY_CYCLE_COMPRESSOR;
    const dcAbsorber = input ? getSetting(input, 'dutyCycleAbsorber', DUTY_CYCLE_ABSORBER) : DUTY_CYCLE_ABSORBER;

    for (const consumer of consumers) {
        let consumerWh: number;

        if (consumer.coolingMethod === 'compressor') {
            // Kompressor-Kühlgerät
            consumerWh = consumer.power * consumer.daily * dcCompressor;
        } else if (consumer.coolingMethod === 'absorber') {
            // Absorber-Kühlgerät
            const electricShare = consumer.electricShare ?? 1.0;
            consumerWh = consumer.power * consumer.daily * dcAbsorber * electricShare;
        } else {
            // Normaler Verbraucher
            consumerWh = consumer.power * consumer.daily;
        }

        totalWh += consumerWh;
    }

    return totalWh;
}

/**
 * Calculate solar recommendation
 */
export function calculateSolar(input: AlgorithmInput, dailyWh: number, psh: number): SolarRecommendation {
    const hasSolar = input.energySources.includes('solar');

    // Wenn kein Solar gewählt
    if (!hasSolar) {
        return {
            needed: false,
            requiredWp: 0,
            maxRoofWp: 0,
            portableWp: 0,
            totalAvailableWp: 0,
            dailySolarYieldWh: 0,
            solarShortfallWh: 0,
            recommendation: 'Kein Solar gewählt',
        };
    }

    // Settings
    const wpPerM2 = getWpPerM2(input.roofModuleType, input);
    const roofUtilization = getSetting(input, 'roofUtilizationFactor', ROOF_UTILIZATION_FACTOR);
    const roofOrient = getSetting(input, 'roofOrientationFactor', ROOF_ORIENTATION_FACTOR);
    const portableOrient = getSetting(input, 'portableOrientationFactor', PORTABLE_ORIENTATION_FACTOR);
    const sysEfficiency = getSetting(input, 'solarSystemEfficiency', SOLAR_SYSTEM_EFFICIENCY);
    const solarDimFactor = getSetting(input, 'solarDimensioningFactor', RECOMMENDED_SOLAR_FACTOR);
    const maxPortable = getSetting(input, 'maxPortableWp', MAX_PORTABLE_WP);

    // 3.1 Maximales Dach-Wp berechnen
    let maxRoofWp = 0;
    // Defensive check: ensure roofAreas is an array
    const roofAreas = Array.isArray(input.roofAreas) ? input.roofAreas : [];
    for (const area of roofAreas) {
        const areaM2 = (area.length / 100) * (area.width / 100);
        const areaWp = areaM2 * wpPerM2 * roofUtilization * roofOrient;
        maxRoofWp += areaWp;
    }
    maxRoofWp = Math.round(maxRoofWp);

    // 3.2 Benötigtes Solar-Wp berechnen (Backtracking)
    const rawRequiredWp = dailyWh / (psh * sysEfficiency * roofOrient);
    const recommendedWp = rawRequiredWp * solarDimFactor;

    // 3.3 Portable Solar ermitteln (gecappt auf MAX_PORTABLE_WP)
    // STRATEGIE-ÄNDERUNG: Bei kurzen Trips (Wochenende) keine mobile Solartasche erzwingen,
    // stattdessen lieber Batterie vergrößern (passiert in calculateBattery durch solarShortfallWh)
    const existingPortableWp = input.solarBags.reduce((sum, bag) => sum + bag.power, 0);

    // Check if we should suppress portable recommendation
    const isShortTrip = ['weekend', 'week'].includes(input.travelBehavior.tripDuration);
    const suppressPortableRec = isShortTrip && existingPortableWp === 0;

    let portableWp = 0;
    if (suppressPortableRec) {
        // Don't recommend extra portable solar, just use what exists (0)
        portableWp = existingPortableWp;
    } else {
        // Normal logic: Recommend portable if needed
        portableWp = Math.min(existingPortableWp, maxPortable);

        // If we need more solar and allowed to recommend portable
        if (maxRoofWp < recommendedWp && existingPortableWp === 0) {
            // Calculate needed portable
            const neededPortable = Math.min(recommendedWp - maxRoofWp, maxPortable);
            portableWp = roundUpTo100(neededPortable);
        }
    }

    // =========================================================================
    // DYNAMIC OVERRIDE: Check if user has set a custom solar power
    // This override essentially replaces the "Available System" logic for calculations
    // =========================================================================

    // Default: Total Wp is sum of roof + portable
    let totalWp = maxRoofWp + portableWp;

    // Override: If user set custom Wp, we assume that IS the system size they will build
    // For calculation purposes, we treat it as roof solar (or generic solar)
    if (input.customOverrides.solar !== null) {
        totalWp = input.customOverrides.solar;
    }

    // 3.4 Täglicher Solar-Ertrag berechnen
    // Note: If overridden, we calculate yield based on totalWp using roof efficiency for simplicity
    // If not overridden, we treat roof and portable separately as before

    let dailySolarYieldWh: number;

    if (input.customOverrides.solar !== null) {
        // Override scenario: All solar treated with roof efficiency (conservative)
        dailySolarYieldWh = totalWp * psh * sysEfficiency * roofOrient;
    } else {
        // Standard scenario
        const roofYieldWh = maxRoofWp * psh * sysEfficiency;
        const portableYieldWh = portableWp * psh * sysEfficiency * portableOrient;
        dailySolarYieldWh = roofYieldWh + portableYieldWh;
    }

    // 3.5 Solar-Shortfall berechnen (für Batterie-Kompensation)
    const solarShortfallWh = Math.max(0, dailyWh - dailySolarYieldWh);

    // 3.6 Empfehlungstext generieren - remains based on original calculations to show gap
    let recommendation: string;
    if (maxRoofWp >= recommendedWp) {
        recommendation = 'Dachfläche reicht aus';
    } else if (maxRoofWp > 0 && portableWp > 0) {
        recommendation = 'Dachfläche + portable Solartaschen empfohlen';
    } else if (maxRoofWp === 0 && portableWp > 0) {
        recommendation = 'Nur portable Solartaschen möglich';
    } else if (solarShortfallWh > 0) {
        // Refined text
        if (['weekend', 'week'].includes(input.travelBehavior.tripDuration)) {
            recommendation = 'Solar limitiert - Kompensation durch größere Batterie';
        } else {
            recommendation = 'Solar reicht nicht aus - erhöhte Batterie empfohlen';
        }
    } else {
        recommendation = 'Keine Solarfläche definiert';
    }

    return {
        needed: true,
        requiredWp: Math.round(recommendedWp),
        maxRoofWp,
        portableWp, // Will be 0 if suppressed
        totalAvailableWp: totalWp,
        dailySolarYieldWh: Math.round(dailySolarYieldWh),
        solarShortfallWh: Math.round(solarShortfallWh),
        recommendation,
    };
}

/**
 * Calculate booster recommendation
 */
export function calculateBooster(input: AlgorithmInput, standingDays: number): BoosterRecommendation {
    const hasAlternator = input.energySources.includes('alternator');

    if (!hasAlternator) {
        return {
            needed: false,
            inputCurrentA: 0,
            outputCurrentA: 0,
            currentA: 0,
            inputVoltage: input.vehicleVoltage,
            outputVoltage: input.systemVoltage,
            needsConversion: false,
            dailyAlternatorChargeWh: 0,
        };
    }

    // Settings
    const defaultAmps = getSetting(input, 'defaultBoosterAmps', DEFAULT_BOOSTER_AMPS);
    const boosterEff = getSetting(input, 'boosterEfficiency', BOOSTER_EFFICIENCY);
    const driveHours = getSetting(input, 'alternatorDriveHours', ALTERNATOR_DRIVE_HOURS);

    // Input current from alternator (standard load)
    const standardInputCurrentA = defaultAmps;

    // Calculate output current based on power conservation
    // Formula: OutputCurrent = (InputVoltage × InputCurrent × Efficiency) / OutputVoltage
    const standardOutputCurrentA = (
        input.vehicleVoltage *
        standardInputCurrentA *
        boosterEff
    ) / input.systemVoltage;

    // Override logic - applies to OUTPUT current (what products are rated by)
    let effectiveInputCurrentA = standardInputCurrentA;
    let effectiveOutputCurrentA = standardOutputCurrentA;

    if (input.customOverrides.booster !== null) {
        // User override is for OUTPUT current (product rating)
        effectiveOutputCurrentA = input.customOverrides.booster;
        // Recalculate input current to maintain power balance
        effectiveInputCurrentA = (
            input.systemVoltage *
            effectiveOutputCurrentA
        ) / (input.vehicleVoltage * boosterEff);
    }

    // Daily charge calculation uses OUTPUT power
    const dailyAlternatorChargeWh = (
        effectiveOutputCurrentA *
        input.systemVoltage *
        driveHours
    ) / standingDays;

    return {
        needed: true,
        inputCurrentA: effectiveInputCurrentA,
        outputCurrentA: effectiveOutputCurrentA,
        currentA: effectiveOutputCurrentA, // Legacy - maps to output
        originalCurrentA: standardOutputCurrentA,
        inputVoltage: input.vehicleVoltage,
        outputVoltage: input.systemVoltage,
        needsConversion: input.vehicleVoltage !== input.systemVoltage,
        dailyAlternatorChargeWh: Math.round(dailyAlternatorChargeWh),
    };
}

/**
 * Calculate battery recommendation
 * 
 * KRITISCH bei autarchyDays = 999:
 * - Sustainability-Check: Solar MUSS dailyWh decken
 * - Alternator wird für diesen Check IGNORIERT
 * 
 * WICHTIG: 
 * - Mindest-Batterie für Nachtverbrauch
 * - Saisonaler Schlechtwetter-Faktor (Sommer 50%, Winter 20%, Ganzjahr 30%)
 * - Trip-Dauer begrenzt Backup-Tage
 * - Solar-Shortfall erhöht Batterie-Kapazität
 */
export function calculateBattery(
    input: AlgorithmInput,
    dailyWh: number,
    solarYieldWh: number,
    alternatorWh: number,
    solarShortfallWh: number = 0
): BatteryRecommendation {
    const dod = getDoD(input.batteryPreference, input);
    const hasSolar = input.energySources.includes('solar');
    const hasAlternator = input.energySources.includes('alternator');

    // Settings
    const cloudFactorSummer = getSetting(input, 'cloudyYieldFactorSummer', CLOUDY_YIELD_FACTOR_SUMMER);
    const cloudFactorWinter = getSetting(input, 'cloudyYieldFactorWinter', CLOUDY_YIELD_FACTOR_WINTER);
    const cloudFactorGeneral = getSetting(input, 'cloudyYieldFactor', CLOUDY_YIELD_FACTOR);
    const maxBackup = getSetting(input, 'maxBackupDays', MAX_BACKUP_DAYS);
    const safetyFactor = getSetting(input, 'batterySafetyFactor', BATTERY_SAFETY_FACTOR);

    // =========================================================================
    // Saisonaler Schlechtwetter-Faktor
    // =========================================================================
    let seasonalCloudyFactor: number;
    switch (input.travelBehavior.season) {
        case 'summer':
            seasonalCloudyFactor = cloudFactorSummer; // 0.50
            break;
        case 'winter':
            seasonalCloudyFactor = cloudFactorWinter; // 0.20
            break;
        default: // all_year
            seasonalCloudyFactor = cloudFactorGeneral; // 0.30
    }

    // Schlechtwetter-Ertrag
    const badWeatherSolarYieldWh = solarYieldWh * seasonalCloudyFactor;

    // Gesamte Ladung bei Schlechtwetter (inkl. Alternator)
    const totalChargingWh = badWeatherSolarYieldWh + alternatorWh;

    // Defizit bei Schlechtwetter
    let deficit = dailyWh - totalChargingWh;
    if (deficit < 0) {
        deficit = 0; // Überschuss, kein Defizit
    }

    // =========================================================================
    // Backup-Tage ermitteln (Saison + Trip-Dauer kombiniert)
    // =========================================================================
    const seasonalMaxBackup = input.travelBehavior.season === 'summer' ? 3 : maxBackup;
    const tripMaxBackup = TRIP_MAX_BACKUP_DAYS[input.travelBehavior.tripDuration] || maxBackup;
    const effectiveMaxBackup = Math.min(seasonalMaxBackup, tripMaxBackup);

    let backupDays: number;
    if (input.autarchyDays === AUTARCHY_UNLIMITED) {
        // Unbegrenzt: Sustainability-Check
        // WICHTIG: Alternator wird für diesen Check IGNORIERT!
        if (solarYieldWh < dailyWh) {
            console.warn('⚠️ Solar reicht nicht für Vollautarkie! Solar:', solarYieldWh, 'Wh, Bedarf:', dailyWh, 'Wh');
        }
        backupDays = effectiveMaxBackup;
    } else {
        backupDays = Math.min(input.autarchyDays, effectiveMaxBackup);
    }

    // Batteriekapazität berechnen (Schlechtwetter-basiert)
    const rawCapacityWh = deficit * backupDays;
    const bufferedCapacityWh = rawCapacityWh * safetyFactor;
    let minCapacityAh = bufferedCapacityWh / (input.systemVoltage * dod);

    // =========================================================================
    // MINDEST-BATTERIE für Nachtverbrauch (ca. 14 Stunden ohne Solar)
    // =========================================================================
    const nightHoursFraction = 14 / 24; // ~0.58
    const nightConsumptionWh = dailyWh * nightHoursFraction;
    const nightCapacityAh = (nightConsumptionWh * safetyFactor) / (input.systemVoltage * dod);
    minCapacityAh = Math.max(minCapacityAh, nightCapacityAh);

    // =========================================================================
    // ZUSATZ-BATTERIE wenn Solar (Dach + Tasche) nicht reicht
    // =========================================================================
    if (solarShortfallWh > 0 && hasSolar) {
        const shortfallCapacityAh = (solarShortfallWh * backupDays * safetyFactor) / (input.systemVoltage * dod);

        // STRATEGIE: Bei kurzen Trips (Wochenende) gleichen wir das Solar-Defizit VOLL mit Batterie aus (Faktor 1.0)
        // Bei langen Trips nur zu 50%, da man sonst riesige Batterien bräuchte
        const isShortTrip = ['weekend', 'week'].includes(input.travelBehavior.tripDuration);
        const shortfallFactor = isShortTrip ? 1.0 : 0.5;

        minCapacityAh = minCapacityAh + shortfallCapacityAh * shortfallFactor;
    }

    const recommendedCapacityAh = roundUpTo50(minCapacityAh);

    return {
        dailyWh: Math.round(dailyWh),
        minCapacityAh: Math.round(minCapacityAh),
        recommendedCapacityAh,
        type: input.batteryPreference,
        voltage: input.systemVoltage,
        autarchyDays: backupDays,
        hasSolar,
        hasAlternator,
    };
}

/**
 * Calculate charger recommendation (shore power)
 */
export function calculateCharger(input: AlgorithmInput, batteryAh: number): ChargerRecommendation {
    const hasShorePower = input.energySources.includes('shore_power');

    if (!hasShorePower) {
        return {
            needed: false,
            targetCurrentA: 0,
            recommendedCurrentA: 0,
            chargingTimeHours: 0,
        };
    }

    // Use settings for charge time target
    const chargerTimeHours = getChargerTimeHours(input.chargerSpeed, input);

    // Note: use getSetting only if these lists are dynamic in future
    const standardSizes = STANDARD_CURRENT_SIZES;

    const targetCurrentA = batteryAh / chargerTimeHours;
    const standardRecommendedCurrentA = roundUpToStandard(targetCurrentA, standardSizes);

    // Override logic
    let effectiveRecommendedCurrentA = standardRecommendedCurrentA;
    if (input.customOverrides.charger !== null) {
        effectiveRecommendedCurrentA = input.customOverrides.charger;
    }

    // Use EFFECTIVE current for charging time calculation
    const actualChargingTimeHours = batteryAh / effectiveRecommendedCurrentA;

    return {
        needed: true,
        targetCurrentA: Math.round(targetCurrentA * 10) / 10,
        recommendedCurrentA: effectiveRecommendedCurrentA,
        originalRecommendedCurrentA: standardRecommendedCurrentA, // Store original
        chargingTimeHours: Math.round(actualChargingTimeHours * 10) / 10,
    };
}

/**
 * Calculate inverter recommendation
 */
export function calculateInverter(input: AlgorithmInput, consumers: Consumer[], simultaneousFactor: number): InverterRecommendation {
    // Filter 230V consumers
    const consumers230V = consumers.filter(c => c.voltage === 230);

    if (consumers230V.length === 0) {
        return {
            needed: false,
            peakLoadW: 0,
            recommendedW: 0,
        };
    }

    // Calculate total 230V power
    const total230VPower = consumers230V.reduce((sum, c) => sum + c.power, 0);

    // Find max single load
    const maxSingleLoad = Math.max(...consumers230V.map(c => c.power));

    // Calculate peak load with simultaneity factor
    const peakLoadW = maxSingleLoad + (total230VPower - maxSingleLoad) * simultaneousFactor;

    // Round up to standard size
    const standardRecommendedW = roundUpToStandard(peakLoadW, STANDARD_INVERTER_SIZES);

    // Override logic
    let effectiveRecommendedW = standardRecommendedW;
    if (input.customOverrides.inverter !== null) {
        effectiveRecommendedW = input.customOverrides.inverter;
    }

    return {
        needed: true,
        peakLoadW: Math.round(peakLoadW),
        recommendedW: effectiveRecommendedW,
        originalRecommendedW: standardRecommendedW, // Store original
    };
}

/**
 * Calculate solar controller recommendation
 */
export function calculateController(input: AlgorithmInput, totalWp: number): ControllerRecommendation {
    const hasSolar = input.energySources.includes('solar');

    if (!hasSolar || totalWp === 0) {
        return {
            needed: false,
            type: 'mppt',
            currentA: 0,
            maxInputWp: 0,
        };
    }

    // Settings
    const safety = getSetting(input, 'solarControllerSafetyFactor', SOLAR_CONTROLLER_SAFETY);

    const rawCurrentA = totalWp / input.systemVoltage;
    const bufferedCurrentA = rawCurrentA * safety;
    const standardCurrentA = roundUpToStandard(bufferedCurrentA, STANDARD_CURRENT_SIZES);

    // Override logic
    let effectiveCurrentA = standardCurrentA;
    if (input.customOverrides.controller !== null) {
        effectiveCurrentA = input.customOverrides.controller;
    }

    return {
        needed: true,
        type: 'mppt', // Always recommend MPPT
        currentA: effectiveCurrentA,
        originalCurrentA: standardCurrentA, // Store original
        maxInputWp: totalWp,
    };
}

/**
 * Calculate cable cross-section
 * Formula: A = (2 × L × I) / (56 × ΔU)
 */
export function calculateCableCrossSection(
    lengthM: number,
    currentA: number,
    voltage: number,
    isCritical: boolean,
    input?: AlgorithmInput
): number {

    // Settings
    const dropCritical = input ? getSetting(input, 'voltageDropCritical', VOLTAGE_DROP_CRITICAL) : VOLTAGE_DROP_CRITICAL;
    const dropNormal = input ? getSetting(input, 'voltageDropNormal', VOLTAGE_DROP_NORMAL) : VOLTAGE_DROP_NORMAL;
    const conductivity = input ? getSetting(input, 'copperConductivity', COPPER_CONDUCTIVITY) : COPPER_CONDUCTIVITY;

    const voltageDropPercent = isCritical ? dropCritical : dropNormal;
    const allowedVoltageDrop = voltage * voltageDropPercent;

    // A = (2 × L × I) / (56 × ΔU)
    const minCrossSection = (2 * lengthM * currentA) / (conductivity * allowedVoltageDrop);

    return minCrossSection;
}

/**
 * Calculate all cable recommendations
 */
export function calculateCables(
    input: AlgorithmInput,
    booster: BoosterRecommendation,
    charger: ChargerRecommendation,
    inverter: InverterRecommendation,
    controller: ControllerRecommendation
): CableRecommendation[] {
    const cables: CableRecommendation[] = [];

    // Helper function to create cable recommendation
    const addCable = (
        route: string,
        displayName: string,
        lengthM: number,
        currentA: number,
        voltage: number,
        isCritical: boolean
    ) => {
        if (currentA <= 0 || lengthM <= 0) return;

        const minCrossSection = calculateCableCrossSection(lengthM, currentA, voltage, isCritical, input);
        const recommendedCrossSection = roundUpToStandard(minCrossSection, STANDARD_CABLE_SIZES);

        cables.push({
            route,
            displayName,
            lengthM,
            currentA,
            voltage,
            minCrossSection: Math.round(minCrossSection * 100) / 100,
            recommendedCrossSection: Math.max(recommendedCrossSection, getMinCrossSectionForAmpacity(currentA)),
            isCritical,
        });
    };

    // Booster cables (if alternator selected)
    if (booster.needed) {
        addCable(
            'starter_to_booster',
            'Starterbatterie → Ladebooster',
            input.cableLengths.starterToService,
            booster.inputCurrentA,
            input.vehicleVoltage,
            true
        );
        addCable(
            'booster_to_service',
            'Ladebooster → Versorgerbatterie',
            input.cableLengths.boosterToService,
            booster.outputCurrentA,
            input.systemVoltage,
            true
        );
    }

    // Inverter cable (if 230V consumers)
    if (inverter.needed) {
        const inverterCurrentA = inverter.recommendedW / input.systemVoltage;
        addCable(
            'service_to_inverter',
            'Versorgerbatterie → Wechselrichter',
            input.cableLengths.serviceToInverter,
            inverterCurrentA,
            input.systemVoltage,
            true
        );
    }

    // Charger cable (if shore power selected)
    if (charger.needed) {
        addCable(
            'charger_to_service',
            'Batterieladegerät → Versorgerbatterie',
            input.cableLengths.chargerToService,
            charger.recommendedCurrentA,
            input.systemVoltage,
            true
        );
    }

    // Solar cables (if solar selected)
    if (controller.needed) {
        addCable(
            'solar_to_regulator',
            'Solarmodule → Laderegler',
            input.cableLengths.solarToRegulator,
            controller.currentA,
            input.systemVoltage,
            false // Not critical
        );
        addCable(
            'regulator_to_service',
            'Laderegler → Versorgerbatterie',
            input.cableLengths.regulatorToService,
            controller.currentA,
            input.systemVoltage,
            false // Not critical
        );
    }

    // Fuse box cable (always)
    // Using a reasonable current estimate based on total consumption
    const fuseBoxCurrentA = 30; // Default estimate
    addCable(
        'battery_to_fuse_box',
        'Batterie → Sicherungskasten',
        input.cableLengths.batteryToFuseBox,
        fuseBoxCurrentA,
        input.systemVoltage,
        false // Not critical
    );

    return cables;
}

/**
 * Apply custom overrides to calculated output
 */
export function applyOverrides(
    output: AlgorithmOutput,
    overrides: AlgorithmInput['customOverrides']
): AlgorithmOutput {
    const result = { ...output };

    if (overrides.battery !== null) {
        // Apply battery override so the prompt shows the user's chosen value
        result.battery = { ...result.battery, recommendedCapacityAh: overrides.battery };
    }
    if (overrides.solar !== null) {
        // Apply solar override so the prompt shows the user's chosen value
        result.solar = { ...result.solar, requiredWp: overrides.solar };
    }
    if (overrides.booster !== null) {
        // result.booster = { ...result.booster, currentA: overrides.booster };
    }
    if (overrides.controller !== null) {
        // result.controller = { ...result.controller, currentA: overrides.controller };
    }
    if (overrides.inverter !== null) {
        // result.inverter = { ...result.inverter, recommendedW: overrides.inverter };
    }
    if (overrides.charger !== null) {
        // result.charger = { ...result.charger, recommendedCurrentA: overrides.charger };
    }

    return result;
}

// =============================================================================
// MAIN ALGORITHM FUNCTION
// =============================================================================

/**
 * Calculate all requirements for the camper electric system
 */
export function calculateRequirements(input: AlgorithmInput): AlgorithmOutput {
    // 1. Get lookup values
    const psh = getPSH(input.travelBehavior.season, input.travelBehavior.winterLocation);
    const simultaneousFactor = getSimultaneousFactor(input.simultaneousLoad);
    const standingDays = getStandingDays(input.travelBehavior.standingDuration);

    // 2. Calculate daily consumption
    const dailyWh = calculateDailyConsumption(input.consumers);

    // 3. Calculate solar
    const solar = calculateSolar(input, dailyWh, psh);

    // 4. Calculate booster
    const booster = calculateBooster(input, standingDays);

    // 5. Calculate battery
    const battery = calculateBattery(
        input,
        dailyWh,
        solar.dailySolarYieldWh,
        booster.dailyAlternatorChargeWh,
        solar.solarShortfallWh
    );

    // 6. Calculate charger
    const charger = calculateCharger(input, battery.recommendedCapacityAh);

    // 7. Calculate inverter
    const inverter = calculateInverter(input, input.consumers, simultaneousFactor);

    // 8. Calculate controller
    // Use maxRoofWp directly to ensure the main controller is sized for Roof only.
    // This is independent of customOverrides and portable solar.
    const controller = calculateController(input, solar.maxRoofWp);

    // 9. Calculate cables
    const cables = calculateCables(input, booster, charger, inverter, controller);

    // 10. Create output
    let output: AlgorithmOutput = {
        battery,
        solar,
        booster,
        charger,
        inverter,
        controller,
        cables,
    };

    // 11. Apply custom overrides
    output = applyOverrides(output, input.customOverrides);

    return output;
}

// Default export
export default calculateRequirements;
