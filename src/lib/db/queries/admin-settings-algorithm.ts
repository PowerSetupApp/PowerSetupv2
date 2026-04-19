import { cacheTag } from "next/cache";

import type { AlgorithmSettings } from "@/generated/prisma/client";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { getPrisma } from "@/lib/db/client";

export type AlgorithmSettingsPatch = Partial<Omit<AlgorithmSettings, "id" | "updatedAt">>;

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/**
 * Liest den Default-Row defensiv via `upsert` — vermeidet Race-Condition beim
 * ersten Zugriff in einer frischen DB. Nicht cachebar (Write-Pfad), daher nur
 * für den Admin benutzen.
 */
export async function getAlgorithmSettings(): Promise<AlgorithmSettings> {
  const prisma = getPrisma();
  return prisma.algorithmSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
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
  const data = stripUndefined(patch as Record<string, unknown>) as AlgorithmSettingsPatch;
  await prisma.algorithmSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
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
