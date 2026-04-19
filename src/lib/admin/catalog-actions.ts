"use server";

import { revalidatePath } from "next/cache";

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
  getAdminProductPreviewById,
  listAdminCategoryFiltersByCategoryId,
} from "@/lib/db/queries/admin-catalog-read";
import type { AdminCategoryFilterEditorRow, AdminProductPreviewRow } from "@/lib/db/queries/admin-catalog-read";
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
  if (out.ok) revalidatePath("/admin/products");
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
