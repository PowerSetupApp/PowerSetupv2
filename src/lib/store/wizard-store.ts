import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types based on PRD ---

export type VehicleType = 'campervan' | 'motorhome' | 'caravan' | 'boat' | 'offroad';
export type Voltage = 12 | 24 | 48;
export type EnergySource = 'solar' | 'alternator' | 'shore_power';
export type AutarchyLevel = 'weekend' | 'holiday' | 'full';
export type ComfortLevel = 'budget' | 'standard' | 'premium';
export type SchematicType = 'simplified' | 'technical';
export type BatteryType = 'agm' | 'lifepo4' | 'gel' | 'any';

// Additional Questions for AI Accuracy
export type SimultaneousLoad = 'low' | 'moderate' | 'high';
// export type AlternatorSize = 'standard' | 'enhanced' | 'euro6d_smart' | 'unknown'; // REMOVED
export type ShoreChargingSpeed = 'slow' | 'normal' | 'fast';
export type BatterySpaceSize = 'compact' | 'medium' | 'spacious';

// Travel Behavior Types
export type TravelSeason = 'summer_only' | 'all_year' | 'winter_focused';
export type TripDuration = 'weekend' | 'week' | 'extended' | 'permanent';
export type WinterLocation = 'germany_alps' | 'southern_europe' | 'scandinavia' | 'varies';
export type StandingDuration = 'short' | 'medium' | 'long';

export interface TravelBehavior {
    season: TravelSeason;
    tripDuration: TripDuration;
    winterLocation: WinterLocation;
    standingDuration: StandingDuration;
}

// Consumer details for energy calculation
export interface Consumer {
    id: string;
    category: string;
    name: string;
    power: number; // Watts
    voltage: 12 | 24 | 48 | 230; // Operating voltage
    usageHoursPerDay: number; // Average hours per day
    usage: 'low' | 'medium' | 'high' | 'constant'; // Preset for predefined devices
    isFixed?: boolean; // If true, requires cable planning in Step 7
    coolingMethod?: 'compressor' | 'absorber'; // Only for cooling devices
    usesGas?: boolean; // Only for absorber cooling: runs partially on gas
    electricPercentage?: number; // Only for absorber with gas: percentage of time on electric (0-100)
}

export interface SolarDimensions {
    length: number;
    width: number;
}

export type RoofAreaName = 'main' | 'front' | 'rear' | 'left' | 'right';

export interface RoofArea {
    id: string;
    name: RoofAreaName;
    length: number;
    width: number;
}

export type SolarSetupType = 'roof' | 'portable' | 'mixed';
export type RoofModuleType = 'rigid' | 'flexible';
export type SolarModulePreference = 'standard' | 'slim' | 'flexible' | 'custom' | null;

export interface SolarBag {
    id: string;
    power: number; // Watts
}

export interface CableLengths {
    starterToService: number; // For B2B Charger (Starter -> Booster)
    boosterToService?: number; // Booster -> Service Battery
    serviceToInverter: number; // For Inverter (critical)
    solarToRegulator: number; // From roof to regulator
    serviceToRegulator?: number; // Regulator -> Service Battery
    chargerToService?: number;   // Shore Power Charger -> Service Battery

    // New Standard Consumers

    // New Standard Consumers
    boiler?: number;
    waterPump?: number;
    batteryToFuseBox?: number;

    // Dynamic Custom Consumers (mapped by Consumer ID)
    custom: Record<string, number>;
}

export interface WizardState {
    // Step 1: Vehicle
    vehicleType: VehicleType | null;
    vehicleVoltage: Voltage; // New: Vehicle Board Voltage

    // Step 2: System Voltage
    systemVoltage: Voltage;

    // Step 3: Energy Sources
    energySources: EnergySource[];

    // Step 4: Consumers
    consumers: Consumer[];

    // Step 5: Autarchy
    autarchyGoal: AutarchyLevel;
    autarchyDays: number;

    // Step 6: Solar
    solarSetupType: SolarSetupType;
    solarDimensions: SolarDimensions | null; // Legacy, kept for compatibility
    roofAreas: RoofArea[]; // New: Multiple roof areas
    roofModuleType: RoofModuleType;
    solarModulePreference: SolarModulePreference;
    solarBags: SolarBag[];

    // Step 7: Cabling
    cableLengths: CableLengths;

    // Step 8: Comfort
    comfortLevel: ComfortLevel;

    // Step 9: Schematic
    schematicPreference: SchematicType;

    // Optional
    batteryPreference: BatteryType;

    // Step 5: Travel Behavior
    travelBehavior: TravelBehavior;

    // Additional AI-Relevant Data
    simultaneousLoad: SimultaneousLoad;
    // alternatorSize: AlternatorSize; // REMOVED
    batterySpaceSize: BatterySpaceSize;
    shoreChargingSpeed: ShoreChargingSpeed;

    // Actions
    setTravelBehavior: (behavior: Partial<TravelBehavior>) => void;
    setVehicleType: (type: VehicleType) => void;
    setVehicleVoltage: (voltage: Voltage) => void;
    setSystemVoltage: (voltage: Voltage) => void;
    toggleEnergySource: (source: EnergySource) => void;
    setEnergySources: (sources: EnergySource[]) => void;
    addConsumer: (consumer: Consumer) => void;
    removeConsumer: (consumerId: string) => void;
    toggleConsumer: (consumer: Consumer) => void;
    updateConsumer: (consumerId: string, updates: Partial<Consumer>) => void;
    setAutarchyGoal: (goal: AutarchyLevel, days?: number) => void;

    setSolarSetupType: (type: SolarSetupType) => void;
    setSolarDimensions: (dim: SolarDimensions) => void;
    setRoofModuleType: (type: RoofModuleType) => void;
    setSolarModulePreference: (pref: SolarModulePreference) => void;

    // Roof Areas
    addRoofArea: () => void;
    updateRoofArea: (id: string, updates: Partial<Omit<RoofArea, 'id'>>) => void;
    removeRoofArea: (id: string) => void;

    addSolarBag: (bag: SolarBag) => void;
    removeSolarBag: (id: string) => void;
    clearSolarBags: () => void;

    setCableLengths: (lengths: Partial<CableLengths>) => void;
    setCustomCableLength: (consumerId: string, length: number) => void;

    setComfortLevel: (level: ComfortLevel) => void;
    setSchematicPreference: (type: SchematicType) => void;
    setBatteryPreference: (type: BatteryType) => void;
    setSimultaneousLoad: (load: SimultaneousLoad) => void;
    // setAlternatorSize: (size: AlternatorSize) => void; // REMOVED
    setBatterySpaceSize: (size: BatterySpaceSize) => void;
    setShoreChargingSpeed: (speed: ShoreChargingSpeed) => void;

    // Custom Overrides (Step 10)
    customBatteryCapacity: number | null;
    customSolarPower: number | null;
    customBoosterCurrent: number | null;
    customSolarControllerCurrent: number | null;
    customChargerCurrent: number | null; // NEW
    customInverterPower: number | null; // NEW

    // Brand Preferences
    brandPreferenceCharger: string | null;
    brandPreferenceBattery: string | null;
    brandPreferenceSolar: string | null;

    setCustomBatteryCapacity: (capacity: number | null) => void;
    setCustomSolarPower: (power: number | null) => void;
    setCustomBoosterCurrent: (current: number | null) => void;
    setCustomSolarControllerCurrent: (current: number | null) => void;
    setCustomChargerCurrent: (current: number | null) => void; // NEW
    setCustomInverterPower: (power: number | null) => void; // NEW

    setBrandPreferenceCharger: (brand: string | null) => void;
    setBrandPreferenceBattery: (brand: string | null) => void;
    setBrandPreferenceSolar: (brand: string | null) => void;

    // Navigation Helper
    currentStep: number;
    setStep: (step: number) => void;

    // Sync
    syncConsumers: (validDevices: { id: string; name: string; isCooling?: boolean; defaultHoursPerDay?: number; defaultPower?: number }[]) => void;

    // Reset
    reset: () => void;
}

export const useWizardStore = create<WizardState>()(
    persist(
        (set) => ({
            // Defaults
            vehicleType: null,
            vehicleVoltage: 12, // Default to 12V
            systemVoltage: 12,
            energySources: [],
            consumers: [],
            autarchyGoal: 'weekend',
            autarchyDays: 3,

            // Solar Defaults
            solarSetupType: 'roof',
            solarDimensions: { length: 200, width: 100 }, // Legacy
            roofAreas: [{ id: 'main', name: 'main', length: 200, width: 100 }],
            roofModuleType: 'rigid',
            solarModulePreference: null,
            solarBags: [],

            cableLengths: {
                starterToService: 3,
                boosterToService: 1,
                serviceToInverter: 0.5,
                solarToRegulator: 5,
                serviceToRegulator: 1.5, // NEW: Regulator -> Service Battery
                chargerToService: 1.5,
                boiler: 3,
                waterPump: 3,
                batteryToFuseBox: 1,
                custom: {}
            },

            comfortLevel: 'standard',
            schematicPreference: 'simplified',
            batteryPreference: 'lifepo4',

            // Travel Behavior Defaults
            travelBehavior: {
                season: 'all_year',
                tripDuration: 'week',
                winterLocation: 'varies',
                standingDuration: 'medium',
            },

            // Additional AI-Relevant Defaults
            simultaneousLoad: 'moderate',
            // alternatorSize: 'unknown', // REMOVED
            batterySpaceSize: 'medium',
            shoreChargingSpeed: 'normal',

            // Custom Overrides Defaults
            customBatteryCapacity: null,
            customSolarPower: null,
            customBoosterCurrent: null,
            customSolarControllerCurrent: null,
            customChargerCurrent: null, // NEW
            customInverterPower: null, // NEW

            // Brand Preference Defaults
            brandPreferenceCharger: null,
            brandPreferenceBattery: null,
            brandPreferenceSolar: null,

            currentStep: 1,

            // Actions
            reset: () => set({
                vehicleType: null,
                vehicleVoltage: 12,
                systemVoltage: 12,
                energySources: [],
                consumers: [],
                autarchyGoal: 'weekend',
                autarchyDays: 3,
                solarSetupType: 'roof',
                solarDimensions: { length: 200, width: 100 },
                roofAreas: [{ id: 'default', name: 'main', length: 200, width: 100 }],
                roofModuleType: 'rigid',
                solarModulePreference: null,
                solarBags: [],
                cableLengths: {
                    starterToService: 3,
                    boosterToService: 1,
                    serviceToInverter: 0.5,
                    solarToRegulator: 5,
                    serviceToRegulator: 1.5, // NEW
                    chargerToService: 1.5,
                    boiler: 3,
                    waterPump: 3,
                    batteryToFuseBox: 1,
                    custom: {}
                },
                comfortLevel: 'standard',
                schematicPreference: 'simplified',
                batteryPreference: 'lifepo4',
                travelBehavior: {
                    season: 'all_year',
                    tripDuration: 'week',
                    winterLocation: 'varies',
                    standingDuration: 'medium',
                },
                simultaneousLoad: 'moderate',
                // alternatorSize: 'unknown', // REMOVED
                batterySpaceSize: 'medium',
                shoreChargingSpeed: 'normal',
                customBatteryCapacity: null,
                customSolarPower: null,
                customBoosterCurrent: null,
                customSolarControllerCurrent: null,
                customChargerCurrent: null, // NEW
                customInverterPower: null, // NEW
                brandPreferenceCharger: null,
                brandPreferenceBattery: null,
                brandPreferenceSolar: null,
                currentStep: 1,
            }),

            setVehicleType: (type) => set({ vehicleType: type }),
            setVehicleVoltage: (voltage) => set({ vehicleVoltage: voltage }),
            setSystemVoltage: (voltage) => set({ systemVoltage: voltage }),
            setEnergySources: (sources) => set({ energySources: sources }),
            toggleEnergySource: (source) =>
                set((state) => {
                    const exists = state.energySources.includes(source);
                    return {
                        energySources: exists
                            ? state.energySources.filter((s) => s !== source)
                            : [...state.energySources, source],
                    };
                }),

            addConsumer: (consumer) =>
                set((state) => ({ consumers: [...state.consumers, consumer] })),
            removeConsumer: (id) =>
                set((state) => ({ consumers: state.consumers.filter((c) => c.id !== id) })),
            toggleConsumer: (consumer) =>
                set((state) => {
                    const exists = state.consumers.some((c) => c.id === consumer.id);
                    return {
                        consumers: exists
                            ? state.consumers.filter((c) => c.id !== consumer.id)
                            : [...state.consumers, consumer],
                    };
                }),
            updateConsumer: (id, updates) =>
                set((state) => ({
                    consumers: state.consumers.map((c) =>
                        c.id === id ? { ...c, ...updates } : c
                    ),
                })),

            setAutarchyGoal: (goal, days) =>
                set({
                    autarchyGoal: goal,
                    autarchyDays: days || (goal === 'weekend' ? 2 : goal === 'holiday' ? 7 : 14),
                }),

            setSolarSetupType: (type) => set({ solarSetupType: type }),
            setSolarDimensions: (dim) => set({
                solarDimensions: dim,
                // Sync roofAreas mit solarDimensions für Debug-Ansicht und Berechnung
                roofAreas: [{ id: 'main', name: 'main', length: dim.length, width: dim.width }]
            }),
            setRoofModuleType: (type) => set({ roofModuleType: type }),
            setSolarModulePreference: (pref) => set({ solarModulePreference: pref }),

            // Roof Areas
            addRoofArea: () => set((state) => ({
                roofAreas: [...state.roofAreas, {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'main' as RoofAreaName,
                    length: 150,
                    width: 80
                }]
            })),
            updateRoofArea: (id, updates) => set((state) => {
                const newRoofAreas = state.roofAreas.map((area) =>
                    area.id === id ? { ...area, ...updates } : area
                );

                // Also sync solarDimensions with the first/main roof area for backward compatibility
                const mainArea = newRoofAreas.find(a => a.id === id) || newRoofAreas[0];
                const newSolarDimensions = mainArea
                    ? { length: mainArea.length, width: mainArea.width }
                    : state.solarDimensions;

                return {
                    roofAreas: newRoofAreas,
                    solarDimensions: newSolarDimensions
                };
            }),
            removeRoofArea: (id) => set((state) => ({
                roofAreas: state.roofAreas.filter((area) => area.id !== id)
            })),

            addSolarBag: (bag) => set((state) => ({ solarBags: [...state.solarBags, bag] })),
            removeSolarBag: (id) => set((state) => ({ solarBags: state.solarBags.filter(b => b.id !== id) })),
            clearSolarBags: () => set({ solarBags: [] }),

            setCableLengths: (lengths) => set((state) => ({ cableLengths: { ...state.cableLengths, ...lengths } })),
            setCustomCableLength: (id, length) => set((state) => ({
                cableLengths: {
                    ...state.cableLengths,
                    custom: {
                        ...state.cableLengths.custom,
                        [id]: length
                    }
                }
            })),

            setComfortLevel: (level) => set({ comfortLevel: level }),
            setSchematicPreference: (type) => set({ schematicPreference: type }),
            setBatteryPreference: (type) => set({ batteryPreference: type }),
            setSimultaneousLoad: (load) => set({ simultaneousLoad: load }),
            // setAlternatorSize: (size) => set({ alternatorSize: size }),
            setBatterySpaceSize: (size) => set({ batterySpaceSize: size }),
            setShoreChargingSpeed: (speed) => set({ shoreChargingSpeed: speed }),

            setCustomBatteryCapacity: (capacity) => set({ customBatteryCapacity: capacity }),
            setCustomSolarPower: (power) => set({ customSolarPower: power }),
            setCustomBoosterCurrent: (current) => set({ customBoosterCurrent: current }),
            setCustomSolarControllerCurrent: (current) => set({ customSolarControllerCurrent: current }),
            setCustomChargerCurrent: (current) => set({ customChargerCurrent: current }),
            setCustomInverterPower: (power) => set({ customInverterPower: power }), // NEW

            setBrandPreferenceCharger: (brand) => set({ brandPreferenceCharger: brand }),
            setBrandPreferenceBattery: (brand) => set({ brandPreferenceBattery: brand }),
            setBrandPreferenceSolar: (brand) => set({ brandPreferenceSolar: brand }),

            setTravelBehavior: (behavior) => set((state) => ({
                travelBehavior: { ...state.travelBehavior, ...behavior }
            })),

            setStep: (step) => set({ currentStep: step }),

            syncConsumers: (validDevices) => set((state) => {
                const validIds = new Set(validDevices.map(d => d.id));
                const validNames = new Map(validDevices.map(d => [d.id, d.name]));
                const coolingDevices = new Set(validDevices.filter(d => d.isCooling).map(d => d.id));

                const newConsumers = state.consumers.filter(c => {
                    // 1. Identify if it is a "Native" device (not custom, not preset-copy, not duplicate)
                    const isCustom = c.category === 'custom' || c.id.startsWith('custom_') || c.id.startsWith('preset_');
                    const isCopy = c.id.includes('_copy_');

                    if (isCustom || isCopy) return true; // Keep custom/copies

                    // 2. If Native, check if it still exists
                    return validIds.has(c.id);
                }).map(c => {
                    // 3. Update Name if it exists (for Native devices)
                    let updated = { ...c };

                    if (validNames.has(c.id)) {
                        updated.name = validNames.get(c.id)!;
                    }

                    // 4. Sync coolingMethod for cooling devices that don't have it set
                    if (coolingDevices.has(c.id) && !c.coolingMethod) {
                        updated.coolingMethod = 'compressor';
                    }

                    // NOTE: We intentionally do NOT sync usageHoursPerDay here
                    // to preserve user modifications. The DB values are only used
                    // when a consumer is first added via handleToggle().

                    return updated;
                });

                return { consumers: newConsumers };
            }),
        }),
        {
            name: 'wizard-storage',
            version: 2,
            migrate: (persistedState: any, version: number) => {
                // Migration v0 → v2: Remove legacy consumers
                if (version === 0 || version === undefined) {
                    const legacyNames = [
                        "Kühlbox (Kompressor)",
                        "Kühlschrank (Absorber)",
                        "tv"
                    ];

                    if (persistedState && Array.isArray(persistedState.consumers)) {
                        persistedState.consumers = persistedState.consumers.filter((c: any) =>
                            !legacyNames.includes(c.name)
                        );
                    }
                }

                // Migration v1 → v2: Sync roofAreas with solarDimensions
                // This fixes the issue where roofAreas was stuck at default 200x100
                // while solarDimensions had the user's actual values
                if (version <= 1) {
                    if (persistedState) {
                        const solarDim = persistedState.solarDimensions;
                        const roofAreas = persistedState.roofAreas;

                        // If solarDimensions exists and is different from default
                        if (solarDim && (solarDim.length !== 200 || solarDim.width !== 100)) {
                            // Update roofAreas to match solarDimensions
                            persistedState.roofAreas = [{
                                id: 'main',
                                name: 'main',
                                length: solarDim.length,
                                width: solarDim.width
                            }];
                        }
                        // Also fix if roofAreas has old 'default' id
                        else if (roofAreas && roofAreas.length > 0 && roofAreas[0].id === 'default') {
                            persistedState.roofAreas = roofAreas.map((area: any) => ({
                                ...area,
                                id: area.id === 'default' ? 'main' : area.id
                            }));
                        }
                    }
                }

                return persistedState;
            },
        }
    )
);
