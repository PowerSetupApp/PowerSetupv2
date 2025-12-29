import { z } from 'zod';

// --- Result FormData Schema ---
// More permissive to handle edge cases and localStorage migration

// Valid enum values
const VALID_ENERGY_SOURCES = ['solar', 'alternator', 'shore_power', 'generator'] as const;
const VALID_VOLTAGES = ['12V', '24V', '48V', '230V'] as const;

// Enums
const VehicleTypeSchema = z.enum(['campervan', 'motorhome', 'caravan', 'boat', 'offroad']);
const VoltageSchema = z.enum(['12V', '24V', '48V']);
const AutarchyLevelSchema = z.enum(['weekend', 'holiday', 'full']);
const ComfortLevelSchema = z.enum(['budget', 'standard', 'premium']);
const SchematicTypeSchema = z.enum(['simplified', 'technical']);
const BatteryTypeSchema = z.enum(['agm', 'lifepo4', 'gel', 'lead_acid', 'any']);

// Travel Behavior
const TravelSeasonSchema = z.enum(['summer_only', 'all_year', 'winter_focused']);
const TripDurationSchema = z.enum(['weekend', 'week', 'extended', 'permanent']);
const WinterLocationSchema = z.enum(['germany_alps', 'southern_europe', 'scandinavia', 'varies']);
const StandingDurationSchema = z.enum(['short', 'medium', 'long']);

const TravelBehaviorSchema = z.object({
    season: TravelSeasonSchema,
    tripDuration: TripDurationSchema,
    winterLocation: WinterLocationSchema,
    standingDuration: StandingDurationSchema,
});

// Consumer - permissive with defaults
const ConsumerSchema = z.object({
    id: z.string(),
    category: z.string().default('custom'),
    name: z.string().default('Unbekannt'),
    power: z.number().default(50),
    voltage: z.enum(VALID_VOLTAGES).default('12V'),
    usageHoursPerDay: z.number().default(2),
    usage: z.enum(['low', 'medium', 'high', 'constant']).default('medium'),
    isFixed: z.boolean().optional().default(false),
    coolingMethod: z.enum(['compressor', 'absorber']).optional(),
});

// Solar
const SolarDimensionsSchema = z.object({
    length: z.number(),
    width: z.number(),
});

const SolarSetupTypeSchema = z.enum(['roof', 'portable', 'mixed']);
const RoofModuleTypeSchema = z.enum(['rigid', 'flexible']);
const SolarModulePreferenceSchema = z.enum(['standard', 'slim', 'flexible', 'custom']).nullable();

const SolarBagSchema = z.object({
    id: z.string(),
    power: z.number(),
});

// Cable Lengths
const CableLengthsSchema = z.object({
    starterToService: z.number().default(3),
    serviceToInverter: z.number().default(1),
    solarToRegulator: z.number().default(5),
    boiler: z.number().optional(),
    waterPump: z.number().optional(),
    batteryToFuseBox: z.number().optional(),
    custom: z.record(z.string(), z.number()).default({}),
});

// Main FormData Schema with preprocessing for old data
export const FormDataSchema = z.object({
    // Step 1: Vehicle
    vehicleType: VehicleTypeSchema.nullable(),

    // Step 2: System Voltage
    systemVoltage: VoltageSchema.default('12V'),

    // Step 3: Energy Sources - filter invalid values
    energySources: z.preprocess(
        (val) => {
            if (!Array.isArray(val)) return [];
            // Filter to only valid enum values
            return val.filter((v): v is typeof VALID_ENERGY_SOURCES[number] =>
                VALID_ENERGY_SOURCES.includes(v as typeof VALID_ENERGY_SOURCES[number])
            );
        },
        z.array(z.enum(VALID_ENERGY_SOURCES)).default([])
    ),

    // Step 4: Consumers - fix undefined values
    consumers: z.preprocess(
        (val) => {
            if (!Array.isArray(val)) return [];
            return val.map((c: unknown) => {
                if (typeof c !== 'object' || c === null) return null;
                const consumer = c as Record<string, unknown>;

                // Ensure voltage is valid
                let voltage = consumer.voltage as string;
                if (!VALID_VOLTAGES.includes(voltage as typeof VALID_VOLTAGES[number])) {
                    voltage = '12V';
                }

                return {
                    id: consumer.id || `consumer_${Date.now()}`,
                    category: consumer.category || 'custom',
                    name: consumer.name || 'Unbekannt',
                    power: typeof consumer.power === 'number' ? consumer.power : 50,
                    voltage,
                    usageHoursPerDay: typeof consumer.usageHoursPerDay === 'number' ? consumer.usageHoursPerDay : 2,
                    usage: consumer.usage || 'medium',
                    isFixed: consumer.isFixed || false,
                    coolingMethod: consumer.coolingMethod,
                };
            }).filter(Boolean);
        },
        z.array(ConsumerSchema).default([])
    ),

    // Step 5: Autarchy
    autarchyGoal: AutarchyLevelSchema.default('weekend'),
    autarchyDays: z.number().default(3),

    // Step 6: Solar
    solarSetupType: SolarSetupTypeSchema.default('roof'),
    solarDimensions: SolarDimensionsSchema.nullable().default(null),
    roofModuleType: RoofModuleTypeSchema.default('rigid'),
    solarModulePreference: SolarModulePreferenceSchema.default(null),
    solarBags: z.array(SolarBagSchema).default([]),

    // Step 7: Cabling
    cableLengths: CableLengthsSchema.default({
        starterToService: 3,
        serviceToInverter: 1,
        solarToRegulator: 5,
        custom: {},
    }),

    // Step 8: Comfort
    comfortLevel: ComfortLevelSchema.default('standard'),

    // Step 9: Schematic
    schematicPreference: SchematicTypeSchema.default('simplified'),

    // Optional
    batteryPreference: BatteryTypeSchema.default('any'),

    // Travel Behavior
    travelBehavior: TravelBehaviorSchema.default({
        season: 'all_year',
        tripDuration: 'week',
        winterLocation: 'varies',
        standingDuration: 'medium',
    }),
});

// Request Schemas
export const CreateResultRequestSchema = z.object({
    formData: FormDataSchema,
});

export const UpdateResultRequestSchema = z.object({
    formData: FormDataSchema.partial().optional(),
    calculations: z.record(z.string(), z.unknown()).optional(),
    recommendations: z.record(z.string(), z.unknown()).optional(),
    schematicData: z.record(z.string(), z.unknown()).optional(),
});

// Types
export type FormData = z.infer<typeof FormDataSchema>;
export type CreateResultRequest = z.infer<typeof CreateResultRequestSchema>;
export type UpdateResultRequest = z.infer<typeof UpdateResultRequestSchema>;
