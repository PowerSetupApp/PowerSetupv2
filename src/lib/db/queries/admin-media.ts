import { del, list, put } from "@vercel/blob";

import type { AdminMediaUploadMeta } from "@/lib/schemas/admin-media-upload";

export type AdminMediaBlob = {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date | null;
  contentType: string | null;
};

export class AdminMediaUnavailableError extends Error {
  constructor(message = "Vercel Blob ist nicht konfiguriert (BLOB_READ_WRITE_TOKEN fehlt).") {
    super(message);
    this.name = "AdminMediaUnavailableError";
  }
}

function ensureBlobToken(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new AdminMediaUnavailableError();
  }
}

export async function uploadAdminMedia(
  body: Blob | ArrayBuffer | ReadableStream<Uint8Array>,
  meta: AdminMediaUploadMeta,
): Promise<AdminMediaBlob> {
  ensureBlobToken();
  const key = `admin/${Date.now()}-${sanitizeFilename(meta.filename)}`;
  const res = await put(key, body, {
    access: "public",
    contentType: meta.mimeType,
    addRandomSuffix: true,
  });
  return {
    url: res.url,
    pathname: res.pathname,
    size: meta.size,
    uploadedAt: new Date(),
    contentType: meta.mimeType,
  };
}

export async function listAdminMedia(limit = 100): Promise<AdminMediaBlob[]> {
  ensureBlobToken();
  const res = await list({ prefix: "admin/", limit });
  return res.blobs.map((b) => ({
    url: b.url,
    pathname: b.pathname,
    size: b.size,
    uploadedAt: b.uploadedAt ?? null,
    contentType: null,
  }));
}

export async function deleteAdminMedia(url: string): Promise<void> {
  ensureBlobToken();
  await del(url);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}
