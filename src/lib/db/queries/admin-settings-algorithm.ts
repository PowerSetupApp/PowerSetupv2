import { cacheTag, updateTag } from "next/cache";

import { Prisma, type AlgorithmSettings, type PrismaClient } from "@/generated/prisma/client";
import { CABLE_CURRENT_SAFETY_FACTOR } from "@/lib/algorithm/constants";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { getPrisma } from "@/lib/db/client";
import {
  normalizeAlgorithmSettingsImportRow,
  pickAlgorithmSettingsDbFields,
} from "@/lib/schemas/admin-catalog-json";

export type AlgorithmSettingsPatch = Partial<Omit<AlgorithmSettings, "id" | "updatedAt">>;

/** Table defaults match prisma/schema.prisma — fills null/undefined from older rows or clients. */
const DEFAULT_AMBIENT_TEMP_C = 30;

function ensureCableAmpacitySettings(row: AlgorithmSettings): AlgorithmSettings {
  const r = row as Record<string, unknown>;
  const fromRowC = r["cableCurrentSafetyFactor"];
  const fromRowA = r["ambientTempC"];
  const cableCurrentSafetyFactor =
    typeof fromRowC === "number" && Number.isFinite(fromRowC) ? fromRowC : CABLE_CURRENT_SAFETY_FACTOR;
  const ambientTempC =
    typeof fromRowA === "number" && Number.isFinite(fromRowA) ? fromRowA : DEFAULT_AMBIENT_TEMP_C;
  return { ...row, cableCurrentSafetyFactor, ambientTempC };
}

/**
 * If DB columns exist but are NULL, set defaults. Uses raw SQL so this still
 * works when the generated Prisma client is older than `schema.prisma` (until
 * `prisma generate` is run). Returns whether an UPDATE ran.
 */
async function backfillCableAmpacityColumnsIfNull(prisma: PrismaClient, rowId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<{ c: unknown; a: unknown }[]>(
      Prisma.sql`SELECT "cableCurrentSafetyFactor" AS c, "ambientTempC" AS a FROM "AlgorithmSettings" WHERE "id" = ${rowId} LIMIT 1`,
    );
    const hit = rows[0];
    if (!hit) return false;
    const cMissing = hit.c === null || hit.c === undefined;
    const aMissing = hit.a === null || hit.a === undefined;
    if (!cMissing && !aMissing) return false;
    await prisma.$executeRaw(
      Prisma.sql`UPDATE "AlgorithmSettings" SET "cableCurrentSafetyFactor" = ${CABLE_CURRENT_SAFETY_FACTOR}, "ambientTempC" = ${DEFAULT_AMBIENT_TEMP_C} WHERE "id" = ${rowId}`,
    );
    updateTag(CACHE_TAGS.algorithmSettings);
    return true;
  } catch {
    // Migration not applied or column names differ — leave row as-is.
    return false;
  }
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  ) as Partial<T>;
}

/**
 * Liest den Default-Row defensiv via `upsert` — vermeidet Race-Condition beim
 * ersten Zugriff in einer frischen DB. Nicht cachebar (Write-Pfad), daher nur
 * für den Admin benutzen.
 */
export async function getAlgorithmSettings(): Promise<AlgorithmSettings> {
  const prisma = getPrisma();
  const existing = await prisma.algorithmSettings.findUnique({ where: { id: "default" } });
  let row =
    existing ??
    (await (async () => {
      try {
        return await prisma.algorithmSettings.create({ data: { id: "default" } });
      } catch {
        return prisma.algorithmSettings.findUniqueOrThrow({ where: { id: "default" } });
      }
    })());

  if (existing != null) {
    const didBackfill = await backfillCableAmpacityColumnsIfNull(prisma, row.id);
    if (didBackfill) {
      row = await prisma.algorithmSettings.findUniqueOrThrow({ where: { id: row.id } });
    }
  }

  return ensureCableAmpacitySettings(row);
}

/**
 * Cache-freundlicher Lesepfad für die Algorithmus-Pipeline.
 *
 * Nutzt `use cache` + `cacheTag(algorithmSettings)`. Wird invalidiert, wenn der
 * Admin speichert (siehe `saveAlgorithmSettingsAction`). Fällt bei leerem Row
 * zu `null` zurück — der Adapter interpretiert das als „keine DB-Overrides".
 */
export async function getAlgorithmSettingsCached(): Promise<AlgorithmSettings | null> {
  "use cache";
  cacheTag(CACHE_TAGS.algorithmSettings);
  const prisma = getPrisma();
  const row = await prisma.algorithmSettings.findUnique({ where: { id: "default" } });
  return row ? ensureCableAmpacitySettings(row) : null;
}

export async function updateAlgorithmSettings(patch: AlgorithmSettingsPatch): Promise<void> {
  const prisma = getPrisma();
  const stripped = stripUndefined(patch as Record<string, unknown>);
  // Alte Admin-Clients / JSON können noch `dodLifepo4`, `simultaneousLow`, … senden —
  // DB-Spalten v2 kennen die nicht. Normalisierung mappt Legacy → erlaubte Felder.
  const normalized = normalizeAlgorithmSettingsImportRow({
    id: "default",
    ...stripped,
  } as Record<string, unknown>);
  const safe = pickAlgorithmSettingsDbFields(normalized);
  const rowId = typeof safe.id === "string" ? safe.id : "default";
  const { id: _id, createdAt: _c, updatedAt: _u, ...updatePayload } = safe;
  void _id;
  void _c;
  void _u;
  const data = stripUndefined(updatePayload as Record<string, unknown>) as AlgorithmSettingsPatch;
  await prisma.algorithmSettings.upsert({
    where: { id: rowId },
    create: { id: rowId, ...data } as Prisma.AlgorithmSettingsUncheckedCreateInput,
    update: data as Prisma.AlgorithmSettingsUncheckedUpdateInput,
  });
}

