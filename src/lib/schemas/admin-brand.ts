import * as z from "zod";

const brandBase = z.object({
  name: z.string().min(1, "Name erforderlich"),
  types: z.array(z.string().min(1)),
  isActive: z.boolean(),
  showInPreferences: z.boolean(),
});

export const adminBrandCreateSchema = brandBase;
export const adminBrandUpdateSchema = brandBase.extend({ id: z.string().uuid() });

export type AdminBrandCreateInput = z.infer<typeof adminBrandCreateSchema>;
export type AdminBrandUpdateInput = z.infer<typeof adminBrandUpdateSchema>;

/** Upsert für `BrandFilterCategory` (Wizard-Gruppe → Produktkategorien). */
export const adminBrandCategoryMappingSchema = z.object({
  key: z.string().min(1, "Key erforderlich"),
  label: z.string().min(1, "Label erforderlich"),
  categorySlugs: z.array(z.string().min(1)),
  sortOrder: z.number().int().nonnegative(),
});

export type AdminBrandCategoryMappingInput = z.infer<typeof adminBrandCategoryMappingSchema>;
