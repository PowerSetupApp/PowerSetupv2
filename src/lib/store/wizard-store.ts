import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types based on PRD ---

export type VehicleType = 'campervan' | 'motorhome' | 'caravan' | 'boat' | 'offroad';
export type Voltage = '12V' | '24V';
export type EnergySource = 'battery' | 'solar' | 'alternator' | 'shore_power' | 'generator';

// Placeholder for now, will be detailed in later tasks
export interface Consumer {
    id: string;
    category: string;
    name: string;
    power: number; // Watts
    usage: 'low' | 'medium' | 'high' | 'constant'; // Preset
    usageHours?: number; // Custom hours
}

export type AutarchyLevel = 'weekend' | 'holiday' | 'full';
export type ComfortLevel = 'budget' | 'standard' | 'premium';
export type SchematicType = 'simplified' | 'technical';
export type BatteryType = 'agm' | 'lifepo4' | 'any';

export interface WizardState {
    // Step 1: Vehicle
    vehicleType: VehicleType | null;

    // Step 2: System Voltage
    systemVoltage: Voltage;

    // Step 3: Energy Sources
    energySources: EnergySource[];

    // Step 4: Consumers
    consumers: Consumer[];

    // Step 5: Usage handled inside consumers for now (or separate map)

    // Step 6: Autarchy
    autarchyGoal: AutarchyLevel;
    autarchyDays: number; // 1-30

    // Step 7: Comfort
    comfortLevel: ComfortLevel;

    // Step 8: Schematic
    schematicPreference: SchematicType;

    // Optional
    batteryPreference: BatteryType;

    // Actions
    setVehicleType: (type: VehicleType) => void;
    setSystemVoltage: (voltage: Voltage) => void;
    toggleEnergySource: (source: EnergySource) => void;
    setAutarchyGoal: (goal: AutarchyLevel, days?: number) => void;
    setComfortLevel: (level: ComfortLevel) => void;
    setSchematicPreference: (type: SchematicType) => void;
    setBatteryPreference: (type: BatteryType) => void;

    // Navigation Helper
    currentStep: number;
    setStep: (step: number) => void;
}

export const useWizardStore = create<WizardState>()(
    persist(
        (set) => ({
            // Defaults
            vehicleType: null,
            systemVoltage: '12V',
            energySources: [],
            consumers: [],
            autarchyGoal: 'weekend',
            autarchyDays: 3,
            comfortLevel: 'standard',
            schematicPreference: 'simplified',
            batteryPreference: 'any',
            currentStep: 1,

            // Actions
            setVehicleType: (type) => set({ vehicleType: type }),
            setSystemVoltage: (voltage) => set({ systemVoltage: voltage }),
            toggleEnergySource: (source) =>
                set((state) => {
                    const exists = state.energySources.includes(source);
                    return {
                        energySources: exists
                            ? state.energySources.filter((s) => s !== source)
                            : [...state.energySources, source],
                    };
                }),
            setAutarchyGoal: (goal, days) =>
                set({
                    autarchyGoal: goal,
                    autarchyDays: days || (goal === 'weekend' ? 3 : goal === 'holiday' ? 7 : 14),
                }),
            setComfortLevel: (level) => set({ comfortLevel: level }),
            setSchematicPreference: (type) => set({ schematicPreference: type }),
            setBatteryPreference: (type) => set({ batteryPreference: type }),

            setStep: (step) => set({ currentStep: step }),
        }),
        {
            name: 'wizard-storage', // unique name
            // partialize: (state) => ... if we want to exclude some fields
        }
    )
);
