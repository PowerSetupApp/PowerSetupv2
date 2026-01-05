/**
 * Adapter to convert new AlgorithmOutput to legacy SystemRequirements format
 * 
 * This ensures UI compatibility - the UI components don't need to change.
 */

import {
    AlgorithmOutput,
    AlgorithmInput,
    Consumer as AlgoConsumer,
} from './types';

import { calculateRequirements } from './algorithm';

// =============================================================================
// LEGACY TYPES (from old requirements-engine.ts)
// =============================================================================

export interface BatteryRequirement {
    dailyWh: number;
    dailySolarYieldWh: number;
    dailyAlternatorChargeWh: number;
    netDailyDeficitWh: number;
    minCapacityAh: number;
    recommendedCapacityAh: number;
    maxCapacityAh: number;
    type: string;
    voltage: number;
    autarchyDays: number;
    hasSolar: boolean;
    hasAlternator: boolean;
    debug?: any;
}

export interface InverterRequirement {
    needed: boolean;
    requiredW: number;
    recommendedW: number;
    maxSingleLoadW: number;
    total230VLoadW: number;
    simultaneousFactor: number;
}

export interface BoosterRequirement {
    needed: boolean;
    currentA: number;
    inputVoltage: number;
    outputVoltage: number;
    needsConversion: boolean;
    alternatorType: string;
}

export interface ChargerRequirement {
    needed: boolean;
    targetCurrentA: number;
    recommendedCurrentA: number;
    chargingTimeHours: number;
    isLimitedByBattery?: boolean;
}

export interface SolarControllerRequirement {
    needed: boolean;
    totalWp: number;
    roofWp: number;
    portableWp: number;
    currentA: number;
    recommendedCurrentA: number;
    type: 'MPPT' | 'PWM';
    needsSeparatePortableController: boolean;
}

export interface SolarModulesRequirement {
    needed: boolean;
    dailyWh: number;
    sunHoursPerDay: number;
    requiredWp: number;
    maxRoofWp: number;
    portableWp: number;
    totalAvailableWp: number;
    recommendation: string;
}

export interface CableRequirement {
    route: string;
    displayName: string;
    lengthM: number;
    currentA: number;
    voltage: number;
    minCrossSection: number;
    recommendedCrossSection: number;
    isCritical: boolean;
}

export interface SystemRequirements {
    systemVoltage: number;
    vehicleVoltage: number;
    batteryType: string;
    comfortLevel: string;
    dailyWh: number;
    battery: BatteryRequirement;
    inverter: InverterRequirement | null;
    booster: BoosterRequirement | null;
    charger: ChargerRequirement | null;
    solarController: SolarControllerRequirement | null;
    solarModules: SolarModulesRequirement | null;
    cables: CableRequirement[];
    calculatedAt: string;
    debug?: any;
    solarControllerClasses?: number[];
}

// =============================================================================
// ADAPTER FUNCTION
// =============================================================================

/**
 * Converts new AlgorithmOutput to legacy SystemRequirements format
 */
export function convertToSystemRequirements(
    output: AlgorithmOutput,
    input: AlgorithmInput
): SystemRequirements {
    // Calculate some values needed for legacy format
    const consumers230V = input.consumers.filter(c => c.voltage === 230);
    const total230VLoadW = consumers230V.reduce((sum, c) => sum + c.power, 0);
    const maxSingleLoadW = consumers230V.length > 0
        ? Math.max(...consumers230V.map(c => c.power))
        : 0;

    // Get simultaneity factor
    const simultaneousFactor = input.simultaneousLoad === 'low' ? 0.3
        : input.simultaneousLoad === 'moderate' ? 0.5
            : 0.8;

    return {
        systemVoltage: input.systemVoltage,
        vehicleVoltage: input.vehicleVoltage,
        batteryType: input.batteryPreference,
        comfortLevel: 'standard', // Removed from new algo, default to standard
        dailyWh: output.battery.dailyWh,

        battery: {
            dailyWh: output.battery.dailyWh,
            dailySolarYieldWh: output.solar.dailySolarYieldWh,
            dailyAlternatorChargeWh: output.booster.dailyAlternatorChargeWh,
            netDailyDeficitWh: output.solar.solarShortfallWh,
            minCapacityAh: output.battery.minCapacityAh,
            recommendedCapacityAh: output.battery.recommendedCapacityAh,
            maxCapacityAh: output.battery.recommendedCapacityAh * 2, // Rough estimate
            type: output.battery.type,
            voltage: output.battery.voltage,
            autarchyDays: output.battery.autarchyDays,
            hasSolar: output.battery.hasSolar,
            hasAlternator: output.battery.hasAlternator,
        },

        inverter: output.inverter.needed ? {
            needed: output.inverter.needed,
            requiredW: output.inverter.peakLoadW,
            recommendedW: output.inverter.recommendedW,
            maxSingleLoadW,
            total230VLoadW,
            simultaneousFactor,
        } : null,

        booster: output.booster.needed ? {
            needed: output.booster.needed,
            currentA: output.booster.currentA,
            inputVoltage: output.booster.inputVoltage,
            outputVoltage: output.booster.outputVoltage,
            needsConversion: output.booster.needsConversion,
            alternatorType: 'standard', // No longer asked, default
        } : null,

        charger: output.charger.needed ? {
            needed: output.charger.needed,
            targetCurrentA: output.charger.targetCurrentA,
            recommendedCurrentA: output.charger.recommendedCurrentA,
            chargingTimeHours: output.charger.chargingTimeHours,
        } : null,

        solarController: output.controller.needed ? {
            needed: output.controller.needed,
            totalWp: output.solar.totalAvailableWp,
            roofWp: output.solar.maxRoofWp,
            portableWp: output.solar.portableWp,
            currentA: output.controller.currentA,
            recommendedCurrentA: output.controller.currentA, // Same in new algo
            type: output.controller.type.toUpperCase() as 'MPPT' | 'PWM',
            needsSeparatePortableController: false, // Simplified
        } : null,

        solarModules: output.solar.needed ? {
            needed: output.solar.needed,
            dailyWh: output.solar.dailySolarYieldWh,
            sunHoursPerDay: 4, // Estimate, not exposed in new output
            requiredWp: output.solar.requiredWp,
            maxRoofWp: output.solar.maxRoofWp,
            portableWp: output.solar.portableWp,
            totalAvailableWp: output.solar.totalAvailableWp,
            recommendation: output.solar.recommendation,
        } : null,

        cables: output.cables.map(cable => ({
            route: cable.route,
            displayName: cable.displayName,
            lengthM: cable.lengthM,
            currentA: cable.currentA,
            voltage: cable.voltage,
            minCrossSection: cable.minCrossSection,
            recommendedCrossSection: cable.recommendedCrossSection,
            isCritical: cable.isCritical,
        })),

        calculatedAt: new Date().toISOString(),
        solarControllerClasses: [10, 20, 30, 40, 50, 60, 80, 100],
    };
}

// =============================================================================
// WIZARD INPUT ADAPTER
// =============================================================================

/**
 * Legacy WizardInput interface (from old requirements-engine.ts)
 */
export interface WizardInput {
    vehicleType: string | null;
    vehicleVoltage: 12 | 24;
    systemVoltage: 12 | 24 | 48;
    energySources: ('solar' | 'alternator' | 'shore_power')[];
    consumers: {
        id: string;
        category: string;
        name: string;
        power: number;
        voltage: 12 | 24 | 48 | 230;
        usageHoursPerDay: number;
        usage: string;
        isFixed?: boolean;
        coolingMethod?: 'compressor' | 'absorber';
        usesGas?: boolean;
        electricPercentage?: number;
    }[];
    autarchyGoal: string;
    autarchyDays: number;
    solarSetupType: string;
    roofModuleType: 'rigid' | 'flexible';
    roofAreas: { id: string; name: string; length: number; width: number }[];
    solarBags: { id: string; power: number }[];
    cableLengths: {
        starterToService: number;
        serviceToInverter: number;
        solarToRegulator: number;
        boiler?: number;
        waterPump?: number;
        batteryToFuseBox?: number;
        custom: Record<string, number>;
    };
    batteryPreference: 'lifepo4' | 'agm' | 'gel' | 'any';
    travelBehavior: {
        season: 'summer_only' | 'all_year' | 'winter_focused';
        tripDuration: 'weekend' | 'week' | 'extended' | 'permanent';
        winterLocation: 'germany_alps' | 'southern_europe' | 'scandinavia' | 'varies';
        standingDuration: 'short' | 'medium' | 'long';
    };
    simultaneousLoad: 'low' | 'moderate' | 'high';
    shoreChargingSpeed?: 'slow' | 'normal' | 'fast';
    brandPreferenceCharger?: string | null;
    brandPreferenceBattery?: string | null;
    brandPreferenceSolar?: string | null;
}

/**
 * Converts legacy WizardInput to new AlgorithmInput format
 */
export function convertWizardInputToAlgorithmInput(wizard: WizardInput): AlgorithmInput {
    // Map season
    const seasonMap: Record<string, 'summer' | 'all_year' | 'winter'> = {
        'summer_only': 'summer',
        'all_year': 'all_year',
        'winter_focused': 'winter',
    };

    // Map winter location
    const locationMap: Record<string, 'scandinavia' | 'germany' | 'southern' | 'eastern' | 'varies'> = {
        'germany_alps': 'germany',
        'southern_europe': 'southern',
        'scandinavia': 'scandinavia',
        'varies': 'varies',
    };

    // Map battery preference
    const batteryMap: Record<string, 'lifepo4' | 'agm' | 'gel'> = {
        'lifepo4': 'lifepo4',
        'agm': 'agm',
        'gel': 'gel',
        'any': 'lifepo4', // Default to lifepo4 if unsure
    };

    // Map autarchy days to valid values
    const autarchyDaysMap = (days: number): 2 | 6 | 10 | 14 | 20 | 999 => {
        if (days <= 2) return 2;
        if (days <= 6) return 6;
        if (days <= 10) return 10;
        if (days <= 14) return 14;
        if (days <= 20) return 20;
        return 999;
    };

    // Map consumers
    // Note: The new algorithm uses ConsumerVoltage = 12 | 230
    // DC devices (12V, 24V, 48V) all map to 12 (DC), only 230V is AC
    const consumers: AlgoConsumer[] = wizard.consumers.map(c => ({
        id: c.id,
        name: c.name,
        power: c.power,
        daily: c.usageHoursPerDay,
        voltage: c.voltage === 230 ? 230 : 12, // All DC voltages map to 12, only 230V is AC
        coolingMethod: c.coolingMethod,
        electricShare: c.electricPercentage ? c.electricPercentage / 100 : undefined,
    }));

    return {
        systemVoltage: wizard.systemVoltage as 12 | 24 | 48,
        vehicleVoltage: wizard.vehicleVoltage,
        batteryPreference: batteryMap[wizard.batteryPreference] || 'lifepo4',
        energySources: wizard.energySources,
        roofModuleType: wizard.roofModuleType,
        roofAreas: wizard.roofAreas,
        solarBags: wizard.solarBags,
        chargerSpeed: (wizard.shoreChargingSpeed || 'normal') as 'slow' | 'normal' | 'fast',
        consumers,
        simultaneousLoad: wizard.simultaneousLoad,
        travelBehavior: {
            season: seasonMap[wizard.travelBehavior.season] || 'all_year',
            tripDuration: wizard.travelBehavior.tripDuration,
            winterLocation: locationMap[wizard.travelBehavior.winterLocation] || 'germany',
            standingDuration: wizard.travelBehavior.standingDuration,
        },
        autarchyDays: autarchyDaysMap(wizard.autarchyDays),
        cableLengths: {
            starterToService: wizard.cableLengths.starterToService,
            boosterToService: 1, // Default
            solarToRegulator: wizard.cableLengths.solarToRegulator,
            regulatorToService: 1, // Default
            chargerToService: 1, // Default
            serviceToInverter: wizard.cableLengths.serviceToInverter,
            batteryToFuseBox: wizard.cableLengths.batteryToFuseBox || 1,
        },
        brandPreferences: {
            charger: wizard.brandPreferenceCharger || null,
            battery: wizard.brandPreferenceBattery || null,
            solar: wizard.brandPreferenceSolar || null,
        },
        customOverrides: {
            battery: null,
            solar: null,
            booster: null,
            controller: null,
            inverter: null,
            charger: null,
        },
    };
}

// =============================================================================
// MAIN FUNCTION (drop-in replacement for old calculateSystemRequirements)
// =============================================================================

/**
 * Calculate system requirements using new algorithm with legacy interface
 * 
 * This is a drop-in replacement for the old calculateSystemRequirements function.
 */
export async function calculateSystemRequirements(input: WizardInput): Promise<SystemRequirements> {
    // Convert wizard input to new algorithm format
    const algorithmInput = convertWizardInputToAlgorithmInput(input);

    // Run new algorithm
    const algorithmOutput = calculateRequirements(algorithmInput);

    // Convert output to legacy format for UI
    return convertToSystemRequirements(algorithmOutput, algorithmInput);
}

// =============================================================================
// PRODUCT FILTER (migrated from old requirements-engine.ts)
// =============================================================================

export interface ProductWithFilter {
    id: string;
    name: string;
    categoryId: string;
    category: { slug: string; name: string };
    specs: string;
    price: number | null;
    // Filter fields
    powerW?: number | null;
    capacityAh?: number | null;
    voltageV?: number | null;
    currentA?: number | null;
    crossSectionMm2?: number | null;
    solarWp?: number | null;
    batteryType?: string | null;
    waveform?: string | null;
    supportedVoltages?: number[] | null;
}

export function preFilterProducts(
    products: ProductWithFilter[],
    requirements: SystemRequirements
): ProductWithFilter[] {
    return products.filter(p => {
        const slug = p.category.slug;

        // Batteries: match voltage and type
        if (slug === 'batterien') {
            if (p.voltageV && p.voltageV !== requirements.systemVoltage) return false;
            if (p.batteryType && requirements.batteryType !== 'any' &&
                p.batteryType.toLowerCase() !== requirements.batteryType.toLowerCase()) return false;
        }

        // Inverters: check waveform and voltage
        if (slug === 'wechselrichter') {
            if (p.waveform && p.waveform !== 'pure_sine') return false;
            if (p.supportedVoltages && !p.supportedVoltages.includes(requirements.systemVoltage)) return false;
        }

        // Chargers/Boosters: check supported voltages
        if (['batterieladegeraete', 'ladebooster'].includes(slug)) {
            if (p.supportedVoltages && !p.supportedVoltages.includes(requirements.systemVoltage)) return false;
        }

        // Solar Controllers: check voltage
        if (slug === 'solar-laderegler') {
            if (p.supportedVoltages && !p.supportedVoltages.includes(requirements.systemVoltage)) return false;
        }

        return true;
    });
}

export function getFilterStats(products: ProductWithFilter[], filtered: ProductWithFilter[]) {
    return {
        total: products.length,
        filtered: filtered.length,
        removed: products.length - filtered.length,
    };
}
