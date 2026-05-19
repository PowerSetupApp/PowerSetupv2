import * as z from "zod";

import { iconKeyFieldSchema } from "@/lib/icons/icon-schema";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const consumerCategoryBase = z.object({
  name: z.string().min(1, "Name erforderlich"),
  slug: z
    .string()
    .min(1, "Slug erforderlich")
    .regex(slugRegex, "Slug nur a-z, 0-9 und Bindestriche"),
  icon: iconKeyFieldSchema,
  sortOrder: z.number().int().nonnegative(),
});

export const adminConsumerCategoryCreateSchema = consumerCategoryBase;
export const adminConsumerCategoryUpdateSchema = consumerCategoryBase.extend({
  id: z.string().uuid(),
});

export type AdminConsumerCategoryCreateInput = z.infer<typeof adminConsumerCategoryCreateSchema>;
export type AdminConsumerCategoryUpdateInput = z.infer<typeof adminConsumerCategoryUpdateSchema>;

const consumerDeviceBase = z.object({
  name: z.string().min(1, "Name erforderlich"),
  categoryId: z.string().uuid(),
  icon: iconKeyFieldSchema,
  defaultPower: z.number().int().positive(),
  defaultVoltage: z.string().min(1),
  defaultHoursPerDay: z.number().finite().nonnegative(),
  stepHours: z.number().finite().positive(),
  /**
   * Durchschnittliche Leistung in % der Nennleistung (`defaultPower`).
   * `null` oder `100` ⇒ voller Nennwert.
   */
  averageLoadPercent: z.number().int().min(1).max(100).nullable(),
  showHoursField: z.boolean(),
  showFixedOption: z.boolean(),
  isCooling: z.boolean(),
  keywords: z.array(z.string().min(1)),
  sortOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

export const adminConsumerDeviceCreateSchema = consumerDeviceBase;
export const adminConsumerDeviceUpdateSchema = consumerDeviceBase.extend({
  id: z.string().uuid(),
});

export type AdminConsumerDeviceCreateInput = z.infer<typeof adminConsumerDeviceCreateSchema>;
export type AdminConsumerDeviceUpdateInput = z.infer<typeof adminConsumerDeviceUpdateSchema>;
