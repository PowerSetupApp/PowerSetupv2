import { describe, expect, it } from "vitest";

import { adminSpecsOptimizeSchema } from "./admin-specs-optimize";

describe("adminSpecsOptimizeSchema", () => {
  it("accepts a valid text", () => {
    const parsed = adminSpecsOptimizeSchema.safeParse({ text: "Hallo Welt", categoryName: null });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty text", () => {
    const parsed = adminSpecsOptimizeSchema.safeParse({ text: "", categoryName: null });
    expect(parsed.success).toBe(false);
  });

  it("rejects text exceeding max length", () => {
    const parsed = adminSpecsOptimizeSchema.safeParse({
      text: "x".repeat(20001),
      categoryName: null,
    });
    expect(parsed.success).toBe(false);
  });
});
