import * as z from "zod";

const tripDuration = z.enum(["weekend", "week", "extended", "permanent"]);
const winterLocation = z.enum(["scandinavia", "germany", "southern", "eastern", "varies"]);

const autarchyTopUpProfileRow = z.object({
  battery_only: z.number(),
  solar_or_alt: z.number(),
  solar_and_alt: z.number(),
});

const seasonRow = z.object({
  summer: z.number(),
  all_year: z.number(),
  winter: z.number(),
});

const standingRow = z.object({
  short: z.number(),
  medium: z.number(),
  long: z.number(),
});

export const maxAutarchyDaysSchema = z.record(tripDuration, autarchyTopUpProfileRow);

export const pshTableSchema = z.record(winterLocation, seasonRow);

export const solarBagAlignmentUpliftSchema = pshTableSchema;

export const driveHoursPerDaySchema = z.record(tripDuration, standingRow);

export const dodDefaultsSchema = z.object({
  lifepo4: z.number(),
  agm: z.number(),
  gel: z.number(),
});

export const roundtripDefaultsSchema = dodDefaultsSchema;
export const cRateChargeMaxSchema = dodDefaultsSchema;
export const absorptionTailHSchema = dodDefaultsSchema;

export const chargerTargetCRateSchema = z.object({
  occasional: z.number(),
  nightly: z.number(),
  nightly_fast: z.number(),
  full_time: z.number(),
});

export const shoreBridgeReliefDaysSchema = z.object({
  never: z.number(),
  occasional: z.number(),
  nightly: z.number(),
  nightly_fast: z.number(),
  full_time: z.number(),
});

export const alternatorBridgeStandingCreditSchema = standingRow;
export const topUpCoverageStandingCapMultSchema = standingRow;

export const peakFactorSchema = z.object({
  low: z.number(),
  moderate: z.number(),
  high: z.number(),
});

export const algorithmMatrixFieldSchemas = {
  maxAutarchyDays: maxAutarchyDaysSchema,
  pshTable: pshTableSchema,
  solarBagAlignmentUplift: solarBagAlignmentUpliftSchema,
  driveHoursPerDay: driveHoursPerDaySchema,
  dodDefaults: dodDefaultsSchema,
  roundtripDefaults: roundtripDefaultsSchema,
  cRateChargeMax: cRateChargeMaxSchema,
  absorptionTailH: absorptionTailHSchema,
  chargerTargetCRate: chargerTargetCRateSchema,
  shoreBridgeReliefDays: shoreBridgeReliefDaysSchema,
  alternatorBridgeStandingCredit: alternatorBridgeStandingCreditSchema,
  topUpCoverageStandingCapMult: topUpCoverageStandingCapMultSchema,
  peakFactor: peakFactorSchema,
} as const;

export type AlgorithmMatrixFieldKey = keyof typeof algorithmMatrixFieldSchemas;

export function parseJsonMatrixField<K extends AlgorithmMatrixFieldKey>(
  key: K,
  raw: unknown,
): z.infer<(typeof algorithmMatrixFieldSchemas)[K]> | undefined {
  if (raw === null || raw === undefined) return undefined;
  const schema = algorithmMatrixFieldSchemas[key];
  const r = schema.safeParse(raw);
  return r.success ? (r.data as z.infer<(typeof algorithmMatrixFieldSchemas)[K]>) : undefined;
}
