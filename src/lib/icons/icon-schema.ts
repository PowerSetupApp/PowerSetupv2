import * as z from "zod";

import { normalizeIconKey } from "@/lib/icons/normalize-icon-key";

/** Nullable icon key for admin catalog forms (accepts legacy emoji, stores key). */
export const iconKeyFieldSchema = z
  .string()
  .max(64)
  .nullable()
  .superRefine((val, ctx) => {
    if (val === null || val.trim() === "") return;
    if (!normalizeIconKey(val)) {
      ctx.addIssue({
        code: "custom",
        message: "Ungültiger Icon-Key — bitte in der Icon-Auswahl wählen.",
      });
    }
  })
  .transform((val) => {
    if (val === null || val.trim() === "") return null;
    return normalizeIconKey(val);
  });
