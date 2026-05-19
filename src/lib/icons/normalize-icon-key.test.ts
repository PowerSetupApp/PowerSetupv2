import { describe, expect, it } from "vitest";

import { normalizeIconKey, normalizeIconKeyOrFallback } from "./normalize-icon-key";

describe("normalizeIconKey", () => {
  it("returns null for empty input", () => {
    expect(normalizeIconKey(null)).toBe(null);
    expect(normalizeIconKey("")).toBe(null);
    expect(normalizeIconKey("   ")).toBe(null);
  });

  it("passes through valid keys", () => {
    expect(normalizeIconKey("refrigerator")).toBe("refrigerator");
    expect(normalizeIconKey("water-pump")).toBe("water-pump");
  });

  it("maps legacy emoji to keys", () => {
    expect(normalizeIconKey("❄️")).toBe("refrigerator");
    expect(normalizeIconKey("💧")).toBe("water-pump");
    expect(normalizeIconKey("⚡")).toBe("zap");
  });

  it("returns null for unknown strings", () => {
    expect(normalizeIconKey("not-an-icon")).toBe(null);
  });
});

describe("normalizeIconKeyOrFallback", () => {
  it("falls back to plug-zap", () => {
    expect(normalizeIconKeyOrFallback(null)).toBe("plug-zap");
    expect(normalizeIconKeyOrFallback("unknown")).toBe("plug-zap");
  });
});
