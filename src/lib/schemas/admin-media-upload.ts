import * as z from "zod";

export const ADMIN_MEDIA_ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
export type AdminMediaAllowedMime = (typeof ADMIN_MEDIA_ALLOWED_MIME)[number];

export const ADMIN_MEDIA_MAX_BYTES = 5 * 1024 * 1024;

export const adminMediaUploadMetaSchema = z.object({
  filename: z.string().min(1, "Dateiname erforderlich").max(256),
  mimeType: z.enum(ADMIN_MEDIA_ALLOWED_MIME),
  size: z
    .number()
    .int()
    .positive()
    .max(ADMIN_MEDIA_MAX_BYTES, `Max ${Math.round(ADMIN_MEDIA_MAX_BYTES / (1024 * 1024))} MiB`),
});

export type AdminMediaUploadMeta = z.infer<typeof adminMediaUploadMetaSchema>;
