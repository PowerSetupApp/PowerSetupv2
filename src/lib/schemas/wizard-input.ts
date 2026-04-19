import * as z from "zod";

import type { AlgorithmInput } from "@/lib/algorithm/types";

/**
 * Reale Obergrenzen. Schützen gegen absurde Eingaben (z. B. 10 MW-Verbraucher)
 * und verhindern Float-Overflows im Algorithmus. Bewusst großzügig, um legitime
 * Edge-Cases (Kühlwagen, Expeditionsfahrzeuge) zu erlauben.
 */
const MAX_POWER_W = 20_000;
const MAX_HOURS_PER_DAY = 24;
const MAX_SOLAR_BAG_W = 4_000;
const MAX_ROOF_DIM_CM = 5_000; // 50m
const MAX_CABLE_LENGTH_M = 100;
const MAX_OVERRIDE_NUMBER = 10_000;

const finitePositive = () => z.number().finite().nonnegative();
const finitePositiveUpTo = (max: number) => z.number().finite().nonnegative().max(max);

const systemVoltageSchema = z.union([z.literal(12), z.literal(24), z.literal(48)]);
const vehicleVoltageSchema = z.union([z.literal(12), z.literal(24), z.literal(48)]);
const batteryPreferenceSchema = z.enum(["lifepo4", "agm", "gel"]);
const energySourceSchema = z.enum(["solar", "alternator", "shore_power"]);
const roofModuleTypeSchema = z.enum(["rigid", "flexible"]);
const roofAreaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  length: finitePositiveUpTo(MAX_ROOF_DIM_CM),
  width: finitePositiveUpTo(MAX_ROOF_DIM_CM),
});
const solarBagSchema = z.object({
  id: z.string().min(1),
  power: finitePositiveUpTo(MAX_SOLAR_BAG_W),
});
const chargerSpeedSchema = z.enum(["slow", "normal", "fast"]);
const consumerVoltageSchema = z.union([z.literal(12), z.literal(24), z.literal(48), z.literal(230)]);
const consumerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  power: finitePositiveUpTo(MAX_POWER_W),
  daily: finitePositiveUpTo(MAX_HOURS_PER_DAY),
  voltage: consumerVoltageSchema,
  coolingMethod: z.enum(["compressor", "absorber"]).optional(),
  electricShare: z.number().min(0).max(1).optional(),
  sourceDeviceId: z.string().min(1).optional(),
  deviceIcon: z.string().max(64).nullable().optional(),
  categoryIcon: z.string().max(64).nullable().optional(),
  showHoursField: z.boolean().optional(),
  dailyStep: z.number().finite().positive().max(MAX_HOURS_PER_DAY).optional(),
  averageLoadPercent: z.number().int().min(1).max(100).optional(),
});
const simultaneousLoadSchema = z.enum(["low", "moderate", "high"]);
const travelBehaviorSchema = z.object({
  season: z.enum(["summer", "all_year", "winter"]),
  tripDuration: z.enum(["weekend", "week", "extended", "permanent"]),
  winterLocation: z.enum(["scandinavia", "germany", "southern", "eastern", "varies"]),
  standingDuration: z.enum(["short", "medium", "long"]),
});
const autarchyDaysSchema = z.number().int().min(1).max(999);
const cableLengthsSchema = z.object({
  starterToService: finitePositiveUpTo(MAX_CABLE_LENGTH_M),
  boosterToService: finitePositiveUpTo(MAX_CABLE_LENGTH_M),
  solarToRegulator: finitePositiveUpTo(MAX_CABLE_LENGTH_M),
  regulatorToService: finitePositiveUpTo(MAX_CABLE_LENGTH_M),
  chargerToService: finitePositiveUpTo(MAX_CABLE_LENGTH_M),
  serviceToInverter: finitePositiveUpTo(MAX_CABLE_LENGTH_M),
  batteryToFuseBox: finitePositiveUpTo(MAX_CABLE_LENGTH_M),
});
const brandPreferencesSchema = z.object({
  charger: z.string().nullable(),
  battery: z.string().nullable(),
  solar: z.string().nullable(),
});
const overrideNumber = () => finitePositive().max(MAX_OVERRIDE_NUMBER).nullable();
const customOverridesSchema = z.object({
  battery: overrideNumber(),
  solar: overrideNumber(),
  booster: overrideNumber(),
  controller: overrideNumber(),
  inverter: overrideNumber(),
  charger: overrideNumber(),
});

/** Request-Body für `POST /api/results` (Wizard-Formular = `AlgorithmInput`). */
export const algorithmInputSchema = z
  .object({
    systemVoltage: systemVoltageSchema,
    vehicleVoltage: vehicleVoltageSchema,
    batteryPreference: batteryPreferenceSchema,
    energySources: z.array(energySourceSchema),
    roofModuleType: roofModuleTypeSchema,
    roofAreas: z.array(roofAreaSchema),
    solarBags: z.array(solarBagSchema),
    chargerSpeed: chargerSpeedSchema,
    consumers: z.array(consumerSchema),
    simultaneousLoad: simultaneousLoadSchema,
    travelBehavior: travelBehaviorSchema,
    autarchyDays: autarchyDaysSchema,
    cableLengths: cableLengthsSchema,
    brandPreferences: brandPreferencesSchema,
    customOverrides: customOverridesSchema,
  });

export function parseAlgorithmInput(data: unknown): AlgorithmInput {
  return algorithmInputSchema.parse(data);
}

/** Body von `POST /api/results` und `POST /api/wizard/algorithm-preview`. */
export const createWizardResultBodySchema = z.object({
  formData: algorithmInputSchema,
  /**
   * Optional: wenn `true`, liefert `/api/wizard/algorithm-preview` zusätzlich
   * das `breakdown`-Dictionary (Zwischenwerte der Algorithmus-Phasen) für
   * die Debug-Ansicht in Wizard-Step 8. Ohne das Flag bleibt die Response
   * schlank.
   */
  debug: z.boolean().optional(),
});

export type CreateWizardResultBody = z.infer<typeof createWizardResultBodySchema>;
