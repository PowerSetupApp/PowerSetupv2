import { del, put } from "@vercel/blob";

const AMAZON_IMAGE_PATH_HINTS = ["/images/", "/gp/aw/photos", "/i/"];

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Turns scraper/API quirks into a fetchable absolute URL (`//host/…`, `/path/…`, `data:` dropped).
 */
export function normalizeAmazonProductImageUrl(
  candidate: string,
  productPageUrl?: string | null,
): string | null {
  const raw = candidate.trim();
  if (!raw || raw.startsWith("data:")) return null;
  const base = productPageUrl?.trim() || "https://www.amazon.de/";
  try {
    if (raw.startsWith("//")) return new URL(`https:${raw}`).href;
    if (raw.startsWith("/")) return new URL(raw, base).href;
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

/** True when the URL points at Amazon retail or CDN image hosts (must mirror or drop, never persist raw). */
export function isAmazonCdnImageUrl(url: string): boolean {
  const hostname = hostnameOf(url);
  if (!hostname) return false;
  if (hostname.includes("media-amazon")) return true;
  if (hostname.includes("ssl-images-amazon")) return true;
  if (hostname.includes("images-amazon")) return true;

  const amazonRetail = /\.amazon\.(de|com|co\.uk|fr|it|es|nl|se|pl|at|ca|jp|in|com\.mx|com\.br|com\.tr|com\.au|com\.be)$/i;
  if (!amazonRetail.test(hostname)) return false;
  try {
    const p = new URL(url).pathname.toLowerCase();
    return AMAZON_IMAGE_PATH_HINTS.some((h) => p.includes(h));
  } catch {
    return false;
  }
}

/**
 * True for URLs on the Vercel Blob host (public or private), as returned by `put` / the dashboard.
 * Match the SDK: hostname must end with `.blob.vercel-storage.com` (not only `*.public.blob.*`).
 */
export function isVercelBlobPublicStorageUrl(url: string): boolean {
  const hostname = hostnameOf(url);
  if (!hostname) return false;
  return hostname.endsWith(".blob.vercel-storage.com");
}

function hasBlobWriteToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/**
 * Downloads an Amazon-hosted product image and uploads it to Vercel Blob.
 * Returns `null` on missing token, fetch failure, or non-image response.
 */
export async function downloadAmazonProductImageToBlob(
  sourceUrl: string,
  asin: string,
  productPageUrl?: string | null,
): Promise<string | null> {
  if (!hasBlobWriteToken()) return null;

  const referer = productPageUrl?.trim() || "https://www.amazon.de/";
  let origin = "https://www.amazon.de";
  try {
    origin = new URL(referer).origin;
  } catch {
    /* keep default */
  }

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        Referer: referer,
        Origin: origin,
      },
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!contentType.startsWith("image/")) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.byteLength === 0) return null;

    const ext =
      contentType === "image/png"
        ? "png"
        : contentType === "image/webp"
          ? "webp"
          : contentType === "image/gif"
            ? "gif"
            : "jpg";

    const pathname = `product-images/${asin}.${ext}`;
    const res = await put(pathname, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: contentType || "image/jpeg",
    });
    return res.url;
  } catch {
    return null;
  }
}

/**
 * After import mapping: only Vercel Blob URLs or `null` may be stored (never Amazon CDN URLs).
 */
export async function resolveImportedProductImageUrl(
  candidate: string | null,
  asin: string,
  productPageUrl?: string | null,
): Promise<string | null> {
  if (candidate == null || !candidate.trim()) return null;
  const normalized = normalizeAmazonProductImageUrl(candidate, productPageUrl);
  if (!normalized) return null;
  if (isVercelBlobPublicStorageUrl(normalized)) return normalized;
  if (isAmazonCdnImageUrl(normalized)) {
    return (await downloadAmazonProductImageToBlob(normalized, asin, productPageUrl)) ?? null;
  }
  return null;
}

function urlWithoutQueryForBlobDelete(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.search = "";
    parsed.hash = "";
    return parsed.href;
  } catch {
    return url.trim();
  }
}

/**
 * Best-effort delete of a blob object we own. Ignores missing token, non-blob URLs, and delete errors
 * (product row should still be removable).
 */
export async function deleteVercelBlobUrlIfOwned(imageUrl: string | null | undefined): Promise<void> {
  const u = imageUrl?.trim();
  if (!u || !isVercelBlobPublicStorageUrl(u)) return;
  if (!hasBlobWriteToken()) return;

  const toDelete = urlWithoutQueryForBlobDelete(u);
  try {
    await del(toDelete);
  } catch (e) {
    console.error("[product-image] Blob delete failed (continuing)", e);
  }
}
