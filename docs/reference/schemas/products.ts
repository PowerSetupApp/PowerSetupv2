import { z } from "zod";

// ==========================================
// Gemeinsame Typen
// ==========================================

/** Batterietypen */
export const BatteryType = z.enum(["AGM", "Gel", "LiFePO4"]);
export type BatteryType = z.infer<typeof BatteryType>;

/** Wechselrichter-Wellenform */
export const Waveform = z.enum(["pure_sine", "modified_sine"]);
export type Waveform = z.infer<typeof Waveform>;

/** Solarladeregler-Typ */
export const ChargeControllerType = z.enum(["MPPT", "PWM"]);
export type ChargeControllerType = z.infer<typeof ChargeControllerType>;

/** Solarpanel-Typ */
export const SolarPanelType = z.enum(["mono", "poly", "thin_film"]);
export type SolarPanelType = z.infer<typeof SolarPanelType>;

/** Sicherungstyp */
export const FuseType = z.enum(["flat", "midi", "mega", "nh"]);
export type FuseType = z.infer<typeof FuseType>;

/** Kabeltyp */
export const CableType = z.enum(["single", "twin", "battery"]);
export type CableType = z.infer<typeof CableType>;

/** 3D-Abmessungen in mm */
export const DimensionsSchema = z.object({
    l: z.number().positive(), // Länge in mm
    b: z.number().positive(), // Breite in mm
    h: z.number().positive(), // Höhe in mm
});
export type Dimensions = z.infer<typeof DimensionsSchema>;

// ==========================================
// Basis-Produkt-Spezifikation
// ==========================================

/** Gemeinsame Felder für alle Produkttypen */
export const BaseProductSpec = z.object({
    certifications: z.array(z.string()).optional(), // ["CE", "TÜV"]
    notes: z.string().optional(),
});
export type BaseProductSpec = z.infer<typeof BaseProductSpec>;

// ==========================================
// Batterie
// ==========================================

export const BatterySpec = BaseProductSpec.extend({
    type: BatteryType,
    voltage: z.number().refine((v) => v === 12 || v === 24, {
        message: "Spannung muss 12V oder 24V sein",
    }),
    capacity: z.number().positive(), // Ah
    maxChargeCurrent: z.number().positive(), // A
    maxDischargeCurrent: z.number().positive(), // A
    cycleLife: z.number().positive(), // Zyklen bei 80% DoD
    weight: z.number().positive(), // kg
    dimensions: DimensionsSchema,
    bmsIncluded: z.boolean(), // nur Lithium
});
export type BatterySpec = z.infer<typeof BatterySpec>;

// ==========================================
// Wechselrichter
// ==========================================

export const InverterSpec = BaseProductSpec.extend({
    inputVoltage: z.array(z.number().positive()), // [12] oder [12, 24]
    outputVoltage: z.number().default(230), // 230V
    continuousPower: z.number().positive(), // W Dauerleistung
    peakPower: z.number().positive(), // W Spitzenleistung
    waveform: Waveform,
    efficiency: z.number().min(0).max(100), // % Wirkungsgrad
    noLoadConsumption: z.number().nonnegative(), // W Leerlaufverbrauch
});
export type InverterSpec = z.infer<typeof InverterSpec>;

// ==========================================
// Solarladeregler
// ==========================================

export const ChargeControllerSpec = BaseProductSpec.extend({
    type: ChargeControllerType,
    maxInputVoltage: z.number().positive(), // V max. Eingangsspannung
    maxChargeCurrent: z.number().positive(), // A max. Ladestrom
    maxPvPower: z.number().positive(), // W max. PV-Leistung
    batteryVoltages: z.array(z.number().positive()), // [12, 24]
    batteryTypes: z.array(BatteryType),
});
export type ChargeControllerSpec = z.infer<typeof ChargeControllerSpec>;

// ==========================================
// Ladebooster (B2B)
// ==========================================

export const BoosterSpec = BaseProductSpec.extend({
    inputVoltage: z.number().refine((v) => v === 12 || v === 24, {
        message: "Eingangsspannung muss 12V oder 24V sein",
    }),
    outputVoltage: z.number().refine((v) => v === 12 || v === 24, {
        message: "Ausgangsspannung muss 12V oder 24V sein",
    }),
    maxChargeCurrent: z.number().positive(), // A
    batteryTypes: z.array(BatteryType),
    dPlusActivation: z.boolean(), // D+ Aktivierung
});
export type BoosterSpec = z.infer<typeof BoosterSpec>;

// ==========================================
// Solarmodule
// ==========================================

export const SolarPanelSpec = BaseProductSpec.extend({
    type: SolarPanelType,
    power: z.number().positive(), // Wp Nennleistung
    vmp: z.number().positive(), // V bei max. Leistung
    imp: z.number().positive(), // A bei max. Leistung
    voc: z.number().positive(), // V Leerlaufspannung
    isc: z.number().positive(), // A Kurzschlussstrom
    dimensions: DimensionsSchema,
    flexible: z.boolean(),
});
export type SolarPanelSpec = z.infer<typeof SolarPanelSpec>;

// ==========================================
// Sicherungen
// ==========================================

export const FuseSpec = BaseProductSpec.extend({
    type: FuseType,
    rating: z.number().positive(), // A Nennstrom
    voltage: z.number().positive(), // V Nennspannung
});
export type FuseSpec = z.infer<typeof FuseSpec>;

// ==========================================
// Kabel
// ==========================================

export const CableSpec = BaseProductSpec.extend({
    crossSection: z.number().positive(), // mm² Querschnitt
    length: z.number().positive(), // m Länge
    type: CableType,
    color: z.string().optional(),
});
export type CableSpec = z.infer<typeof CableSpec>;

// ==========================================
// Produkt-Kategorie-Mapping
// ==========================================

export const ProductCategory = z.enum([
    "battery",
    "inverter",
    "charge_controller",
    "booster",
    "solar_panel",
    "fuse",
    "cable",
]);
export type ProductCategory = z.infer<typeof ProductCategory>;

/** Map von Kategorie zu Schema */
export const ProductSpecSchemas = {
    battery: BatterySpec,
    inverter: InverterSpec,
    charge_controller: ChargeControllerSpec,
    booster: BoosterSpec,
    solar_panel: SolarPanelSpec,
    fuse: FuseSpec,
    cable: CableSpec,
} as const;

// ==========================================
// Union-Typ für alle Produkt-Specs
// ==========================================

export const ProductSpec = z.union([
    BatterySpec,
    InverterSpec,
    ChargeControllerSpec,
    BoosterSpec,
    SolarPanelSpec,
    FuseSpec,
    CableSpec,
]);
export type ProductSpec = z.infer<typeof ProductSpec>;

// ==========================================
// Validierungsfunktionen
// ==========================================

/**
 * Validiert Produktspezifikationen basierend auf der Kategorie
 */
export function validateProductSpec(
    category: ProductCategory,
    specs: unknown
): { success: true; data: ProductSpec } | { success: false; error: z.ZodError } {
    const schema = ProductSpecSchemas[category];
    const result = schema.safeParse(specs);

    if (result.success) {
        return { success: true, data: result.data as ProductSpec };
    }

    return { success: false, error: result.error };
}

/**
 * Parst Produktspezifikationen und wirft bei Fehler
 */
export function parseProductSpec(category: ProductCategory, specs: unknown): ProductSpec {
    const schema = ProductSpecSchemas[category];
    return schema.parse(specs) as ProductSpec;
}
