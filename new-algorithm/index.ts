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

// Export validation functions
export {
    validateInput,
    validateInputOrThrow,
    validateEnergySources,
    validatePermanentConstraint,
    validateAutarchyDays,
    validateConsumers,
    validateCableLengths,
    validateRoofAreas,
    generateWarnings,
} from './validation';

export type { ValidationResult } from './validation';

// Export test utilities
export {
    TEST_SCENARIOS,
    runScenario,
    runAllScenarios,
    printTestResults,
    runTests,
} from './tests';

export type { TestScenario, TestResult, ExpectedChecks } from './tests';

// Default export
export { default } from './algorithm';
