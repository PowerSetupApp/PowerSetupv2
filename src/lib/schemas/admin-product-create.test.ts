import { describe, expect, it } from "vitest";

import { adminProductCreateSchema } from "./admin-product-create";

const UUID = "00000000-0000-4000-8000-000000000000";

describe("adminProductCreateSchema", () => {
  it("accepts a minimal product", () => {
    const parsed = adminProductCreateSchema.safeParse({
      name: "Victron 100/30",
      categoryId: UUID,
      description: null,
      icon: null,
      imageUrl: null,
      affiliateUrl: null,
      asin: null,
      price: null,
      specs: "",
      isActive: true,
      brandId: null,
      filterValues: {},
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty name", () => {
    const parsed = adminProductCreateSchema.safeParse({
      name: "",
      categoryId: UUID,
      description: null,
      icon: null,
      imageUrl: null,
      affiliateUrl: null,
      asin: null,
      price: null,
      specs: "",
      isActive: true,
      brandId: null,
      filterValues: {},
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects negative price", () => {
    const parsed = adminProductCreateSchema.safeParse({
      name: "A",
      categoryId: UUID,
      description: null,
      icon: null,
      imageUrl: null,
      affiliateUrl: null,
      asin: null,
      price: -1,
      specs: "",
      isActive: true,
      brandId: null,
      filterValues: {},
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid UUID for categoryId", () => {
    const parsed = adminProductCreateSchema.safeParse({
      name: "A",
      categoryId: "not-a-uuid",
      description: null,
      icon: null,
      imageUrl: null,
      affiliateUrl: null,
      asin: null,
      price: null,
      specs: "",
      isActive: true,
      brandId: null,
      filterValues: {},
    });
    expect(parsed.success).toBe(false);
  });
});
