import * as z from "zod";

export const SPECS_MAX_INPUT_LENGTH = 20_000;

export const adminSpecsOptimizeSchema = z.object({
  text: z.string().min(1, "Text erforderlich").max(SPECS_MAX_INPUT_LENGTH, "Text zu lang"),
  categoryName: z.string().nullable(),
});

export type AdminSpecsOptimizeInput = z.infer<typeof adminSpecsOptimizeSchema>;
