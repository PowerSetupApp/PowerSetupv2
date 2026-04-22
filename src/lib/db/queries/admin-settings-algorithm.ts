import { cacheTag } from "next/cache";

import { Prisma, type AlgorithmSettings } from "@/generated/prisma/client";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { getPrisma } from "@/lib/db/client";
import {
  normalizeAlgorithmSettingsImportRow,
  pickAlgorithmSettingsDbFields,
} from "@/lib/schemas/admin-catalog-json";

export type AlgorithmSettingsPatch = Partial<Omit<AlgorithmSettings, "id" | "updatedAt">>;

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
  if (existing) return existing;
  try {
    return await prisma.algorithmSettings.create({ data: { id: "default" } });
  } catch {
    // Race: anderer Request hat die Zeile zwischen findUnique und create angelegt.
    return prisma.algorithmSettings.findUniqueOrThrow({ where: { id: "default" } });
  }
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
  return prisma.algorithmSettings.findUnique({ where: { id: "default" } });
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

export async function syncComponentClassesFromDB(): Promise<Partial<AlgorithmSettingsPatch>> {
  const prisma = getPrisma();

  const inverters = await prisma.product.findMany({
    where: {
      isActive: true,
      category: {
        OR: [{ slug: { contains: "inverter" } }, { slug: { contains: "wechselrichter" } }],
      },
      powerW: { not: null },
    },
    distinct: ["powerW"],
    select: { powerW: true },
    orderBy: { powerW: "asc" },
  });
  const inverterClasses = inverters
    .map((p) => p.powerW)
    .filter((v): v is number => v != null)
    .join(",");

  const allChargers = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { slug: { contains: "charger" } },
      currentA: { not: null },
    },
    select: { name: true, currentA: true, category: { select: { slug: true } } },
    orderBy: { currentA: "asc" },
  });
  const validChargers = allChargers.filter((p) => {
    const slug = p.category.slug.toLowerCase();
    const isSolar = slug.includes("solar") || slug.includes("mppt") || slug.includes("pv") || slug.includes("photovoltaik");
    return !isSolar;
  });
  let chargerClasses = [...new Set(validChargers.map((p) => p.currentA))]
    .sort((a, b) => (a ?? 0) - (b ?? 0))
    .filter((v): v is number => v != null)
    .join(",");

  if (!chargerClasses || chargerClasses === "10,20,30,50,60") {
    if (!chargerClasses.includes("16")) {
      chargerClasses = "16,30";
    }
  }

  const solarControllers = await prisma.product.findMany({
    where: {
      isActive: true,
      category: {
        OR: [
          { slug: { contains: "solar" } },
          { slug: { contains: "mppt" } },
          { slug: { contains: "photovoltaik" } },
        ],
      },
      currentA: { not: null },
    },
    distinct: ["currentA"],
    select: { currentA: true },
    orderBy: { currentA: "asc" },
  });
  const solarControllerClasses = solarControllers.map((p) => p.currentA).filter((v): v is number => v != null).join(",");

  const cables = await prisma.product.findMany({
    where: { isActive: true, crossSectionMm2: { not: null } },
    distinct: ["crossSectionMm2"],
    select: { crossSectionMm2: true },
    orderBy: { crossSectionMm2: "asc" },
  });
  const cableSizes = cables.map((p) => p.crossSectionMm2).filter((v): v is number => v != null).join(",");

  const newData: Partial<AlgorithmSettingsPatch> = {};
  if (inverterClasses) newData.inverterClasses = inverterClasses;
  if (chargerClasses) newData.chargerClasses = chargerClasses;
  if (solarControllerClasses) newData.solarControllerClasses = solarControllerClasses;
  if (cableSizes) newData.cableSizes = cableSizes;
  return newData;
}
