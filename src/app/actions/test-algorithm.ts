"use server";

import { calculateSystemRequirements, type WizardInput, type SystemRequirements } from "@/lib/requirements-engine";

/**
 * Server action to test the algorithm calculations without saving to the database.
 * Returns the calculated requirements for display/debugging.
 */
export async function testAlgorithmCalculations(
    formData: any
): Promise<{ success: boolean; data?: SystemRequirements; error?: string }> {
    try {
        // Convert formData to WizardInput format
        const wizardInput: WizardInput = {
            vehicleType: formData.vehicleType || null,
            vehicleVoltage: typeof formData.vehicleVoltage === 'number'
                ? formData.vehicleVoltage
                : 12,
            systemVoltage: typeof formData.systemVoltage === 'number'
                ? formData.systemVoltage
                : 12,
            batteryPreference: formData.batteryPreference || 'lifepo4',
            energySources: formData.energySources || [],
            alternatorSize: formData.alternatorSize || 'unknown',
            consumers: (formData.consumers || []).map((c: any) => ({
                id: c.id,
                category: c.category || 'custom',
                name: c.name || 'Unbekannt',
                power: c.power || 0,
                voltage: typeof c.voltage === 'number' ? c.voltage : 12,
                usageHoursPerDay: c.usageHoursPerDay || 0,
                isFixed: c.isFixed,
                coolingMethod: c.coolingMethod,
            })),
            simultaneousLoad: formData.simultaneousLoad || 'moderate',
            travelBehavior: formData.travelBehavior || {
                season: 'all_year',
                winterLocation: 'varies',
            },
            autarchyDays: formData.autarchyDays || 3,
            batterySpaceSize: formData.batterySpaceSize || 'medium',
            solarSetupType: formData.solarSetupType || 'roof',
            roofAreas: formData.roofAreas || [],
            roofModuleType: formData.roofModuleType || 'rigid',
            solarBags: formData.solarBags || [],
            cableLengths: formData.cableLengths || {
                starterToService: 3,
                serviceToInverter: 1,
                solarToRegulator: 5,
                custom: {},
            },
            comfortLevel: formData.comfortLevel || 'standard',
        };

        // Calculate requirements
        const requirements = await calculateSystemRequirements(wizardInput);

        return {
            success: true,
            data: requirements,
        };
    } catch (error) {
        console.error("Algorithm test failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
