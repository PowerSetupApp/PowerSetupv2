/**
 * Requirements Engine
 * 
 * Calculates precise component requirements based on wizard inputs.
 * The AI will use these pre-calculated values for product matching only.
 */

import { getAlgorithmSettings, type AlgorithmSettingsData } from "@/app/actions/algorithm-settings";

// ==========================================
// Types
// ==========================================

export interface Consumer {
    id: string;
    category: string;
    name: string;
    power: number;
    voltage: 12 | 24 | 48 | 230;
    usageHoursPerDay: number;
    isFixed?: boolean;
    coolingMethod?: 'compressor' | 'absorber';
    usesGas?: boolean; // Only for absorber cooling: runs partially on gas
    electricPercentage?: number; // Only for absorber with gas: percentage of time on electric (0-100)
}

export interface RoofArea {
    id: string;
    name: string;
    length: number; // cm
    width: number;  // cm
}

export interface SolarBag {
    id: string;
    power: number; // Wp
}

export interface TravelBehavior {
    season: 'summer_only' | 'all_year' | 'winter_focused';
    winterLocation: 'germany_alps' | 'southern_europe' | 'scandinavia' | 'varies';
    standingDuration: 'short' | 'medium' | 'long';
}

export interface CableLengths {
    starterToService: number;
    boosterToService?: number;
    serviceToInverter: number;
    solarToRegulator: number;
    serviceToRegulator?: number;
    chargerToService?: number;
    batteryToFuseBox?: number;
    custom: Record<string, number>;
}

export interface WizardInput {
    vehicleType: string | null;
    vehicleVoltage: 12 | 24;
    systemVoltage: 12 | 24 | 48;
    batteryPreference: 'lifepo4' | 'agm' | 'gel' | 'any';
    energySources: ('solar' | 'alternator' | 'shore_power')[];
    alternatorSize: 'standard' | 'enhanced' | 'euro6d_smart' | 'unknown';
    consumers: Consumer[];
    simultaneousLoad: 'low' | 'moderate' | 'high';
    travelBehavior: TravelBehavior;
    autarchyDays: number;
    batterySpaceSize: 'compact' | 'medium' | 'spacious';
    solarSetupType: 'roof' | 'portable' | 'mixed';
    roofAreas: RoofArea[];
    roofModuleType: 'rigid' | 'flexible';
    solarBags: SolarBag[];
    cableLengths: CableLengths;
    comfortLevel: 'budget' | 'standard' | 'premium';
    shoreChargingSpeed: 'slow' | 'normal' | 'fast';
}

// ==========================================
// Output Interfaces
// ==========================================

export interface BatteryRequirement {
    dailyWh: number;
    dailySolarYieldWh: number; // NEW: Solar generation per day
    netDailyDeficitWh: number; // NEW: Consumption minus solar
    minCapacityAh: number; // Worst case: no solar at all
    recommendedCapacityAh: number; // NEW: With solar offset
    maxCapacityAh: number;
    type: string;
    voltage: number;
    autarchyDays: number;
    hasSolar: boolean; // NEW: Whether solar is configured
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
    // Input summary
    systemVoltage: number;
    vehicleVoltage: number;
    batteryType: string;
    comfortLevel: string;

    // Calculated requirements
    dailyWh: number;
    battery: BatteryRequirement;
    inverter: InverterRequirement | null;
    booster: BoosterRequirement | null;
    charger: ChargerRequirement | null;
    solarController: SolarControllerRequirement | null;
    solarModules: SolarModulesRequirement | null;
    cables: CableRequirement[];

    // Metadata
    calculatedAt: string;
    debug?: {
        solarFactor: number;
    };
}

// ==========================================
// Helper Functions
// ==========================================

const FALLBACK_CABLE_SIZES = [6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
const FALLBACK_INVERTER_CLASSES = [500, 800, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000];
const FALLBACK_CHARGER_CLASSES = [10, 20, 30, 50, 60];
const FALLBACK_SOLAR_CONTROLLER_CLASSES = [10, 20, 30, 40, 50, 60, 80, 100];

function parseClasses(str: string): number[] {
    if (!str) return [];
    return str.split(',')
        .map(s => Number(s.trim()))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);
}

function roundToClass(value: number, classes: number[], fallback: number[]): number {
    const list = classes.length > 0 ? classes : fallback;
    return list.find(c => c >= value) || list[list.length - 1];
}

function roundDownToClass(value: number, classes: number[], fallback: number[]): number {
    const list = classes.length > 0 ? classes : fallback;
    // Find the largest class that is <= value
    const validClasses = list.filter(c => c <= value);
    return validClasses.length > 0 ? validClasses[validClasses.length - 1] : list[0];
}

// ==========================================
// Calculation Functions
// ==========================================

function calculateDailyWh(consumers: Consumer[], settings: AlgorithmSettingsData): number {
    return consumers.reduce((sum, c) => {
        // Cooling devices have duty cycle
        if (c.coolingMethod) {
            const dutyCycle = c.coolingMethod === 'compressor'
                ? settings.dutyCycleCompressor
                : settings.dutyCycleAbsorber;

            // For absorber with gas: only count the electric portion
            const electricFactor = (c.coolingMethod === 'absorber' && c.usesGas && c.electricPercentage !== undefined)
                ? c.electricPercentage / 100
                : 1.0;

            return sum + (c.power * 24 * dutyCycle * electricFactor);
        }
        return sum + (c.power * c.usageHoursPerDay);
    }, 0);
}

function calculateBattery(
    input: WizardInput,
    dailyWh: number,
    settings: AlgorithmSettingsData
): BatteryRequirement {
    // Get DoD based on battery type
    let dod: number;
    switch (input.batteryPreference) {
        case 'lifepo4': dod = settings.dodLifepo4; break;
        case 'agm': dod = settings.dodAgm; break;
        case 'gel': dod = settings.dodGel; break;
        default: dod = settings.dodLifepo4; // Default to LiFePO4 for 'any'
    }

    // Get max capacity based on space
    let maxAh: number;
    switch (input.batterySpaceSize) {
        case 'compact': maxAh = settings.batteryCompact; break;
        case 'medium': maxAh = settings.batteryMedium; break;
        case 'spacious': maxAh = settings.batterySpacious; break;
        default: maxAh = settings.batteryMedium;
    }

    // Calculate solar yield if solar is configured
    const hasSolar = input.energySources.includes('solar');
    let dailySolarYieldWh = 0;

    if (hasSolar) {
        // Get sun hours based on season
        let baseSunHours: number;
        switch (input.travelBehavior.season) {
            case 'summer_only': baseSunHours = settings.sunHoursSummer; break;
            case 'all_year': baseSunHours = settings.sunHoursAllYear; break;
            case 'winter_focused': baseSunHours = settings.sunHoursWinter; break;
            default: baseSunHours = settings.sunHoursAllYear;
        }

        // Apply location modifier
        let locationModifier: number;
        switch (input.travelBehavior.winterLocation) {
            case 'germany_alps': locationModifier = settings.locationGermanyAlps; break;
            case 'southern_europe': locationModifier = settings.locationSouthernEurope; break;
            case 'scandinavia': locationModifier = settings.locationScandinavia; break;
            case 'varies': locationModifier = settings.locationVaries; break;
            default: locationModifier = 1.0;
        }

        const sunHoursPerDay = baseSunHours * locationModifier;

        // Calculate total Wp from roof and bags
        const wpPerM2 = input.roofModuleType === 'rigid'
            ? settings.wpPerM2Rigid
            : settings.wpPerM2Flexible;

        const roofWp = input.solarSetupType !== 'portable'
            ? input.roofAreas.reduce((sum, area) => {
                const m2 = (area.length * area.width) / 10000;
                return sum + (m2 * wpPerM2);
            }, 0)
            : 0;

        const portableWp = input.solarSetupType !== 'roof'
            ? input.solarBags.reduce((sum, bag) => sum + bag.power, 0)
            : 0;
        const totalWp = roofWp + portableWp;

        // Solar efficiency factor (MPPT ~85%, system losses)
        const solarEfficiency = 0.85;
        dailySolarYieldWh = totalWp * sunHoursPerDay * solarEfficiency;
    }

    // Net daily deficit (consumption minus solar generation)
    const netDailyDeficitWh = Math.max(0, dailyWh - dailySolarYieldWh);

    // NEW: Determine effective autarchy days based on Standing Duration Cap
    let standingDaysLimit: number;
    switch (input.travelBehavior.standingDuration) {
        case 'short': standingDaysLimit = settings.standingDaysShort; break;
        case 'medium': standingDaysLimit = settings.standingDaysMedium; break;
        case 'long': standingDaysLimit = settings.standingDaysLong; break;
        default: standingDaysLimit = settings.standingDaysMedium;
    }

    // Effective Autarchy Days: User wish vs. Standing Reality
    // If user wants 18 days but only stands 3 days, we calc for 3 days.
    const effectiveAutarchyDays = Math.min(input.autarchyDays, standingDaysLimit);

    // Worse Case Solar Yield (Cloudy Day)
    // We assume a fraction of the seasonal average yield
    const worstCaseSolarYield = dailySolarYieldWh * settings.cloudyYieldFactor;
    const netDailyDeficitWorstCase = Math.max(0, dailyWh - worstCaseSolarYield);

    // Calculate minimum required capacity (worst case: only cloudy solar)
    // Capped by maxBackupDays to avoid "18 days of darkness" scenarios
    // Logic: min(effectiveDays, settings.maxBackupDays)
    const backupDays = Math.min(effectiveAutarchyDays, settings.maxBackupDays);
    const minCapacityAh = (netDailyDeficitWorstCase * backupDays) / (input.systemVoltage * dod);

    // Calculate recommended capacity (with solar offset)
    const effectiveSolarYieldRecommendation = dailySolarYieldWh * settings.recommendedSolarYieldFactor;
    const netDailyDeficitRecommendation = Math.max(0, dailyWh - effectiveSolarYieldRecommendation);

    // Base calculation from deficit
    let calculatedRecAh = hasSolar && netDailyDeficitRecommendation > 0
        ? (netDailyDeficitRecommendation * backupDays) / (input.systemVoltage * dod)
        : 0;

    // Safety Floor: Even with solar, we want at least 1 day of buffer (or minCapacity if that's smaller)
    const oneDayBufferAh = (dailyWh * 1) / (input.systemVoltage * dod);
    let recommendedCapacityAh = Math.max(calculatedRecAh, oneDayBufferAh);

    // Ceiling: Should not exceed Worst Case (minCapacityAh)
    // Logic: If Worst Case is 200Ah, we shouldn't recommend 300Ah just because of some factor math.
    // However, ensure the floor doesn't violate the ceiling (if OneDay > WorstCase, take OneDay? No, WorstCase usually includes OneDay logic implied).
    // Actually, WorstCase is (DeficitWorstCase * BackupDays).
    // If BackupDays is high, WorstCase is high.

    if (recommendedCapacityAh > minCapacityAh) {
        recommendedCapacityAh = minCapacityAh;
    }

    // Apply battery safety factor (general buffer for peak loads, inverter, etc.)
    const safetyFactor = settings.batterySafetyFactor || 1.0;
    const finalMinCapacityAh = minCapacityAh * safetyFactor;
    const finalRecommendedCapacityAh = recommendedCapacityAh * safetyFactor;

    return {
        dailyWh,
        dailySolarYieldWh: Math.ceil(dailySolarYieldWh),
        netDailyDeficitWh: Math.ceil(netDailyDeficitWh),
        minCapacityAh: Math.ceil(finalMinCapacityAh),
        recommendedCapacityAh: Math.ceil(finalRecommendedCapacityAh),
        maxCapacityAh: maxAh,
        type: input.batteryPreference === 'any' ? 'lifepo4' : input.batteryPreference,
        voltage: input.systemVoltage,
        autarchyDays: input.autarchyDays,
        hasSolar,
    };
}

function calculateInverter(
    input: WizardInput,
    settings: AlgorithmSettingsData,
    inverterClasses: number[]
): InverterRequirement | null {
    const consumers230V = input.consumers.filter(c => c.voltage === 230);

    if (consumers230V.length === 0) {
        return null;
    }

    // Get simultaneity factor
    let simFactor: number;
    switch (input.simultaneousLoad) {
        case 'low': simFactor = settings.simultaneousLow; break;
        case 'moderate': simFactor = settings.simultaneousModerate; break;
        case 'high': simFactor = settings.simultaneousHigh; break;
        default: simFactor = settings.simultaneousModerate;
    }

    const maxSingleLoadW = Math.max(...consumers230V.map(c => c.power));
    const total230VLoadW = consumers230V.reduce((sum, c) => sum + c.power, 0);
    // OLD LOGIC: Math.max(maxSingleLoadW, total230VLoadW * simFactor)
    // PROBLEM: If simFactor is low (e.g. 0.5), result often falls back to maxSingleLoadW, so user sees no change.
    // NEW LOGIC: Interpolate between MaxSingle (0.0) and Total (1.0).
    // Formula: MaxSingle + (Total - MaxSingle) * simFactor

    // Safety check: if total < max (shouldn't happen), stick to max
    const remainingLoadW = Math.max(0, total230VLoadW - maxSingleLoadW);
    const requiredW = maxSingleLoadW + (remainingLoadW * simFactor);

    // Use exact calculated requirement, rounded to nearest 10W for cleaner display
    // User requested "actual need" without fixed classes
    const recommendedW = Math.ceil(requiredW / 10) * 10;

    return {
        needed: true,
        requiredW: Math.ceil(requiredW),
        recommendedW,
        maxSingleLoadW,
        total230VLoadW,
        simultaneousFactor: simFactor,
    };
}

function calculateBooster(
    input: WizardInput,
    settings: AlgorithmSettingsData
): BoosterRequirement | null {
    if (!input.energySources.includes('alternator')) {
        return null;
    }

    // Get B2B charger current based on alternator type
    let currentA: number;
    switch (input.alternatorSize) {
        case 'standard': currentA = settings.alternatorStandard; break;
        case 'enhanced': currentA = settings.alternatorEnhanced; break;
        case 'euro6d_smart': currentA = settings.alternatorEuro6dSmart; break;
        case 'unknown': currentA = settings.alternatorUnknown; break;
        default: currentA = settings.alternatorUnknown;
    }

    const needsConversion = input.vehicleVoltage !== input.systemVoltage;

    return {
        needed: true,
        currentA,
        inputVoltage: input.vehicleVoltage,
        outputVoltage: input.systemVoltage,
        needsConversion,
        alternatorType: input.alternatorSize,
    };
}

function calculateCharger(
    input: WizardInput,
    battery: BatteryRequirement,
    chargerClasses: number[],
    settings: AlgorithmSettingsData
): ChargerRequirement | null {
    if (!input.energySources.includes('shore_power')) {
        return null;
    }

    // Target time based on user preference
    let targetTimeHours: number;
    switch (input.shoreChargingSpeed) {
        case 'slow': targetTimeHours = settings.chargerTimeHoursSlow; break;
        case 'fast': targetTimeHours = settings.chargerTimeHoursFast; break;
        default: targetTimeHours = settings.chargerTimeHoursNormal;
    }

    const targetCurrentA = battery.recommendedCapacityAh / targetTimeHours;
    // Round DOWN to get a smaller charger = longer charging time (closer to user's preference)
    const recommendedCurrentA = roundDownToClass(targetCurrentA, chargerClasses, FALLBACK_CHARGER_CLASSES);

    // Recalculate actual charging time with selected charger
    const actualChargingTime = Math.ceil((battery.recommendedCapacityAh / recommendedCurrentA) * 10) / 10;

    return {
        needed: true,
        targetCurrentA: Math.ceil(targetCurrentA),
        recommendedCurrentA,
        chargingTimeHours: actualChargingTime,
    };
}

function calculateSolarController(
    input: WizardInput,
    settings: AlgorithmSettingsData,
    solarModules: SolarModulesRequirement | null,
    controllerClasses: number[]
): SolarControllerRequirement | null {
    if (!input.energySources.includes('solar') || !solarModules) {
        return null;
    }

    // Determine the "Planned" Wp (sizing target)
    // Instead of maxing out the roof, we target the required amount + buffer
    const bufferFactor = 1.2; // 20% oversized for good yield
    const targetWp = solarModules.requiredWp * bufferFactor;

    // Portable is explicit, so we count it fully if present
    const portableWp = solarModules.portableWp;

    // Calculate how much roof solar we plan to install
    // We cover the remaining need with roof solar, limited by available roof space
    // If portable covers everything, we might still want some roof solar? 
    // For now, let's just ensure we meet the target.
    const remainingNeedWp = Math.max(0, targetWp - portableWp);

    // We plan for the lesser of: What we need vs. What fits on the roof
    const plannedRoofWp = Math.min(solarModules.maxRoofWp, remainingNeedWp);

    // However, if the user explicitly defined roof areas, but the calculated need is tiny,
    // we should probably enforce a sane minimum system size if roof space allows.
    // E.g. at least 200W if space fits 200W.
    const saneMinimumRoofWp = Math.min(solarModules.maxRoofWp, 200);
    const finalPlannedRoofWp = Math.max(plannedRoofWp, saneMinimumRoofWp);

    // Total logic sizing Wp
    const sizingTotalWp = portableWp + finalPlannedRoofWp;

    // --- RE-CALCULATE ACTUAL FITTED VALUES ---
    // The previous logic just summed everything. Now we use the sizingTotalWp for controller sizing.
    // Note: We intentionally DO NOT use totalAvailableWp anymore for the controller current calculation.

    // Current calculation: Wp / Voltage * 1.25 safety factor
    const currentA = (sizingTotalWp / input.systemVoltage) * 1.25;
    const recommendedCurrentA = roundToClass(currentA, controllerClasses, FALLBACK_SOLAR_CONTROLLER_CLASSES);

    // MPPT for larger systems, PWM for smaller
    const type: 'MPPT' | 'PWM' = sizingTotalWp > 200 ? 'MPPT' : 'PWM';

    // Separate controller for portable if mixed setup
    const needsSeparatePortableController =
        input.solarSetupType === 'mixed' && portableWp > 0 && finalPlannedRoofWp > 0;

    return {
        needed: true,
        totalWp: Math.ceil(sizingTotalWp),
        roofWp: Math.ceil(finalPlannedRoofWp), // Update this to reflect planned, not max
        portableWp: Math.ceil(portableWp),
        currentA: Math.ceil(currentA),
        recommendedCurrentA,
        type,
        needsSeparatePortableController,
    };
}

function calculateSolarModules(
    input: WizardInput,
    dailyWh: number,
    settings: AlgorithmSettingsData
): SolarModulesRequirement | null {
    if (!input.energySources.includes('solar')) {
        return null;
    }

    // Get sun hours based on season
    let baseSunHours: number;
    switch (input.travelBehavior.season) {
        case 'summer_only': baseSunHours = settings.sunHoursSummer; break;
        case 'all_year': baseSunHours = settings.sunHoursAllYear; break;
        case 'winter_focused': baseSunHours = settings.sunHoursWinter; break;
        default: baseSunHours = settings.sunHoursAllYear;
    }

    // Apply location modifier for winter location
    let locationModifier: number;
    switch (input.travelBehavior.winterLocation) {
        case 'germany_alps': locationModifier = settings.locationGermanyAlps; break;
        case 'southern_europe': locationModifier = settings.locationSouthernEurope; break;
        case 'scandinavia': locationModifier = settings.locationScandinavia; break;
        case 'varies': locationModifier = settings.locationVaries; break;
        default: locationModifier = 1.0;
    }

    const sunHoursPerDay = baseSunHours * locationModifier;
    const requiredWp = dailyWh / sunHoursPerDay;

    // Calculate available roof Wp
    const wpPerM2 = input.roofModuleType === 'rigid'
        ? settings.wpPerM2Rigid
        : settings.wpPerM2Flexible;

    const maxRoofWp = input.solarSetupType !== 'portable'
        ? input.roofAreas.reduce((sum, area) => {
            const m2 = (area.length * area.width) / 10000;
            return sum + (m2 * wpPerM2);
        }, 0)
        : 0;

    const portableWp = input.solarSetupType !== 'roof'
        ? input.solarBags.reduce((sum, bag) => sum + bag.power, 0)
        : 0;
    const totalAvailableWp = maxRoofWp + portableWp;

    // Generate recommendation
    let recommendation: string;
    if (totalAvailableWp >= requiredWp) {
        recommendation = `Dachfläche und Solartaschen sind ausreichend für ${Math.ceil(requiredWp)}Wp.`;
    } else if (maxRoofWp >= requiredWp) {
        recommendation = `Dachfläche ist ausreichend. Empfohlen: ${Math.ceil(requiredWp)}Wp.`;
    } else {
        recommendation = `Benötigt ${Math.ceil(requiredWp)}Wp. Verfügbar: max. ${Math.ceil(totalAvailableWp)}Wp. Ggf. Solartaschen ergänzen.`;
    }

    return {
        needed: true,
        dailyWh,
        sunHoursPerDay: Math.round(sunHoursPerDay * 10) / 10,
        requiredWp: Math.ceil(requiredWp),
        maxRoofWp: Math.ceil(maxRoofWp),
        portableWp: Math.ceil(portableWp),
        totalAvailableWp: Math.ceil(totalAvailableWp),
        recommendation,
    };
}

function calculateCableRequirement(
    route: string,
    displayName: string,
    lengthM: number,
    currentA: number,
    voltage: number,
    isCritical: boolean,
    settings: AlgorithmSettingsData,
    cableSizes: number[],
    isSolar: boolean = false // NEW: Solar cables use panel voltage, not system voltage
): CableRequirement {
    // For solar cables, use panel Vmp voltage (~18V) instead of system voltage
    // This gives a more accurate calculation since solar cables operate at panel voltage
    const effectiveVoltage = isSolar ? 18 : voltage;

    // Voltage drop: critical = 2%, normal = 3%, solar uses voltageDropSolar
    let maxVoltageDrop: number;
    if (isSolar) {
        maxVoltageDrop = settings.voltageDropSolar / 100;
    } else if (isCritical) {
        maxVoltageDrop = settings.voltageDropCritical / 100;
    } else {
        maxVoltageDrop = settings.voltageDropNormal / 100;
    }

    const allowedDrop = effectiveVoltage * maxVoltageDrop;

    // Cross-section formula: A = (2 * ρ * L * I) / U_drop
    // ρ = copper resistivity (0.0178 Ω·mm²/m)
    const minCrossSection = (2 * settings.copperResistivity * lengthM * currentA) / allowedDrop;

    // For critical routes, apply a 1.5x safety margin before rounding
    const safetyFactor = isCritical ? 1.5 : 1.0;
    const adjustedMinCrossSection = minCrossSection * safetyFactor;

    const recommendedCrossSection = roundToClass(adjustedMinCrossSection, cableSizes, FALLBACK_CABLE_SIZES);

    return {
        route,
        displayName,
        lengthM,
        currentA: Math.ceil(currentA),
        voltage: effectiveVoltage,
        minCrossSection: Math.round(minCrossSection * 10) / 10,
        recommendedCrossSection,
        isCritical,
    };
}

function calculateCables(
    input: WizardInput,
    battery: BatteryRequirement,
    inverter: InverterRequirement | null,
    booster: BoosterRequirement | null,
    charger: ChargerRequirement | null,
    solarController: SolarControllerRequirement | null,
    settings: AlgorithmSettingsData,
    cableSizes: number[]
): CableRequirement[] {
    const cables: CableRequirement[] = [];
    const voltage = input.systemVoltage;

    // 1. Starter → Booster (if alternator)
    if (booster && input.cableLengths.starterToService > 0) {
        cables.push(calculateCableRequirement(
            'starter_to_booster',
            'Starterbatterie → Ladebooster',
            input.cableLengths.starterToService,
            booster.currentA,
            input.vehicleVoltage,
            true,
            settings,
            cableSizes
        ));
    }

    // 2. Booster → Service Battery
    if (booster && input.cableLengths.boosterToService) {
        cables.push(calculateCableRequirement(
            'booster_to_service',
            'Ladebooster → Versorgerbatterie',
            input.cableLengths.boosterToService,
            booster.currentA,
            voltage,
            true,
            settings,
            cableSizes
        ));
    }

    // 3. Service → Inverter (if 230V consumers)
    if (inverter && input.cableLengths.serviceToInverter > 0) {
        const inverterCurrentA = inverter.recommendedW / voltage;
        cables.push(calculateCableRequirement(
            'service_to_inverter',
            'Versorgerbatterie → Wechselrichter',
            input.cableLengths.serviceToInverter,
            inverterCurrentA,
            voltage,
            true,
            settings,
            cableSizes
        ));
    }

    // 4. Shore Power Charger → Service Battery
    if (charger && input.cableLengths.chargerToService) {
        cables.push(calculateCableRequirement(
            'charger_to_service',
            'Batterieladegerät → Versorgerbatterie',
            input.cableLengths.chargerToService,
            charger.recommendedCurrentA,
            voltage,
            true,
            settings,
            cableSizes
        ));
    }

    // 5. Solar Modules → Regulator (ALWAYS 6mm²)
    if (solarController && input.cableLengths.solarToRegulator > 0) {
        cables.push({
            route: 'solar_to_regulator',
            displayName: 'Solarmodule → Laderegler',
            lengthM: input.cableLengths.solarToRegulator,
            currentA: Math.ceil(solarController.currentA),
            voltage: 18, // Panel Vmp
            minCrossSection: 6,
            recommendedCrossSection: 6, // FIXED: Always 6mm² for solar cables
            isCritical: false,
        });
    }

    // 6. Regulator → Service Battery (ALWAYS 6mm²)
    if (solarController) {
        cables.push({
            route: 'regulator_to_service',
            displayName: 'Laderegler → Versorgerbatterie',
            lengthM: input.cableLengths.serviceToRegulator || 1.5, // Fallback if undefined
            currentA: Math.ceil(solarController.currentA),
            voltage,
            minCrossSection: 6,
            recommendedCrossSection: 6, // FIXED: Always 6mm² for solar cables
            isCritical: false,
        });
    }

    // 7. Battery → Fuse Box
    if (input.cableLengths.batteryToFuseBox) {
        // Estimate based on total consumers (not 230V)
        const dcConsumers = input.consumers.filter(c => c.voltage !== 230);
        const totalDCPower = dcConsumers.reduce((sum, c) => sum + c.power, 0);
        const fuseBoxCurrentA = totalDCPower / voltage;

        cables.push(calculateCableRequirement(
            'battery_to_fusebox',
            'Versorgerbatterie → Sicherungskasten',
            input.cableLengths.batteryToFuseBox,
            fuseBoxCurrentA,
            voltage,
            false,
            settings,
            cableSizes
        ));
    }

    return cables;
}

// ==========================================
// Main Export Function
// ==========================================

export async function calculateSystemRequirements(input: WizardInput): Promise<SystemRequirements> {
    // Fetch settings from database
    const settings = await getAlgorithmSettings();

    // Parse classes from settings
    const inverterClasses = parseClasses(settings.inverterClasses);
    const chargerClasses = parseClasses(settings.chargerClasses);
    const solarControllerClasses = parseClasses(settings.solarControllerClasses);
    const cableSizes = parseClasses(settings.cableSizes);

    // 1. Calculate daily Wh consumption
    const dailyWh = calculateDailyWh(input.consumers, settings);

    // 2. Calculate battery requirements
    const battery = calculateBattery(input, dailyWh, settings);

    // 3. Calculate inverter (if 230V consumers)
    const inverter = calculateInverter(input, settings, inverterClasses);

    // 4. Calculate booster (if alternator)
    const booster = calculateBooster(input, settings);

    // 5. Calculate charger (if shore power)
    const charger = calculateCharger(input, battery, chargerClasses, settings);

    // 6. Calculate solar modules (if solar) - MOVED UP BEFORE CONTROLLER
    const solarModules = calculateSolarModules(input, dailyWh, settings);

    // 7. Calculate solar controller (if solar) - NOW DEPENDS ON MODULES
    const solarController = calculateSolarController(input, settings, solarModules, solarControllerClasses);

    // 8. Calculate cables
    const cables = calculateCables(
        input, battery, inverter, booster, charger, solarController, settings, cableSizes
    );

    return {
        systemVoltage: input.systemVoltage,
        vehicleVoltage: input.vehicleVoltage,
        batteryType: battery.type,
        comfortLevel: input.comfortLevel,

        dailyWh: Math.ceil(dailyWh),
        battery,
        inverter,
        booster,
        charger,
        solarController,
        solarModules,
        cables,

        calculatedAt: new Date().toISOString(),
        debug: {
            solarFactor: settings.recommendedSolarYieldFactor
        }
    };
}

// ==========================================
// Product Pre-Filtering
// ==========================================

export interface ProductWithFilter {
    id: string;
    name: string;
    categoryId: string;
    category: { slug: string; name: string };
    // Filter fields
    powerW?: number | null;
    capacityAh?: number | null;
    voltageV?: number | null;
    batteryType?: string | null;
    currentA?: number | null;
    crossSectionMm2?: number | null;
    solarWp?: number | null;
    supportedVoltages?: number[] | null;
    maxDischargeA?: number | null;
    // Other fields passed through
    [key: string]: unknown;
}

/**
 * Pre-filters products based on calculated requirements.
 * This reduces the number of products sent to the AI, saving costs and improving accuracy.
 */
export function preFilterProducts(
    products: ProductWithFilter[],
    requirements: SystemRequirements
): ProductWithFilter[] {
    return products.filter(product => {
        const slug = product.category?.slug || "";

        // Wechselrichter: powerW >= required
        if (slug.startsWith("wechselrichter") && requirements.inverter) {
            if (product.powerW && product.powerW < requirements.inverter.recommendedW) {
                return false;
            }
            if (product.voltageV && product.voltageV !== requirements.systemVoltage) {
                return false;
            }
        }

        // Batterie: capacityAh >= required, voltageV = system, batteryType matches
        if (slug.startsWith("batterie")) {
            if (product.capacityAh && product.capacityAh < requirements.battery.recommendedCapacityAh) {
                return false;
            }
            if (product.voltageV && product.voltageV !== requirements.systemVoltage) {
                return false;
            }
            if (product.batteryType && requirements.batteryType !== "any") {
                // Only filter if user has specific preference
                if (product.batteryType !== requirements.batteryType) {
                    return false;
                }
            }
            // BMS Entladestrom Check
            if (product.maxDischargeA && requirements.inverter) {
                // Approximate max current needed = Inverter Power / Voltage
                // We add 20% safety margin for logic
                const requiredMaxA = (requirements.inverter.recommendedW / requirements.systemVoltage) * 0.8;
                if (product.maxDischargeA < requiredMaxA) {
                    return false;
                }
            }
        }

        // Laderegler: supportedVoltages includes systemVoltage AND currentA >= required
        if ((slug.includes("laderegler") || slug.includes("mppt")) && requirements.solarController) {
            // Check voltage support
            if (product.supportedVoltages && Array.isArray(product.supportedVoltages)) {
                if (!product.supportedVoltages.includes(requirements.systemVoltage)) {
                    return false;
                }
            }

            if (product.currentA && product.currentA < requirements.solarController.recommendedCurrentA) {
                return false;
            }
        }

        // Ladebooster: supportedVoltages includes systemVoltage AND currentA >= required
        if ((slug.includes("ladebooster") || slug.includes("booster")) && requirements.booster) {
            // Check voltage support
            if (product.supportedVoltages && Array.isArray(product.supportedVoltages)) {
                if (!product.supportedVoltages.includes(requirements.systemVoltage)) {
                    return false;
                }
            }

            if (product.currentA && product.currentA < requirements.booster.currentA) {
                return false;
            }
        }

        // Ladegerät: supportedVoltages includes systemVoltage AND currentA >= required
        if ((slug.includes("ladegeraet") || slug.includes("charger")) && requirements.charger) {
            // Check voltage support
            if (product.supportedVoltages && Array.isArray(product.supportedVoltages)) {
                if (!product.supportedVoltages.includes(requirements.systemVoltage)) {
                    return false;
                }
            }

            if (product.currentA && product.currentA < requirements.charger.recommendedCurrentA) {
                return false;
            }
        }

        // Kabel: crossSectionMm2 >= required (check against max cable requirement)
        if ((slug.startsWith("kabel") || slug.includes("cable")) && requirements.cables.length > 0) {
            const maxRequired = Math.max(...requirements.cables.map(c => c.recommendedCrossSection));
            if (product.crossSectionMm2 && product.crossSectionMm2 < maxRequired * 0.5) {
                // Allow some smaller cables for variety, but filter out very small ones
                // e.g. if we need 50mm2, a 16mm2 cable is probably wrong even as alternative
                return false;
            }
        }

        // Solarpanel: No strict filter, but could add solarWp >= portableWp if desired
        // For now, include all solar panels

        return true;
    });
}

/**
 * Returns statistics about pre-filtering results for debugging.
 */
export function getFilterStats(
    originalCount: number,
    filteredCount: number
): { originalCount: number; filteredCount: number; reductionPercent: number } {
    const reductionPercent = originalCount > 0
        ? Math.round((1 - filteredCount / originalCount) * 100)
        : 0;
    return { originalCount, filteredCount, reductionPercent };
}
