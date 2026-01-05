/**
 * Camper Electric System Algorithm
 * 
 * Entry point and exports
 */

// Export all types
export * from './types';

// Export all constants
export * from './constants';

// Export algorithm functions
export {
    // Main function
    calculateRequirements,

    // Lookup functions
    getDoD,
    getPSH,
    getWpPerM2,
    getChargerTimeHours,
    getSimultaneousFactor,
    getStandingDays,

    // Helper functions
    roundUpTo50,
    roundUpTo100,
    roundUpToStandard,
    roundToNearest,

    // Core calculations
    calculateDailyConsumption,
    calculateSolar,
    calculateBooster,
    calculateBattery,
    calculateCharger,
    calculateInverter,
    calculateController,
    calculateCables,
    calculateCableCrossSection,
    applyOverrides,
} from './algorithm';

// Default export
export { default } from './algorithm';

// Export adapter for legacy compatibility
export {
    // Main drop-in replacement
    calculateSystemRequirements,

    // Conversion functions
    convertToSystemRequirements,
    convertWizardInputToAlgorithmInput,

    // Product filtering
    preFilterProducts,
    getFilterStats,

    // Legacy types
    type SystemRequirements,
    type WizardInput,
    type BatteryRequirement,
    type InverterRequirement,
    type BoosterRequirement,
    type ChargerRequirement,
    type SolarControllerRequirement,
    type SolarModulesRequirement,
    type CableRequirement,
    type ProductWithFilter,
} from './adapter';
