import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

import {
  deleteVercelBlobUrlIfOwned,
  downloadAmazonProductImageToBlob,
  isAmazonCdnImageUrl,
  isVercelBlobPublicStorageUrl,
  normalizeAmazonProductImageUrl,
  resolveImportedProductImageUrl,
} from "@/lib/blob/product-image";

describe("isAmazonCdnImageUrl", () => {
  it("detects media-amazon hosts", () => {
    expect(isAmazonCdnImageUrl("https://m.media-amazon.com/images/I/71x.jpg")).toBe(true);
  });

  it("detects ssl-images-amazon", () => {
    expect(isAmazonCdnImageUrl("https://images-na.ssl-images-amazon.com/images/I/41foo._AC_SL1000_.jpg")).toBe(
      true,
    );
  });

  it("detects amazon.de retail /images/ path", () => {
    expect(isAmazonCdnImageUrl("https://www.amazon.de/images/I/51bar.jpg")).toBe(true);
  });

  it("rejects non-image amazon.de product page", () => {
    expect(isAmazonCdnImageUrl("https://www.amazon.de/dp/B075NQQRPD")).toBe(false);
  });

  it("rejects arbitrary https", () => {
    expect(isAmazonCdnImageUrl("https://example.com/a.jpg")).toBe(false);
  });

  it("rejects invalid URL", () => {
    expect(isAmazonCdnImageUrl("not a url")).toBe(false);
  });
});

describe("normalizeAmazonProductImageUrl", () => {
  it("prefixes protocol-relative URLs", () => {
    expect(normalizeAmazonProductImageUrl("//m.media-amazon.com/x.jpg", "https://www.amazon.de/dp/B1")).toBe(
      "https://m.media-amazon.com/x.jpg",
    );
  });

  it("resolves root-relative URLs against the product page", () => {
    expect(
      normalizeAmazonProductImageUrl("/images/I/foo.jpg", "https://www.amazon.de/dp/B075NQQRPD"),
    ).toBe("https://www.amazon.de/images/I/foo.jpg");
  });
});

describe("isVercelBlobPublicStorageUrl", () => {
  it("accepts public blob host", () => {
    expect(
      isVercelBlobPublicStorageUrl("https://abc123xyz.public.blob.vercel-storage.com/product-images/x.jpg"),
    ).toBe(true);
  });

  it("accepts any Vercel Blob store host (e.g. private access)", () => {
    expect(
      isVercelBlobPublicStorageUrl("https://myStore.private.blob.vercel-storage.com/path/z.jpg"),
    ).toBe(true);
  });

  it("rejects amazon", () => {
    expect(isVercelBlobPublicStorageUrl("https://m.media-amazon.com/x.jpg")).toBe(false);
  });
});

describe("resolveImportedProductImageUrl", () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.BLOB_READ_WRITE_TOKEN;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.BLOB_READ_WRITE_TOKEN = originalToken;
    vi.restoreAllMocks();
  });

  it("returns null for empty", async () => {
    await expect(resolveImportedProductImageUrl(null, "B000000000")).resolves.toBe(null);
    await expect(resolveImportedProductImageUrl("  ", "B000000000")).resolves.toBe(null);
  });

  it("returns blob URL unchanged", async () => {
    const blob =
      "https://xyz.public.blob.vercel-storage.com/product-images%2FB000000000.jpg-abc123";
    await expect(resolveImportedProductImageUrl(blob, "B000000000")).resolves.toBe(blob);
  });

  it("returns null for unknown external URL without calling fetch", async () => {
    const spy = vi.fn();
    globalThis.fetch = spy as typeof fetch;
    await expect(resolveImportedProductImageUrl("https://example.com/a.jpg", "B000000000")).resolves.toBe(null);
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns null when mirror fails (no token)", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "";
    await expect(
      resolveImportedProductImageUrl("https://m.media-amazon.com/images/I/1.jpg", "B000000000"),
    ).resolves.toBe(null);
  });
});

describe("downloadAmazonProductImageToBlob", () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.BLOB_READ_WRITE_TOKEN;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.BLOB_READ_WRITE_TOKEN = originalToken;
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
  });

  it("returns null when response is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: async () => new ArrayBuffer(0),
    }) as unknown as typeof fetch;

    await expect(
      downloadAmazonProductImageToBlob("https://m.media-amazon.com/images/I/1.jpg", "B000000000"),
    ).resolves.toBe(null);
  });

  it("returns null when content-type is not image", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/html" }),
      arrayBuffer: async () => new TextEncoder().encode("<html>").buffer,
    }) as unknown as typeof fetch;

    await expect(
      downloadAmazonProductImageToBlob("https://m.media-amazon.com/images/I/1.jpg", "B000000000"),
    ).resolves.toBe(null);
  });
});

describe("deleteVercelBlobUrlIfOwned", () => {
  const originalToken = process.env.BLOB_READ_WRITE_TOKEN;

  afterEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = originalToken;
  });

  it("no-ops for null, empty, and non-blob URLs without throwing", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    await expect(deleteVercelBlobUrlIfOwned(null)).resolves.toBeUndefined();
    await expect(deleteVercelBlobUrlIfOwned("")).resolves.toBeUndefined();
    await expect(deleteVercelBlobUrlIfOwned("https://example.com/x")).resolves.toBeUndefined();
  });
});
