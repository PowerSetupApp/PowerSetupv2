"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { extractAsinFromAmazonInput } from "@/lib/amazon/asin";
import { extractAmazonProductForCategory } from "@/lib/amazon/extractor";
import { applyTechnicalDetailNumericInference } from "@/lib/amazon/infer-from-item";
import { fetchAmazonItem } from "@/lib/amazon/index";
import { mapAmazonExtractionToImportPayload } from "@/lib/amazon/map-to-product-create";
import { resolveImportedProductImageUrl } from "@/lib/blob/product-image";
import type {
  AdminCatalogMutationResult,
  AdminCatalogMutationResultWithId,
} from "@/lib/db/queries/admin-catalog-mutations";
import {
  createAdminBrand,
  createAdminCategory,
  createAdminCategoryFilter,
  createAdminConsumerCategory,
  createAdminConsumerDevice,
  createAdminProduct,
  createAdminProductFromAmazonImport,
  deleteAdminBrandById,
  deleteAdminCategoryById,
  deleteAdminCategoryFilterById,
  deleteAdminConsumerCategoryById,
  deleteAdminConsumerDeviceById,
  deleteAdminProductById,
  updateAdminBrandById,
  updateAdminCategoryById,
  updateAdminCategoryFilterById,
  updateAdminConsumerCategoryById,
  updateAdminConsumerDeviceById,
  updateAdminProductById,
  upsertAdminBrandFilterCategory,
} from "@/lib/db/queries/admin-catalog-mutations";
import {
  getAdminCategorySlugById,
  getAdminProductPreviewById,
  listAdminBrands,
  listAdminCategoryFiltersByCategoryId,
} from "@/lib/db/queries/admin-catalog-read";
import type { AdminCategoryFilterEditorRow, AdminProductPreviewRow } from "@/lib/db/queries/admin-catalog-read";
import { getAmazonPartnerTag } from "@/lib/db/queries/admin-settings-amazon";
import {
  adminBrandCategoryMappingSchema,
  adminBrandCreateSchema,
  adminBrandUpdateSchema,
} from "@/lib/schemas/admin-brand";
import {
  adminCategoryCreateSchema,
  adminCategoryFilterCreateSchema,
  adminCategoryFilterUpdateSchema,
  adminCategoryUpdateSchema,
} from "@/lib/schemas/admin-category";
import {
  adminConsumerCategoryCreateSchema,
  adminConsumerCategoryUpdateSchema,
  adminConsumerDeviceCreateSchema,
  adminConsumerDeviceUpdateSchema,
} from "@/lib/schemas/admin-consumer";
import { adminProductCreateSchema } from "@/lib/schemas/admin-product-create";
import { adminProductUpdateSchema } from "@/lib/schemas/admin-product-update";

const INVALID_INPUT_MESSAGE = "Bitte Eingaben prüfen.";

const amazonImportProductSchema = z.object({
  asinOrUrl: z.string().min(1),
  categoryId: z.string().uuid(),
  mode: z.enum(["api", "scrape"]),
});

export type ImportProductFromAmazonActionResult =
  | { ok: true; productId: string; suggestedBrandName: string | null }
  | { ok: false; message: string };

/**
 * Amazon-Import (Creators API oder Scraping) mit KI-Extraktion und Befüllung von Filtern + Prefilter-Skalaren.
 */
export async function importProductFromAmazonAction(
  input: unknown,
): Promise<ImportProductFromAmazonActionResult> {
  const parsed = amazonImportProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: INVALID_INPUT_MESSAGE };
  }
  const { asinOrUrl, categoryId, mode } = parsed.data;

  const slugRes = await getAdminCategorySlugById(categoryId);
  if (!slugRes.ok) return { ok: false, message: slugRes.message };
  if (!slugRes.data) {
    return { ok: false, message: "Kategorie nicht gefunden." };
  }

  const filtersRes = await listAdminCategoryFiltersByCategoryId(categoryId);
  if (!filtersRes.ok) return { ok: false, message: filtersRes.message };

  const brandsRes = await listAdminBrands();
  if (!brandsRes.ok) return { ok: false, message: brandsRes.message };
  const brands = brandsRes.data.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name }));

  const asin = extractAsinFromAmazonInput(asinOrUrl);
  if (!asin) {
    return { ok: false, message: "Ungültige ASIN oder Amazon-URL." };
  }

  const partnerTag = await getAmazonPartnerTag();
  let item;
  try {
    item = await fetchAmazonItem(asin, mode, partnerTag);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Amazon-Abruf fehlgeschlagen.";
    return { ok: false, message: msg };
  }
  if (!item) {
    return {
      ok: false,
      message:
        mode === "scrape"
          ? `Produkt mit ASIN „${asin}“ über Scraping nicht gefunden.`
          : `Produkt mit ASIN „${asin}“ über die Amazon-API nicht gefunden.`,
    };
  }

  let extracted;
  try {
    extracted = await extractAmazonProductForCategory(item, slugRes.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "KI-Extraktion fehlgeschlagen.";
    return { ok: false, message: msg };
  }

  const extractedInferred = applyTechnicalDetailNumericInference(extracted, item);
  const mapped = mapAmazonExtractionToImportPayload(extractedInferred, item, filtersRes.data, brands);
  const imageUrl = await resolveImportedProductImageUrl(mapped.imageUrl, asin, item.detailPageUrl ?? null);
  const out = await createAdminProductFromAmazonImport({ ...mapped, categoryId, imageUrl });
  if (!out.ok) {
    return { ok: false, message: out.message };
  }
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${out.id}`);
  return { ok: true, productId: out.id, suggestedBrandName: mapped.suggestedBrandName };
}

// ============================================================
// Read actions
// ============================================================

export type AdminProductPreviewActionResult =
  | { ok: true; data: AdminProductPreviewRow | null }
  | { ok: false; message: string };

export async function adminCatalogGetProductPreviewAction(id: string): Promise<AdminProductPreviewActionResult> {
  const res = await getAdminProductPreviewById(id);
  if (!res.ok) return { ok: false, message: res.message };
  return { ok: true, data: res.data };
}

export type AdminCategoryFiltersActionResult =
  | { ok: true; data: AdminCategoryFilterEditorRow[] }
  | { ok: false; message: string };

export async function adminCatalogListCategoryFiltersAction(
  categoryId: string,
): Promise<AdminCategoryFiltersActionResult> {
  const res = await listAdminCategoryFiltersByCategoryId(categoryId);
  if (!res.ok) return { ok: false, message: res.message };
  return { ok: true, data: res.data };
}

// ============================================================
// Product actions
// ============================================================

export async function adminCatalogCreateProductAction(input: unknown): Promise<AdminCatalogMutationResultWithId> {
  const parsed = adminProductCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await createAdminProduct(parsed.data);
  if (out.ok) revalidatePath("/admin/products");
  return out;
}

export async function adminCatalogUpdateProductAction(input: unknown): Promise<AdminCatalogMutationResult> {
  const parsed = adminProductUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await updateAdminProductById(parsed.data);
  if (out.ok) {
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${parsed.data.id}`);
  }
  return out;
}

export async function adminCatalogDeleteProductAction(id: string): Promise<AdminCatalogMutationResult> {
  const out = await deleteAdminProductById(id);
  if (out.ok) {
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
  }
  return out;
}

// ============================================================
// Category + CategoryFilter actions
// ============================================================

export async function adminCatalogCreateCategoryAction(input: unknown): Promise<AdminCatalogMutationResultWithId> {
  const parsed = adminCategoryCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await createAdminCategory(parsed.data);
  if (out.ok) revalidatePath("/admin/categories");
  return out;
}

export async function adminCatalogUpdateCategoryAction(input: unknown): Promise<AdminCatalogMutationResult> {
  const parsed = adminCategoryUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await updateAdminCategoryById(parsed.data);
  if (out.ok) {
    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${parsed.data.id}`);
  }
  return out;
}

export async function adminCatalogDeleteCategoryAction(id: string): Promise<AdminCatalogMutationResult> {
  const out = await deleteAdminCategoryById(id);
  if (out.ok) revalidatePath("/admin/categories");
  return out;
}

export async function adminCatalogCreateCategoryFilterAction(
  input: unknown,
): Promise<AdminCatalogMutationResultWithId> {
  const parsed = adminCategoryFilterCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await createAdminCategoryFilter(parsed.data);
  if (out.ok) revalidatePath(`/admin/categories/${parsed.data.categoryId}`);
  return out;
}

export async function adminCatalogUpdateCategoryFilterAction(
  input: unknown,
): Promise<AdminCatalogMutationResult> {
  const parsed = adminCategoryFilterUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await updateAdminCategoryFilterById(parsed.data);
  if (out.ok) revalidatePath(`/admin/categories/${parsed.data.categoryId}`);
  return out;
}

export async function adminCatalogDeleteCategoryFilterAction(
  id: string,
  categoryId: string,
): Promise<AdminCatalogMutationResult> {
  const out = await deleteAdminCategoryFilterById(id);
  if (out.ok) revalidatePath(`/admin/categories/${categoryId}`);
  return out;
}

// ============================================================
// Brand actions + BrandFilterCategory upsert
// ============================================================

export async function adminCatalogCreateBrandAction(input: unknown): Promise<AdminCatalogMutationResultWithId> {
  const parsed = adminBrandCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await createAdminBrand(parsed.data);
  if (out.ok) revalidatePath("/admin/brands");
  return out;
}

export async function adminCatalogUpdateBrandAction(input: unknown): Promise<AdminCatalogMutationResult> {
  const parsed = adminBrandUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await updateAdminBrandById(parsed.data);
  if (out.ok) revalidatePath("/admin/brands");
  return out;
}

export async function adminCatalogDeleteBrandAction(id: string): Promise<AdminCatalogMutationResult> {
  const out = await deleteAdminBrandById(id);
  if (out.ok) revalidatePath("/admin/brands");
  return out;
}

export async function adminCatalogUpsertBrandMappingAction(
  input: unknown,
): Promise<AdminCatalogMutationResult> {
  const parsed = adminBrandCategoryMappingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await upsertAdminBrandFilterCategory(parsed.data);
  if (out.ok) revalidatePath("/admin/brands");
  return out;
}

// ============================================================
// ConsumerCategory + ConsumerDevice actions
// ============================================================

export async function adminCatalogCreateConsumerCategoryAction(
  input: unknown,
): Promise<AdminCatalogMutationResultWithId> {
  const parsed = adminConsumerCategoryCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await createAdminConsumerCategory(parsed.data);
  if (out.ok) revalidatePath("/admin/consumer-categories");
  return out;
}

export async function adminCatalogUpdateConsumerCategoryAction(
  input: unknown,
): Promise<AdminCatalogMutationResult> {
  const parsed = adminConsumerCategoryUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await updateAdminConsumerCategoryById(parsed.data);
  if (out.ok) {
    revalidatePath("/admin/consumer-categories");
    revalidatePath(`/admin/consumer-categories/${parsed.data.id}`);
  }
  return out;
}

export async function adminCatalogDeleteConsumerCategoryAction(id: string): Promise<AdminCatalogMutationResult> {
  const out = await deleteAdminConsumerCategoryById(id);
  if (out.ok) revalidatePath("/admin/consumer-categories");
  return out;
}

export async function adminCatalogCreateConsumerDeviceAction(
  input: unknown,
): Promise<AdminCatalogMutationResultWithId> {
  const parsed = adminConsumerDeviceCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await createAdminConsumerDevice(parsed.data);
  if (out.ok) revalidatePath("/admin/consumer-devices");
  return out;
}

export async function adminCatalogUpdateConsumerDeviceAction(
  input: unknown,
): Promise<AdminCatalogMutationResult> {
  const parsed = adminConsumerDeviceUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID_INPUT_MESSAGE };
  const out = await updateAdminConsumerDeviceById(parsed.data);
  if (out.ok) {
    revalidatePath("/admin/consumer-devices");
    revalidatePath(`/admin/consumer-devices/${parsed.data.id}`);
  }
  return out;
}

export async function adminCatalogDeleteConsumerDeviceAction(id: string): Promise<AdminCatalogMutationResult> {
  const out = await deleteAdminConsumerDeviceById(id);
  if (out.ok) revalidatePath("/admin/consumer-devices");
  return out;
}
