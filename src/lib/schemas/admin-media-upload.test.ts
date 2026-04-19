import { describe, expect, it } from "vitest";

import { ADMIN_MEDIA_MAX_BYTES, adminMediaUploadMetaSchema } from "./admin-media-upload";

describe("adminMediaUploadMetaSchema", () => {
  it("accepts image/png within size limit", () => {
    const parsed = adminMediaUploadMetaSchema.safeParse({
      filename: "x.png",
      mimeType: "image/png",
      size: 100,
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts image/jpeg", () => {
    const parsed = adminMediaUploadMetaSchema.safeParse({
      filename: "x.jpg",
      mimeType: "image/jpeg",
      size: 100,
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts image/webp", () => {
    const parsed = adminMediaUploadMetaSchema.safeParse({
      filename: "x.webp",
      mimeType: "image/webp",
      size: 100,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown mime type", () => {
    const parsed = adminMediaUploadMetaSchema.safeParse({
      filename: "x.svg",
      mimeType: "image/svg+xml",
      size: 100,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects files above limit", () => {
    const parsed = adminMediaUploadMetaSchema.safeParse({
      filename: "big.png",
      mimeType: "image/png",
      size: ADMIN_MEDIA_MAX_BYTES + 1,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty filename", () => {
    const parsed = adminMediaUploadMetaSchema.safeParse({
      filename: "",
      mimeType: "image/png",
      size: 100,
    });
    expect(parsed.success).toBe(false);
  });
});
