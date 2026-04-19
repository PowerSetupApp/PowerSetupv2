import { describe, expect, it } from "vitest";

import {
  adminCategoryCreateSchema,
  adminCategoryFilterCreateSchema,
  adminCategoryFilterUpdateSchema,
  adminCategoryUpdateSchema,
} from "./admin-category";

const UUID = "00000000-0000-4000-8000-000000000000";

describe("adminCategoryCreateSchema", () => {
  it("accepts valid name and slug", () => {
    const parsed = adminCategoryCreateSchema.safeParse({
      name: "Batterien",
      slug: "batterien",
      icon: null,
      sortOrder: 0,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects uppercase slug", () => {
    const parsed = adminCategoryCreateSchema.safeParse({
      name: "X",
      slug: "NotKebab",
      icon: null,
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    const parsed = adminCategoryCreateSchema.safeParse({
      name: "X",
      slug: "has space",
      icon: null,
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty name", () => {
    const parsed = adminCategoryCreateSchema.safeParse({
      name: "",
      slug: "x",
      icon: null,
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("adminCategoryUpdateSchema", () => {
  it("requires id", () => {
    const parsed = adminCategoryUpdateSchema.safeParse({
      name: "X",
      slug: "x",
      icon: null,
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("adminCategoryFilterCreateSchema", () => {
  it("accepts text filter without options", () => {
    const parsed = adminCategoryFilterCreateSchema.safeParse({
      categoryId: UUID,
      key: "color",
      name: "Farbe",
      type: "text",
      unit: null,
      options: [],
      sortOrder: 0,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects select without options", () => {
    const parsed = adminCategoryFilterCreateSchema.safeParse({
      categoryId: UUID,
      key: "waveform",
      name: "Sinusform",
      type: "select",
      unit: null,
      options: [],
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown filter type", () => {
    const parsed = adminCategoryFilterCreateSchema.safeParse({
      categoryId: UUID,
      key: "x",
      name: "Y",
      type: "slider",
      unit: null,
      options: [],
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects uppercase key", () => {
    const parsed = adminCategoryFilterCreateSchema.safeParse({
      categoryId: UUID,
      key: "MyKey",
      name: "Y",
      type: "text",
      unit: null,
      options: [],
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts multiselect with options", () => {
    const parsed = adminCategoryFilterCreateSchema.safeParse({
      categoryId: UUID,
      key: "types",
      name: "Typen",
      type: "multiselect",
      unit: null,
      options: ["a", "b"],
      sortOrder: 1,
    });
    expect(parsed.success).toBe(true);
  });
});

describe("adminCategoryFilterUpdateSchema", () => {
  it("requires filter id and categoryId", () => {
    const parsed = adminCategoryFilterUpdateSchema.safeParse({
      key: "k",
      name: "N",
      type: "text",
      unit: null,
      options: [],
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
  });
});
