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
} from './types';

import {
    // Battery
    DOD_LIFEPO4,
    DOD_AGM,
    DOD_GEL,
    BATTERY_SAFETY_FACTOR,
    MAX_BACKUP_DAYS,
    BATTERY_CAPACITY_STEP,

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
    PORTABLE_SOLAR_STEP,

    // Booster
    DEFAULT_BOOSTER_AMPS,
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

/**
 * Get Depth of Discharge based on battery preference
 */
export function getDoD(batteryPreference: BatteryPreference): number {
    switch (batteryPreference) {
        case 'lifepo4':
            return DOD_LIFEPO4;
        case 'agm':
            return DOD_AGM;
        case 'gel':
            return DOD_GEL;
        default:
            return DOD_LIFEPO4; // Fallback
    }
}

/**
 * Get Peak Sun Hours based on season and winter location
 * 
 * KRITISCH: Bei all_year wird Winter × 1.1 verwendet, NICHT Summer!
 */
export function getPSH(season: Season, winterLocation: WinterLocation): number {
    const regionData = PSH_MATRIX[winterLocation];

    switch (season) {
        case 'summer':
            return regionData.summer;
        case 'winter':
            return regionData.winter;
        case 'all_year':
            // WICHTIG: Winter × 1.1, nicht Summer!
            return regionData.winter * ALL_YEAR_PSH_MULTIPLIER;
        default:
            return regionData.summer; // Fallback
    }
}

/**
 * Get Wp per m² based on roof module type
 */
export function getWpPerM2(roofModuleType: RoofModuleType): number {
    switch (roofModuleType) {
        case 'rigid':
            return WP_PER_M2_RIGID;
        case 'flexible':
            return WP_PER_M2_FLEXIBLE;
        default:
            return WP_PER_M2_RIGID; // Fallback
    }
}

/**
 * Get target charge time in hours based on charger speed
 */
export function getChargerTimeHours(chargerSpeed: ChargerSpeed): number {
    switch (chargerSpeed) {
        case 'slow':
            return CHARGER_TIME_HOURS_SLOW;
        case 'normal':
            return CHARGER_TIME_HOURS_NORMAL;
        case 'fast':
            return CHARGER_TIME_HOURS_FAST;
        default:
            return CHARGER_TIME_HOURS_NORMAL; // Fallback
    }
}

/**
 * Get simultaneous factor based on load level
 */
export function getSimultaneousFactor(simultaneousLoad: SimultaneousLoad): number {
    switch (simultaneousLoad) {
        case 'low':
            return SIMULTANEOUS_LOW;
        case 'moderate':
            return SIMULTANEOUS_MODERATE;
        case 'high':
            return SIMULTANEOUS_HIGH;
        default:
            return SIMULTANEOUS_MODERATE; // Fallback
    }
}

/**
 * Get standing days based on standing duration
 */
export function getStandingDays(standingDuration: StandingDuration): number {
    return STANDING_DAYS_MAP[standingDuration] ?? STANDING_DAYS_MAP.medium;
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
export function calculateDailyConsumption(consumers: Consumer[]): number {
    let totalWh = 0;

    for (const consumer of consumers) {
        let consumerWh: number;

        if (consumer.coolingMethod === 'compressor') {
            // Kompressor-Kühlgerät: 35% Duty Cycle
            consumerWh = consumer.power * consumer.daily * DUTY_CYCLE_COMPRESSOR;
        } else if (consumer.coolingMethod === 'absorber') {
            // Absorber-Kühlgerät: 70% Duty Cycle × electricShare
            const electricShare = consumer.electricShare ?? 1.0;
            consumerWh = consumer.power * consumer.daily * DUTY_CYCLE_ABSORBER * electricShare;
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

    const wpPerM2 = getWpPerM2(input.roofModuleType);

    // 3.1 Maximales Dach-Wp berechnen
    let maxRoofWp = 0;
    for (const area of input.roofAreas) {
        const areaM2 = (area.length / 100) * (area.width / 100);
        const areaWp = areaM2 * wpPerM2 * ROOF_UTILIZATION_FACTOR * ROOF_ORIENTATION_FACTOR;
        maxRoofWp += areaWp;
    }
    maxRoofWp = Math.round(maxRoofWp);

    // 3.2 Benötigtes Solar-Wp berechnen (Backtracking)
    const rawRequiredWp = dailyWh / (psh * SOLAR_SYSTEM_EFFICIENCY * ROOF_ORIENTATION_FACTOR);
    const recommendedWp = rawRequiredWp * RECOMMENDED_SOLAR_FACTOR;

    // 3.3 Portable Solar ermitteln (gecappt auf MAX_PORTABLE_WP = 400)
    const existingPortableWp = input.solarBags.reduce((sum, bag) => sum + bag.power, 0);
    const portableWp = Math.min(existingPortableWp, MAX_PORTABLE_WP);

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
        dailySolarYieldWh = totalWp * psh * SOLAR_SYSTEM_EFFICIENCY * ROOF_ORIENTATION_FACTOR;
    } else {
        // Standard scenario
        const roofYieldWh = maxRoofWp * psh * SOLAR_SYSTEM_EFFICIENCY * ROOF_ORIENTATION_FACTOR;
        const portableYieldWh = portableWp * psh * SOLAR_SYSTEM_EFFICIENCY * PORTABLE_ORIENTATION_FACTOR;
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
        recommendation = 'Solar reicht nicht aus - erhöhte Batterie empfohlen';
    } else {
        recommendation = 'Keine Solarfläche definiert';
    }

    return {
        needed: true,
        requiredWp: Math.round(recommendedWp), // The theoretical need remains unchanged
        maxRoofWp,
        portableWp,
        totalAvailableWp: totalWp, // Now reflects the OVERRIDDEN value if present
        dailySolarYieldWh: Math.round(dailySolarYieldWh), // Updated yield based on override
        solarShortfallWh: Math.round(solarShortfallWh), // Updated shortfall based on override
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
            currentA: 0,
            inputVoltage: input.vehicleVoltage,
            outputVoltage: input.systemVoltage,
            needsConversion: false,
            dailyAlternatorChargeWh: 0,
        };
    }

    const standardCurrentA = DEFAULT_BOOSTER_AMPS;

    // Override logic
    let effectiveCurrentA = standardCurrentA;
    if (input.customOverrides.booster !== null) {
        effectiveCurrentA = input.customOverrides.booster;
    }

    // Use EFFECTIVE current for yield calculation logic
    const dailyAlternatorChargeWh = (effectiveCurrentA * input.vehicleVoltage * ALTERNATOR_DRIVE_HOURS) / standingDays;

    return {
        needed: true,
        currentA: effectiveCurrentA,
        originalCurrentA: standardCurrentA, // Store original for UI
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
    const dod = getDoD(input.batteryPreference);
    const hasSolar = input.energySources.includes('solar');
    const hasAlternator = input.energySources.includes('alternator');

    // =========================================================================
    // Saisonaler Schlechtwetter-Faktor
    // =========================================================================
    let seasonalCloudyFactor: number;
    switch (input.travelBehavior.season) {
        case 'summer':
            seasonalCloudyFactor = CLOUDY_YIELD_FACTOR_SUMMER; // 0.50
            break;
        case 'winter':
            seasonalCloudyFactor = CLOUDY_YIELD_FACTOR_WINTER; // 0.20
            break;
        default: // all_year
            seasonalCloudyFactor = CLOUDY_YIELD_FACTOR; // 0.30
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
    const seasonalMaxBackup = input.travelBehavior.season === 'summer' ? 3 : MAX_BACKUP_DAYS;
    const tripMaxBackup = TRIP_MAX_BACKUP_DAYS[input.travelBehavior.tripDuration] || MAX_BACKUP_DAYS;
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
    const bufferedCapacityWh = rawCapacityWh * BATTERY_SAFETY_FACTOR;
    let minCapacityAh = bufferedCapacityWh / (input.systemVoltage * dod);

    // =========================================================================
    // MINDEST-BATTERIE für Nachtverbrauch (ca. 14 Stunden ohne Solar)
    // =========================================================================
    const nightHoursFraction = 14 / 24; // ~0.58
    const nightConsumptionWh = dailyWh * nightHoursFraction;
    const nightCapacityAh = (nightConsumptionWh * BATTERY_SAFETY_FACTOR) / (input.systemVoltage * dod);
    minCapacityAh = Math.max(minCapacityAh, nightCapacityAh);

    // =========================================================================
    // ZUSATZ-BATTERIE wenn Solar (Dach + Tasche) nicht reicht
    // =========================================================================
    if (solarShortfallWh > 0 && hasSolar) {
        const shortfallCapacityAh = (solarShortfallWh * backupDays * BATTERY_SAFETY_FACTOR) / (input.systemVoltage * dod);
        minCapacityAh = minCapacityAh + shortfallCapacityAh * 0.5; // 50% extra für Shortfall
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

    const chargerTimeHours = getChargerTimeHours(input.chargerSpeed);
    const targetCurrentA = batteryAh / chargerTimeHours;
    const standardRecommendedCurrentA = roundUpToStandard(targetCurrentA, STANDARD_CURRENT_SIZES);

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

    const rawCurrentA = totalWp / input.systemVoltage;
    const bufferedCurrentA = rawCurrentA * SOLAR_CONTROLLER_SAFETY;
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
    isCritical: boolean
): number {
    const voltageDropPercent = isCritical ? VOLTAGE_DROP_CRITICAL : VOLTAGE_DROP_NORMAL;
    const allowedVoltageDrop = voltage * voltageDropPercent;

    // A = (2 × L × I) / (56 × ΔU)
    const minCrossSection = (2 * lengthM * currentA) / (COPPER_CONDUCTIVITY * allowedVoltageDrop);

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

        const minCrossSection = calculateCableCrossSection(lengthM, currentA, voltage, isCritical);
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
            booster.currentA,
            input.vehicleVoltage,
            true
        );
        addCable(
            'booster_to_service',
            'Ladebooster → Versorgerbatterie',
            input.cableLengths.boosterToService,
            booster.currentA,
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
        'battery_to_fusebox',
        'Versorgerbatterie → Sicherungskasten',
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
        // Do not override recommendation - we want to show the calculated value vs manual value
        // result.battery = { ...result.battery, recommendedCapacityAh: overrides.battery };
    }
    if (overrides.solar !== null) {
        // Do not override requirement - allow comparison
        // result.solar = { ...result.solar, requiredWp: overrides.solar };
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
