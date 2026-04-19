
import { calculateSolar, calculateBattery } from './src/lib/algorithm/algorithm';
import { AlgorithmInput } from './src/lib/algorithm/types';
import { PSH_MATRIX } from './src/lib/algorithm/constants';

// Mock Input
const input: AlgorithmInput = {
    systemVoltage: 12,
    vehicleVoltage: 12,
    batteryPreference: 'lifepo4',
    energySources: ['solar', 'alternator', 'shore_power'],
    consumers: [], // Not needed for isolated calc, passing dailyWh manually
    travelBehavior: {
        season: 'all_year', // Winter usage
        tripDuration: 'weekend', // Short trip
        winterLocation: 'germany',
        standingDuration: 'medium'
    },
    autarchyDays: 2 as any, // 3 is not in type, but algo handles numbers
    roofModuleType: 'rigid',
    solarBags: [],
    // Roof Area 4.1m2
    roofAreas: [{ id: 'main', name: 'main', length: 410, width: 100 }],
    customOverrides: { solar: null, battery: null, inverter: null, booster: null, charger: null, controller: null },
    brandPreferences: { charger: null, battery: null, solar: null },
    settings: {}, // defaults
    cableLengths: { starterToService: 0, serviceToInverter: 0, solarToRegulator: 0, regulatorToService: 0, chargerToService: 0, batteryToFuseBox: 0, boosterToService: 0 },
    comfortLevel: 'standard',
    chargerSpeed: 'normal'
} as any;

const dailyWh = 553;
const psh = 0.8 * 1.1; // Winter Germany * AllYear Multiplier = 0.88

// 1. Calculate Solar
console.log('--- Solar Calculation ---');
console.log('PSH:', psh);

const solar = calculateSolar(input, dailyWh, psh);
console.log('Solar Yield (Daily):', solar.dailySolarYieldWh);
console.log('Required Wp:', solar.requiredWp);
console.log('Max Roof Wp:', solar.maxRoofWp);
console.log('Portable Wp Rec:', solar.portableWp);
console.log('Total Available Wp:', solar.totalAvailableWp);
console.log('Shortfall Wh:', solar.solarShortfallWh);
console.log('Recommendation:', solar.recommendation);

// 2. Calculate Battery
console.log('\n--- Battery Calculation ---');
// Alternator?
const alternatorWh = 0; // Assume 0 for worst case or typical static test

const battery = calculateBattery(
    input,
    dailyWh,
    solar.dailySolarYieldWh,
    alternatorWh,
    solar.solarShortfallWh
);

console.log('Min Capacity Ah:', battery.minCapacityAh);
console.log('Rec Capacity Ah:', battery.recommendedCapacityAh);
console.log('Autarchy Days:', battery.autarchyDays);

