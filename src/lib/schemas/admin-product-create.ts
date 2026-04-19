import * as z from "zod";

export const adminProductCreateSchema = z.object({
  name: z.string().min(1, "Name erforderlich"),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  imageUrl: z.string().nullable(),
  affiliateUrl: z.string().nullable(),
  asin: z.string().nullable(),
  price: z.number().finite().nonnegative().nullable(),
  categoryId: z.string().uuid(),
  specs: z.string(),
  isActive: z.boolean(),
  brandId: z.string().uuid().nullable(),
  filterValues: z.record(z.string(), z.unknown()),
});

export type AdminProductCreateInput = z.infer<typeof adminProductCreateSchema>;
