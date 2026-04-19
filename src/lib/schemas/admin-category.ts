import * as z from "zod";

export const CATEGORY_FILTER_TYPES = ["text", "number", "select", "multiselect", "brand"] as const;
export type CategoryFilterType = (typeof CATEGORY_FILTER_TYPES)[number];

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const keyRegex = /^[a-z0-9_]+$/;

const categoryBase = z.object({
  name: z.string().min(1, "Name erforderlich"),
  slug: z
    .string()
    .min(1, "Slug erforderlich")
    .regex(slugRegex, "Slug nur a-z, 0-9 und Bindestriche"),
  icon: z.string().nullable(),
  sortOrder: z.number().int().nonnegative(),
});

export const adminCategoryCreateSchema = categoryBase;
export const adminCategoryUpdateSchema = categoryBase.extend({ id: z.string().uuid() });

export type AdminCategoryCreateInput = z.infer<typeof adminCategoryCreateSchema>;
export type AdminCategoryUpdateInput = z.infer<typeof adminCategoryUpdateSchema>;

const filterTypeEnum = z.enum(CATEGORY_FILTER_TYPES);

const filterBase = z
  .object({
    categoryId: z.string().uuid(),
    key: z
      .string()
      .min(1, "Key erforderlich")
      .regex(keyRegex, "Key nur a-z, 0-9 und Unterstriche"),
    name: z.string().min(1, "Name erforderlich"),
    type: filterTypeEnum,
    unit: z.string().nullable(),
    options: z.array(z.string().min(1)).default([]),
    sortOrder: z.number().int().nonnegative(),
  })
  .superRefine((data, ctx) => {
    if ((data.type === "select" || data.type === "multiselect") && data.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Optionen sind bei select/multiselect erforderlich",
      });
    }
  });

export const adminCategoryFilterCreateSchema = filterBase;
export const adminCategoryFilterUpdateSchema = z
  .object({
    id: z.string().uuid(),
    categoryId: z.string().uuid(),
    key: z
      .string()
      .min(1)
      .regex(keyRegex, "Key nur a-z, 0-9 und Unterstriche"),
    name: z.string().min(1),
    type: filterTypeEnum,
    unit: z.string().nullable(),
    options: z.array(z.string().min(1)).default([]),
    sortOrder: z.number().int().nonnegative(),
  })
  .superRefine((data, ctx) => {
    if ((data.type === "select" || data.type === "multiselect") && data.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Optionen sind bei select/multiselect erforderlich",
      });
    }
  });

export type AdminCategoryFilterCreateInput = z.infer<typeof adminCategoryFilterCreateSchema>;
export type AdminCategoryFilterUpdateInput = z.infer<typeof adminCategoryFilterUpdateSchema>;
