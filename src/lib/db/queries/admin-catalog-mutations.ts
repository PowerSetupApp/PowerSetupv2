import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { updateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { getPrisma } from "@/lib/db/client";
import type { AdminBrandCategoryMappingInput, AdminBrandCreateInput, AdminBrandUpdateInput } from "@/lib/schemas/admin-brand";
import type {
  AdminCategoryCreateInput,
  AdminCategoryFilterCreateInput,
  AdminCategoryFilterUpdateInput,
  AdminCategoryUpdateInput,
} from "@/lib/schemas/admin-category";
import type {
  AdminConsumerCategoryCreateInput,
  AdminConsumerCategoryUpdateInput,
  AdminConsumerDeviceCreateInput,
  AdminConsumerDeviceUpdateInput,
} from "@/lib/schemas/admin-consumer";
import type { AdminProductCreateInput } from "@/lib/schemas/admin-product-create";
import type { AdminProductUpdateInput } from "@/lib/schemas/admin-product-update";

/**
 * Admin-Mutationen laufen außerhalb von `use cache`-Blöcken — deshalb ist
 * `updateTag` hier zulässig. Fehler im Cache-Bust sollen die Mutation nicht
 * fälschen, daher Best-Effort-Catch.
 */
function invalidateCatalogCache(extraTag?: string): void {
  try {
    updateTag(CACHE_TAGS.adminCatalog);
    updateTag(CACHE_TAGS.activeProducts);
    if (extraTag) updateTag(extraTag);
  } catch {
    /* noop */
  }
}

export type AdminCatalogMutationResult = { ok: true } | { ok: false; message: string };
export type AdminCatalogMutationResultWithId = { ok: true; id: string } | { ok: false; message: string };

/** Für Vitest und konsistente Nutzer-Hinweise bei Löschfehlern. */
export function mapAdminCatalogDeleteError(entityLabel: string, error: unknown): string {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return `${entityLabel} wurde nicht gefunden oder ist bereits gelöscht.`;
    }
    if (error.code === "P2003") {
      return `${entityLabel} kann nicht gelöscht werden, weil noch andere Datensätze darauf verweisen.`;
    }
  }
  return `${entityLabel} konnte nicht gelöscht werden. Bitte erneut versuchen.`;
}

function mapUniqueError(fallback: string, error: unknown): string {
  if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
    return "Datensatz existiert bereits (eindeutiges Feld belegt).";
  }
  if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
    return "Datensatz wurde nicht gefunden.";
  }
  return fallback;
}

// ============================================================
// Product create/update/delete
// ============================================================

export async function createAdminProduct(input: AdminProductCreateInput): Promise<AdminCatalogMutationResultWithId> {
  try {
    const prisma = getPrisma();
    const json = input.filterValues as Prisma.InputJsonValue;
    const created = await prisma.product.create({
      data: {
        name: input.name,
        description: input.description,
        icon: input.icon,
        imageUrl: input.imageUrl,
        affiliateUrl: input.affiliateUrl,
        asin: input.asin,
        price: input.price,
        categoryId: input.categoryId,
        specs: input.specs,
        isActive: input.isActive,
        brandId: input.brandId,
        filterValues: json,
      },
      select: { id: true },
    });
    invalidateCatalogCache();
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, message: mapUniqueError("Das Produkt konnte nicht angelegt werden.", e) };
  }
}

export async function updateAdminProductById(input: AdminProductUpdateInput): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    const json = input.filterValues as Prisma.InputJsonValue;
    await prisma.product.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
        icon: input.icon,
        imageUrl: input.imageUrl,
        affiliateUrl: input.affiliateUrl,
        asin: input.asin,
        price: input.price,
        categoryId: input.categoryId,
        specs: input.specs,
        isActive: input.isActive,
        brandId: input.brandId,
        filterValues: json,
      },
    });
    invalidateCatalogCache();
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, message: "Das Produkt wurde nicht gefunden." };
    }
    return { ok: false, message: "Das Produkt konnte nicht gespeichert werden." };
  }
}

export async function deleteAdminProductById(id: string): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.product.delete({ where: { id } });
    invalidateCatalogCache();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAdminCatalogDeleteError("Das Produkt", e) };
  }
}

// ============================================================
// Category + CategoryFilter CRUD
// ============================================================

export async function createAdminCategory(input: AdminCategoryCreateInput): Promise<AdminCatalogMutationResultWithId> {
  try {
    const prisma = getPrisma();
    const created = await prisma.category.create({
      data: { name: input.name, slug: input.slug, icon: input.icon, sortOrder: input.sortOrder },
      select: { id: true },
    });
    invalidateCatalogCache();
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Der Slug ist bereits vergeben." };
    }
    return { ok: false, message: "Die Kategorie konnte nicht angelegt werden." };
  }
}

export async function updateAdminCategoryById(input: AdminCategoryUpdateInput): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.category.update({
      where: { id: input.id },
      data: { name: input.name, slug: input.slug, icon: input.icon, sortOrder: input.sortOrder },
    });
    invalidateCatalogCache();
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Der Slug ist bereits vergeben." };
    }
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, message: "Die Kategorie wurde nicht gefunden." };
    }
    return { ok: false, message: "Die Kategorie konnte nicht gespeichert werden." };
  }
}

export async function deleteAdminCategoryById(id: string): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.category.delete({ where: { id } });
    invalidateCatalogCache();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAdminCatalogDeleteError("Die Kategorie", e) };
  }
}

export async function createAdminCategoryFilter(
  input: AdminCategoryFilterCreateInput,
): Promise<AdminCatalogMutationResultWithId> {
  try {
    const prisma = getPrisma();
    const created = await prisma.categoryFilter.create({
      data: {
        categoryId: input.categoryId,
        key: input.key,
        name: input.name,
        type: input.type,
        unit: input.unit,
        options: input.options,
        sortOrder: input.sortOrder,
      },
      select: { id: true },
    });
    invalidateCatalogCache();
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Der Key ist in dieser Kategorie bereits vergeben." };
    }
    return { ok: false, message: "Der Filter konnte nicht angelegt werden." };
  }
}

export async function updateAdminCategoryFilterById(
  input: AdminCategoryFilterUpdateInput,
): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.categoryFilter.update({
      where: { id: input.id },
      data: {
        key: input.key,
        name: input.name,
        type: input.type,
        unit: input.unit,
        options: input.options,
        sortOrder: input.sortOrder,
      },
    });
    invalidateCatalogCache();
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Der Key ist in dieser Kategorie bereits vergeben." };
    }
    return { ok: false, message: "Der Filter konnte nicht gespeichert werden." };
  }
}

export async function deleteAdminCategoryFilterById(id: string): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.categoryFilter.delete({ where: { id } });
    invalidateCatalogCache();
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2003") {
      return {
        ok: false,
        message: "Der Filter wird noch von Produkten verwendet und kann nicht gelöscht werden.",
      };
    }
    return { ok: false, message: mapAdminCatalogDeleteError("Der Filter", e) };
  }
}

// ============================================================
// Brand CRUD + BrandFilterCategory upsert
// ============================================================

export async function createAdminBrand(input: AdminBrandCreateInput): Promise<AdminCatalogMutationResultWithId> {
  try {
    const prisma = getPrisma();
    const created = await prisma.brand.create({
      data: {
        name: input.name,
        types: input.types,
        isActive: input.isActive,
        showInPreferences: input.showInPreferences,
      },
      select: { id: true },
    });
    invalidateCatalogCache();
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Eine Marke mit diesem Namen existiert bereits." };
    }
    return { ok: false, message: "Die Marke konnte nicht angelegt werden." };
  }
}

export async function updateAdminBrandById(input: AdminBrandUpdateInput): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.brand.update({
      where: { id: input.id },
      data: {
        name: input.name,
        types: input.types,
        isActive: input.isActive,
        showInPreferences: input.showInPreferences,
      },
    });
    invalidateCatalogCache();
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Eine Marke mit diesem Namen existiert bereits." };
    }
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, message: "Die Marke wurde nicht gefunden." };
    }
    return { ok: false, message: "Die Marke konnte nicht gespeichert werden." };
  }
}

export async function deleteAdminBrandById(id: string): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.brand.delete({ where: { id } });
    invalidateCatalogCache();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAdminCatalogDeleteError("Die Marke", e) };
  }
}

export async function upsertAdminBrandFilterCategory(
  input: AdminBrandCategoryMappingInput,
): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.brandFilterCategory.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        label: input.label,
        categorySlugs: input.categorySlugs,
        sortOrder: input.sortOrder,
      },
      update: {
        label: input.label,
        categorySlugs: input.categorySlugs,
        sortOrder: input.sortOrder,
      },
    });
    invalidateCatalogCache();
    return { ok: true };
  } catch {
    return { ok: false, message: "Die Kategorien-Zuordnung konnte nicht gespeichert werden." };
  }
}

// ============================================================
// ConsumerCategory / ConsumerDevice CRUD
// ============================================================

export async function createAdminConsumerCategory(
  input: AdminConsumerCategoryCreateInput,
): Promise<AdminCatalogMutationResultWithId> {
  try {
    const prisma = getPrisma();
    const created = await prisma.consumerCategory.create({
      data: { name: input.name, slug: input.slug, icon: input.icon, sortOrder: input.sortOrder },
      select: { id: true },
    });
    invalidateCatalogCache(CACHE_TAGS.consumerTemplates);
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Der Slug ist bereits vergeben." };
    }
    return { ok: false, message: "Die Verbraucher-Kategorie konnte nicht angelegt werden." };
  }
}

export async function updateAdminConsumerCategoryById(
  input: AdminConsumerCategoryUpdateInput,
): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.consumerCategory.update({
      where: { id: input.id },
      data: { name: input.name, slug: input.slug, icon: input.icon, sortOrder: input.sortOrder },
    });
    invalidateCatalogCache(CACHE_TAGS.consumerTemplates);
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Der Slug ist bereits vergeben." };
    }
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, message: "Die Verbraucher-Kategorie wurde nicht gefunden." };
    }
    return { ok: false, message: "Die Verbraucher-Kategorie konnte nicht gespeichert werden." };
  }
}

export async function deleteAdminConsumerCategoryById(id: string): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.consumerCategory.delete({ where: { id } });
    invalidateCatalogCache(CACHE_TAGS.consumerTemplates);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAdminCatalogDeleteError("Die Verbraucher-Kategorie", e) };
  }
}

function buildConsumerDeviceData(input: AdminConsumerDeviceCreateInput | AdminConsumerDeviceUpdateInput) {
  return {
    name: input.name,
    categoryId: input.categoryId,
    icon: input.icon,
    defaultPower: input.defaultPower,
    defaultVoltage: input.defaultVoltage,
    defaultHoursPerDay: input.defaultHoursPerDay,
    stepHours: input.stepHours,
    showHoursField: input.showHoursField,
    showFixedOption: input.showFixedOption,
    isCooling: input.isCooling,
    keywords: input.keywords,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
    averageLoadPercent: input.averageLoadPercent,
  };
}

export async function createAdminConsumerDevice(
  input: AdminConsumerDeviceCreateInput,
): Promise<AdminCatalogMutationResultWithId> {
  try {
    const prisma = getPrisma();
    const created = await prisma.consumerDevice.create({
      data: buildConsumerDeviceData(input),
      select: { id: true },
    });
    invalidateCatalogCache(CACHE_TAGS.consumerTemplates);
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, message: "Das Verbraucher-Gerät konnte nicht angelegt werden." };
  }
}

export async function updateAdminConsumerDeviceById(
  input: AdminConsumerDeviceUpdateInput,
): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.consumerDevice.update({
      where: { id: input.id },
      data: buildConsumerDeviceData(input),
    });
    invalidateCatalogCache(CACHE_TAGS.consumerTemplates);
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, message: "Das Verbraucher-Gerät wurde nicht gefunden." };
    }
    return { ok: false, message: "Das Verbraucher-Gerät konnte nicht gespeichert werden." };
  }
}

export async function deleteAdminConsumerDeviceById(id: string): Promise<AdminCatalogMutationResult> {
  try {
    const prisma = getPrisma();
    await prisma.consumerDevice.delete({ where: { id } });
    invalidateCatalogCache(CACHE_TAGS.consumerTemplates);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAdminCatalogDeleteError("Das Verbraucher-Gerät", e) };
  }
}
