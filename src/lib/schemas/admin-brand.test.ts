import { describe, expect, it } from "vitest";

import {
  adminBrandCreateSchema,
  adminBrandUpdateSchema,
  adminBrandCategoryMappingSchema,
} from "./admin-brand";

describe("adminBrandCreateSchema", () => {
  it("accepts minimal brand without types", () => {
    const parsed = adminBrandCreateSchema.safeParse({
      name: "Victron",
      types: [],
      isActive: true,
      showInPreferences: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty name", () => {
    const parsed = adminBrandCreateSchema.safeParse({
      name: "",
      types: [],
      isActive: true,
      showInPreferences: true,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("adminBrandUpdateSchema", () => {
  it("requires id", () => {
    const parsed = adminBrandUpdateSchema.safeParse({
      name: "Victron",
      types: [],
      isActive: true,
      showInPreferences: true,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("adminBrandCategoryMappingSchema", () => {
  it("accepts empty categorySlugs", () => {
    const parsed = adminBrandCategoryMappingSchema.safeParse({
      key: "charger",
      label: "Ladeelektronik",
      categorySlugs: [],
      sortOrder: 0,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty key", () => {
    const parsed = adminBrandCategoryMappingSchema.safeParse({
      key: "",
      label: "Ladeelektronik",
      categorySlugs: [],
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
  });
});
