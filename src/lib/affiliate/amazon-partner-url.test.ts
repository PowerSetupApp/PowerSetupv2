import { describe, expect, it, vi } from "vitest";

import { applyAmazonPartnerTag } from "./amazon-partner-url";

describe("applyAmazonPartnerTag", () => {
  it("returns null for empty", () => {
    expect(applyAmazonPartnerTag(null)).toBe(null);
    expect(applyAmazonPartnerTag("")).toBe(null);
  });

  it("appends tag when missing", () => {
    vi.stubEnv("AMAZON_PARTNER_TAG", "my-tag-21");
    expect(applyAmazonPartnerTag("https://amazon.de/dp/B00TEST")).toBe(
      "https://amazon.de/dp/B00TEST?tag=my-tag-21",
    );
    vi.unstubAllEnvs();
  });

  it("overwrites foreign tag with our own", () => {
    vi.stubEnv("AMAZON_PARTNER_TAG", "my-tag-21");
    expect(applyAmazonPartnerTag("https://amazon.de/dp/X?tag=foreign-tag")).toBe(
      "https://amazon.de/dp/X?tag=my-tag-21",
    );
    vi.unstubAllEnvs();
  });

  it("keeps non-absolute URLs unchanged", () => {
    expect(applyAmazonPartnerTag("/relative/path")).toBe("/relative/path");
  });

  it("preserves other query params", () => {
    vi.stubEnv("AMAZON_PARTNER_TAG", "my-tag-21");
    expect(applyAmazonPartnerTag("https://amazon.de/dp/X?foo=1&tag=old")).toBe(
      "https://amazon.de/dp/X?foo=1&tag=my-tag-21",
    );
    vi.unstubAllEnvs();
  });

  it("uses explicit partner tag over env", () => {
    vi.stubEnv("AMAZON_PARTNER_TAG", "env-tag-21");
    expect(applyAmazonPartnerTag("https://amazon.de/dp/X", "db-tag-21")).toBe("https://amazon.de/dp/X?tag=db-tag-21");
    vi.unstubAllEnvs();
  });
});
