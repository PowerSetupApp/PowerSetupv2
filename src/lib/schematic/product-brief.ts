/** Reduzierte Produktinfos für den Schaltplan-Prompt (ohne Prisma im Prompt-Baustein). */
export type SchematicProductBrief = {
  id: string;
  name: string;
  categoryName: string;
  specs: string;
  capacityAh: number | null;
  voltageV: number | null;
  solarWp: number | null;
  powerW: number | null;
  currentA: number | null;
  crossSectionMm2: number | null;
  batteryType: string | null;
  waveform: string | null;
};
