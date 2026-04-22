import { updateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { CACHE_TAGS } from "@/lib/cache/tags";
import type { AdminExportDomain } from "@/lib/schemas/admin-catalog-json";
import {
  buildExportEnvelope,
  collectMissingConsumerDeviceCategories,
  collectMissingProductReferences,
  filterSystemSettingsForImport,
  parseAlgorithmSettingsImport,
  pickAlgorithmSettingsDbFields,
  parseBrandFilterCategoriesImport,
  parseBrandsImport,
  parseCategoriesImport,
  parseConsumerCategoriesImport,
  parseConsumerDevicesImport,
  parseModelPricingImport,
  parseProductsImport,
  parsePromptVersionsImport,
  parseSystemSettingsImport,
  redactSystemSettingsForExport,
  validateCategoryFiltersBelongToCategory,
} from "@/lib/schemas/admin-catalog-json";

import { getPrisma } from "@/lib/db/client";
import { decimalToNumber } from "@/lib/money";

function asInputJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return value as Prisma.InputJsonValue;
}

/** Decimal → number für JSON-Export (Zod-Schemas erwarten number). */
function mapProductForExport<T extends { price: unknown }>(row: T): T & { price: number | null } {
  return { ...row, price: decimalToNumber(row.price as never) };
}

function mapModelPricingForExport<T extends { inputPrice: unknown; outputPrice: unknown }>(
  row: T,
): T & { inputPrice: number; outputPrice: number } {
  return {
    ...row,
    inputPrice: decimalToNumber(row.inputPrice as never) ?? 0,
    outputPrice: decimalToNumber(row.outputPrice as never) ?? 0,
  };
}

export async function exportAdminDomain(
  domain: AdminExportDomain,
  options?: { includeSecrets?: boolean },
): Promise<unknown> {
  const prisma = getPrisma();
  const includeSecrets = options?.includeSecrets === true;

  switch (domain) {
    case "products": {
      const rows = await prisma.product.findMany({ orderBy: { updatedAt: "desc" } });
      return buildExportEnvelope(domain, rows.map(mapProductForExport));
    }
    case "brands": {
      const rows = await prisma.brand.findMany({ orderBy: { name: "asc" } });
      return buildExportEnvelope(domain, rows);
    }
    case "brand-filter-categories": {
      const rows = await prisma.brandFilterCategory.findMany({ orderBy: { sortOrder: "asc" } });
      return buildExportEnvelope(domain, rows);
    }
    case "categories": {
      const rows = await prisma.category.findMany({
        include: { filters: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      });
      const items = rows.map(({ filters, ...c }) => ({ ...c, filters }));
      return buildExportEnvelope(domain, items);
    }
    case "consumer-categories": {
      const rows = await prisma.consumerCategory.findMany({
        select: { id: true, name: true, slug: true, icon: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      });
      return buildExportEnvelope(domain, rows);
    }
    case "consumer-devices": {
      const rows = await prisma.consumerDevice.findMany({ orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }] });
      return buildExportEnvelope(domain, rows);
    }
    case "system-settings": {
      const rows = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
      const redacted = redactSystemSettingsForExport(rows, includeSecrets);
      return buildExportEnvelope(domain, redacted);
    }
    case "algorithm-settings": {
      const row = await prisma.algorithmSettings.findUnique({ where: { id: "default" } });
      if (!row) {
        return { exportVersion: 1 as const, exportedAt: new Date().toISOString(), kind: domain, item: null };
      }
      return { exportVersion: 1 as const, exportedAt: new Date().toISOString(), kind: domain, item: row };
    }
    case "model-pricing": {
      const rows = await prisma.modelPricing.findMany({ orderBy: [{ provider: "asc" }, { modelId: "asc" }] });
      return buildExportEnvelope(domain, rows.map(mapModelPricingForExport));
    }
    case "prompt-versions": {
      const rows = await prisma.promptVersion.findMany({ orderBy: { version: "asc" } });
      return buildExportEnvelope(domain, rows);
    }
    default: {
      const _exhaustive: never = domain;
      return _exhaustive;
    }
  }
}

export type AdminCatalogImportResult = { imported: number };

/**
 * Nach einem erfolgreichen Import müssen Cache-Einträge, die die geänderten
 * Entitäten halten, invalidiert werden (`next/cache.updateTag`).
 * Best-Effort — Failure im Cache-Bust darf die Import-Response nicht kippen.
 */
function invalidateCacheForDomain(domain: AdminExportDomain): void {
  try {
    updateTag(CACHE_TAGS.adminCatalog);
    if (
      domain === "products" ||
      domain === "categories" ||
      domain === "brands" ||
      domain === "brand-filter-categories"
    ) {
      updateTag(CACHE_TAGS.activeProducts);
    }
    if (domain === "consumer-devices" || domain === "consumer-categories") {
      updateTag(CACHE_TAGS.consumerTemplates);
    }
    if (domain === "algorithm-settings") {
      updateTag(CACHE_TAGS.algorithmSettings);
    }
  } catch {
    /* noop */
  }
}

async function importAdminDomainInner(
  domain: AdminExportDomain,
  raw: unknown,
): Promise<AdminCatalogImportResult> {
  const prisma = getPrisma();

  switch (domain) {
    case "consumer-categories": {
      const items = parseConsumerCategoriesImport(raw);
      await prisma.$transaction(
        items.map((row) =>
          prisma.consumerCategory.upsert({
            where: { id: row.id },
            create: { ...row },
            update: {
              name: row.name,
              slug: row.slug,
              icon: row.icon ?? null,
              sortOrder: row.sortOrder,
            },
          }),
        ),
      );
      return { imported: items.length };
    }
    case "consumer-devices": {
      const items = parseConsumerDevicesImport(raw);
      const cats = await prisma.consumerCategory.findMany({ select: { id: true } });
      const catIds = new Set(cats.map((c) => c.id));
      const missing = collectMissingConsumerDeviceCategories(items, catIds);
      if (missing.length) {
        throw new Error(`Unbekannte consumerCategoryId(s): ${missing.join(", ")}`);
      }
      await prisma.$transaction(
        items.map((row) =>
          prisma.consumerDevice.upsert({
            where: { id: row.id },
            create: { ...row },
            update: {
              name: row.name,
              i18nKey: row.i18nKey ?? null,
              icon: row.icon ?? null,
              defaultPower: row.defaultPower,
              defaultVoltage: row.defaultVoltage,
              defaultHoursPerDay: row.defaultHoursPerDay,
              stepHours: row.stepHours,
              showHoursField: row.showHoursField,
              showFixedOption: row.showFixedOption,
              isCooling: row.isCooling,
              keywords: row.keywords,
              sortOrder: row.sortOrder,
              isActive: row.isActive,
              isFeatured: row.isFeatured,
              categoryId: row.categoryId,
              averageLoadPercent: row.averageLoadPercent ?? null,
            },
          }),
        ),
      );
      return { imported: items.length };
    }
    case "brands": {
      const items = parseBrandsImport(raw);
      await prisma.$transaction(
        items.map((row) =>
          prisma.brand.upsert({
            where: { id: row.id },
            create: { ...row },
            update: {
              name: row.name,
              showInPreferences: row.showInPreferences,
              types: row.types,
              isActive: row.isActive,
            },
          }),
        ),
      );
      return { imported: items.length };
    }
    case "brand-filter-categories": {
      const items = parseBrandFilterCategoriesImport(raw);
      await prisma.$transaction(
        items.map((row) =>
          prisma.brandFilterCategory.upsert({
            where: { id: row.id },
            create: { ...row },
            update: {
              key: row.key,
              label: row.label,
              categorySlugs: row.categorySlugs,
              sortOrder: row.sortOrder,
            },
          }),
        ),
      );
      return { imported: items.length };
    }
    case "categories": {
      const items = parseCategoriesImport(raw);
      const mismatch = validateCategoryFiltersBelongToCategory(items);
      if (mismatch) throw new Error(mismatch);
      await prisma.$transaction(async (tx) => {
        for (const c of items) {
          const { filters, ...cat } = c;
          await tx.category.upsert({
            where: { id: cat.id },
            create: cat,
            update: {
              name: cat.name,
              slug: cat.slug,
              icon: cat.icon ?? null,
              sortOrder: cat.sortOrder,
            },
          });
          const keepIds = new Set(filters.map((f) => f.id));
          if (filters.length === 0) {
            await tx.categoryFilter.deleteMany({ where: { categoryId: cat.id } });
          } else {
            await tx.categoryFilter.deleteMany({
              where: { categoryId: cat.id, id: { notIn: [...keepIds] } },
            });
          }
          for (const f of filters) {
            await tx.categoryFilter.upsert({
              where: { id: f.id },
              create: f,
              update: {
                name: f.name,
                key: f.key,
                type: f.type,
                unit: f.unit ?? null,
                options: f.options,
                sortOrder: f.sortOrder,
                categoryId: f.categoryId,
              },
            });
          }
        }
      });
      return { imported: items.length };
    }
    case "products": {
      const items = parseProductsImport(raw);
      const [cats, brands] = await Promise.all([
        prisma.category.findMany({ select: { id: true } }),
        prisma.brand.findMany({ select: { id: true } }),
      ]);
      const catIds = new Set(cats.map((c) => c.id));
      const brandIds = new Set(brands.map((b) => b.id));
      const { missingCategories, missingBrands } = collectMissingProductReferences(items, catIds, brandIds);
      if (missingCategories.length) {
        throw new Error(`Unbekannte categoryId(s): ${missingCategories.join(", ")}`);
      }
      if (missingBrands.length) {
        throw new Error(`Unbekannte brandId(s): ${missingBrands.join(", ")}`);
      }
      await prisma.$transaction(
        items.map((row) => {
          const jsonCommon = {
            supportedVoltages: asInputJson(row.supportedVoltages),
            filterValues: asInputJson(row.filterValues),
          };
          return prisma.product.upsert({
            where: { id: row.id },
            create: {
              id: row.id,
              name: row.name,
              description: row.description ?? null,
              icon: row.icon ?? null,
              imageUrl: row.imageUrl ?? null,
              affiliateUrl: row.affiliateUrl ?? null,
              asin: row.asin ?? null,
              price: row.price ?? null,
              categoryId: row.categoryId,
              specVersion: row.specVersion,
              specs: row.specs,
              powerW: row.powerW ?? null,
              capacityAh: row.capacityAh ?? null,
              voltageV: row.voltageV ?? null,
              batteryType: row.batteryType ?? null,
              currentA: row.currentA ?? null,
              crossSectionMm2: row.crossSectionMm2 ?? null,
              solarWp: row.solarWp ?? null,
              maxDischargeA: row.maxDischargeA ?? null,
              waveform: row.waveform ?? null,
              fuseType: row.fuseType ?? null,
              isActive: row.isActive,
              brandId: row.brandId ?? null,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
              ...jsonCommon,
            },
            update: {
              name: row.name,
              description: row.description ?? null,
              icon: row.icon ?? null,
              imageUrl: row.imageUrl ?? null,
              affiliateUrl: row.affiliateUrl ?? null,
              asin: row.asin ?? null,
              price: row.price ?? null,
              categoryId: row.categoryId,
              specVersion: row.specVersion,
              specs: row.specs,
              powerW: row.powerW ?? null,
              capacityAh: row.capacityAh ?? null,
              voltageV: row.voltageV ?? null,
              batteryType: row.batteryType ?? null,
              currentA: row.currentA ?? null,
              crossSectionMm2: row.crossSectionMm2 ?? null,
              solarWp: row.solarWp ?? null,
              maxDischargeA: row.maxDischargeA ?? null,
              waveform: row.waveform ?? null,
              fuseType: row.fuseType ?? null,
              isActive: row.isActive,
              brandId: row.brandId ?? null,
              ...jsonCommon,
            },
          });
        }),
      );
      return { imported: items.length };
    }
    case "system-settings": {
      let items = parseSystemSettingsImport(raw);
      items = filterSystemSettingsForImport(items);
      await prisma.$transaction(
        items.map((row) =>
          prisma.systemSetting.upsert({
            where: { key: row.key },
            create: { key: row.key, value: row.value },
            update: { value: row.value },
          }),
        ),
      );
      return { imported: items.length };
    }
    case "algorithm-settings": {
      const row = parseAlgorithmSettingsImport(raw) as Record<string, unknown>;
      const safe = pickAlgorithmSettingsDbFields(row);
      const {
        updatedAt: _updatedAt,
        createdAt: _createdAt,
        id: rowId,
        ...patch
      } = safe;
      void _updatedAt;
      void _createdAt;
      const id = typeof rowId === "string" ? rowId : "default";
      await prisma.algorithmSettings.upsert({
        where: { id },
        create: { id, ...patch } as never,
        update: patch as never,
      });
      return { imported: 1 };
    }
    case "model-pricing": {
      const items = parseModelPricingImport(raw);
      await prisma.$transaction(
        items.map((row) =>
          prisma.modelPricing.upsert({
            where: { modelId: row.modelId },
            create: {
              id: row.id,
              modelId: row.modelId,
              displayName: row.displayName ?? null,
              provider: row.provider,
              inputPrice: row.inputPrice,
              outputPrice: row.outputPrice,
            },
            update: {
              id: row.id,
              displayName: row.displayName ?? null,
              provider: row.provider,
              inputPrice: row.inputPrice,
              outputPrice: row.outputPrice,
            },
          }),
        ),
      );
      return { imported: items.length };
    }
    case "prompt-versions": {
      const items = parsePromptVersionsImport(raw);
      const versions = new Set<number>();
      for (const r of items) {
        if (versions.has(r.version)) {
          throw new Error(`Doppelte PromptVersion.version: ${r.version}`);
        }
        versions.add(r.version);
      }
      await prisma.$transaction(async (tx) => {
        await tx.promptVersion.deleteMany({});
        for (const row of items) {
          await tx.promptVersion.create({ data: row });
        }
      });
      return { imported: items.length };
    }
    default: {
      const _exhaustive: never = domain;
      return _exhaustive;
    }
  }
}

export async function importAdminDomain(
  domain: AdminExportDomain,
  raw: unknown,
): Promise<AdminCatalogImportResult> {
  const result = await importAdminDomainInner(domain, raw);
  invalidateCacheForDomain(domain);
  return result;
}
