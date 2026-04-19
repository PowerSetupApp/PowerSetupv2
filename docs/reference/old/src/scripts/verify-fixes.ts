
import { formatFormDataForAI, formatSystemRequirementsForAI } from '../lib/format-for-ai';
import { WizardInput } from '../lib/algorithm/adapter';

function verifyRoofArea() {
    console.log("--- Verifying Roof Area ---");
    const mockData: any = {
        vehicleType: 'campervan',
        vehicleVoltage: 12,
        systemVoltage: 12,
        energySources: ['solar'],
        consumers: [],
        autarchyGoal: 'medium',
        autarchyDays: 3,
        solarSetupType: 'roof',
        roofModuleType: 'rigid',
        // New roofAreas format
        roofAreas: [
            { id: '1', name: 'Main Roof', length: 420, width: 100 }
        ],
        // Legacy fallback
        solarDimensions: { length: 200, width: 100 },
        solarBags: [],
        cableLengths: { custom: {} },
        travelBehavior: {},
        batteryPreference: 'lifepo4'
    };

    const output = formatFormDataForAI(mockData);

    if (output.includes('Verfügbare Dachfläche (Main Roof): 420cm × 100cm')) {
        console.log("✅ Roof Area correctly formatted (New Format used)");
    } else {
        console.log("❌ Roof Area formatting FAILED");
        console.log("Output snippet:\n", output.split('\n').filter(l => l.includes('Dachfläche')).join('\n'));
    }

    if (output.includes('maximale Modulabmessungen')) {
        console.log("✅ Dimension warning present");
    }
}

function verifyBatteryRecommendation() {
    console.log("\n--- Verifying Battery Recommendation ---");
    const mockRequirements: any = {
        dailyWh: 1000,
        battery: {
            minCapacityAh: 100,
            recommendedCapacityAh: 200,
            maxCapacityAh: 400,
            type: 'lifepo4',
            voltage: 12
        }
    };

    const output = formatSystemRequirementsForAI(mockRequirements);

    if (output.includes('Empfohlene Kapazität (Optimal): 200 Ah')) {
        console.log("✅ Recommended Capacity displayed");
    } else {
        console.log("❌ Recommended Capacity MISSING");
        console.log("ACTUAL OUTPUT:\n", output);
    }

    if (output.includes('ZIEL: Wähle eine LIFEPO4-Batterie mit 200Ah!')) {
        console.log("✅ AI Instruction for Recommended Capacity present");
    } else {
        console.log("❌ AI Instruction FAILED");
    }
}

verifyRoofArea();
verifyBatteryRecommendation();
