/**
 * Katalog-Spec-Statistik (read-only). Die Spalten `inverterClasses` / `chargerClasses` /
 * `solarControllerClasses` / `cableSizes` auf `AlgorithmSettings` bleiben für JSON-Import
 * (`algorithm-settings`) und Alt-Daten; es gibt dafür keinen Algorithmus-Tab mehr.
 */
import * as z from "zod";

import { isSolarChargerSlug } from "@/lib/admin/admin-catalog-product-completeness";
import { getPrisma } from "@/lib/db/client";

import type { Prisma } from "@/generated/prisma/client";

import type { AlgorithmSettingsPatch } from "@/lib/db/queries/admin-settings-algorithm";

const inverterCategoryWhere: Prisma.CategoryWhereInput = {
  OR: [{ slug: { contains: "inverter" } }, { slug: { contains: "wechselrichter" } }],
};

const solarCategoryWhere: Prisma.CategoryWhereInput = {
  OR: [
    { slug: { contains: "solar" } },
    { slug: { contains: "mppt" } },
    { slug: { contains: "photovoltaik" } },
  ],
};

const valueCountSchema = z.object({
  value: z.number(),
  count: z.number(),
});

export const catalogComponentDimensionStatsSchema = z.object({
  inverters: z.object({
    rows: z.array(valueCountSchema),
    activeInCategory: z.number(),
    missingPowerW: z.number(),
  }),
  chargersDc: z.object({
    rows: z.array(valueCountSchema),
    activeInCategory: z.number(),
    missingCurrentA: z.number(),
  }),
  solarControllers: z.object({
    rows: z.array(valueCountSchema),
    activeInCategory: z.number(),
    missingCurrentA: z.number(),
  }),
  cables: z.object({
    rows: z.array(valueCountSchema),
    activeWithCrossSection: z.number(),
    missingCrossSectionInCableCategories: z.number(),
  }),
});

export type CatalogComponentDimensionStats = z.infer<typeof catalogComponentDimensionStatsSchema>;

/**
 * Distinct Spec-Werte + Lücken für den Admin-Katalog (read-only).
 * Filterlogik analog zu früherem `syncComponentClassesFromDB`.
 */
export async function getCatalogComponentDimensionStats(): Promise<CatalogComponentDimensionStats> {
  const prisma = getPrisma();

  const [inverterGroups, inverterActive, inverterMissingPowerW] = await Promise.all([
    prisma.product.groupBy({
      by: ["powerW"],
      where: {
        isActive: true,
        powerW: { not: null },
        category: inverterCategoryWhere,
      },
      _count: { _all: true },
      orderBy: { powerW: "asc" },
    }),
    prisma.product.count({
      where: { isActive: true, category: inverterCategoryWhere },
    }),
    prisma.product.count({
      where: { isActive: true, powerW: null, category: inverterCategoryWhere },
    }),
  ]);

  const inverterRows = inverterGroups
    .filter((g): g is typeof g & { powerW: number } => g.powerW != null)
    .map((g) => ({ value: g.powerW, count: g._count._all }));

  const chargerRowsRaw = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { slug: { contains: "charger" } },
    },
    select: { currentA: true, category: { select: { slug: true } } },
  });

  const chargerDcOnly = chargerRowsRaw.filter((p) => !isSolarChargerSlug(p.category.slug));
  const chargerDcMissing = chargerDcOnly.filter((p) => p.currentA == null).length;
  const chargerCurrentMap = new Map<number, number>();
  for (const p of chargerDcOnly) {
    if (p.currentA == null) continue;
    chargerCurrentMap.set(p.currentA, (chargerCurrentMap.get(p.currentA) ?? 0) + 1);
  }
  const chargersDcRows = [...chargerCurrentMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([value, count]) => ({ value, count }));

  const [solarGroups, solarActive, solarMissing] = await Promise.all([
    prisma.product.groupBy({
      by: ["currentA"],
      where: {
        isActive: true,
        currentA: { not: null },
        category: solarCategoryWhere,
      },
      _count: { _all: true },
      orderBy: { currentA: "asc" },
    }),
    prisma.product.count({
      where: { isActive: true, category: solarCategoryWhere },
    }),
    prisma.product.count({
      where: { isActive: true, currentA: null, category: solarCategoryWhere },
    }),
  ]);

  const solarRows = solarGroups
    .filter((g): g is typeof g & { currentA: number } => g.currentA != null)
    .map((g) => ({ value: g.currentA, count: g._count._all }));

  const cableCategoryWhere = {
    OR: [{ slug: { contains: "kabel" } }, { slug: { contains: "cable" } }],
  };

  const [cableGroups, cableMissingCross] = await Promise.all([
    prisma.product.groupBy({
      by: ["crossSectionMm2"],
      where: {
        isActive: true,
        crossSectionMm2: { not: null },
      },
      _count: { _all: true },
      orderBy: { crossSectionMm2: "asc" },
    }),
    prisma.product.count({
      where: {
        isActive: true,
        crossSectionMm2: null,
        category: cableCategoryWhere,
      },
    }),
  ]);

  const cableRows = cableGroups
    .filter((g): g is typeof g & { crossSectionMm2: number } => g.crossSectionMm2 != null)
    .map((g) => ({ value: g.crossSectionMm2, count: g._count._all }));

  const activeWithCrossSection = await prisma.product.count({
    where: { isActive: true, crossSectionMm2: { not: null } },
  });

  return catalogComponentDimensionStatsSchema.parse({
    inverters: {
      rows: inverterRows,
      activeInCategory: inverterActive,
      missingPowerW: inverterMissingPowerW,
    },
    chargersDc: {
      rows: chargersDcRows,
      activeInCategory: chargerDcOnly.length,
      missingCurrentA: chargerDcMissing,
    },
    solarControllers: {
      rows: solarRows,
      activeInCategory: solarActive,
      missingCurrentA: solarMissing,
    },
    cables: {
      rows: cableRows,
      activeWithCrossSection,
      missingCrossSectionInCableCategories: cableMissingCross,
    },
  });
}

/** Legacy: komma-separierte Strings für JSON-Import / AlgorithmSettings-Zeile. */
export async function syncComponentClassesFromDB(): Promise<Partial<AlgorithmSettingsPatch>> {
  const stats = await getCatalogComponentDimensionStats();

  const inverterClasses = stats.inverters.rows.map((r) => r.value).join(",");
  let chargerClasses = stats.chargersDc.rows.map((r) => r.value).join(",");
  if (!chargerClasses || chargerClasses === "10,20,30,50,60") {
    if (!chargerClasses.includes("16")) {
      chargerClasses = "16,30";
    }
  }
  const solarControllerClasses = stats.solarControllers.rows.map((r) => r.value).join(",");
  const cableSizes = stats.cables.rows.map((r) => r.value).join(",");

  const newData: Partial<AlgorithmSettingsPatch> = {};
  if (inverterClasses) newData.inverterClasses = inverterClasses;
  if (chargerClasses) newData.chargerClasses = chargerClasses;
  if (solarControllerClasses) newData.solarControllerClasses = solarControllerClasses;
  if (cableSizes) newData.cableSizes = cableSizes;
  return newData;
}
