import { describe, expect, it } from "vitest";

import {
  adminConsumerCategoryCreateSchema,
  adminConsumerCategoryUpdateSchema,
  adminConsumerDeviceCreateSchema,
  adminConsumerDeviceUpdateSchema,
} from "./admin-consumer";

const UUID = "00000000-0000-4000-8000-000000000000";

describe("adminConsumerCategoryCreateSchema", () => {
  it("accepts valid data", () => {
    const parsed = adminConsumerCategoryCreateSchema.safeParse({
      name: "Küche",
      slug: "kueche",
      icon: null,
      sortOrder: 0,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects uppercase slug", () => {
    const parsed = adminConsumerCategoryCreateSchema.safeParse({
      name: "X",
      slug: "NotKebab",
      icon: null,
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("adminConsumerCategoryUpdateSchema", () => {
  it("requires id", () => {
    const parsed = adminConsumerCategoryUpdateSchema.safeParse({
      name: "X",
      slug: "x",
      icon: null,
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("adminConsumerDeviceCreateSchema", () => {
  const base = {
    name: "Kühlbox",
    categoryId: UUID,
    icon: null,
    defaultPower: 50,
    defaultVoltage: "12V",
    defaultHoursPerDay: 2,
    stepHours: 0.5,
    showHoursField: true,
    showFixedOption: false,
    isCooling: false,
    keywords: [],
    sortOrder: 0,
    isActive: true,
    isFeatured: false,
    averageLoadPercent: null,
  };

  it("accepts valid data", () => {
    expect(adminConsumerDeviceCreateSchema.safeParse(base).success).toBe(true);
  });

  it("rejects defaultPower <= 0", () => {
    const parsed = adminConsumerDeviceCreateSchema.safeParse({ ...base, defaultPower: 0 });
    expect(parsed.success).toBe(false);
  });

  it("rejects negative defaultHoursPerDay", () => {
    const parsed = adminConsumerDeviceCreateSchema.safeParse({ ...base, defaultHoursPerDay: -1 });
    expect(parsed.success).toBe(false);
  });

  it("rejects zero stepHours", () => {
    const parsed = adminConsumerDeviceCreateSchema.safeParse({ ...base, stepHours: 0 });
    expect(parsed.success).toBe(false);
  });

  it("accepts averageLoadPercent between 1 and 100", () => {
    expect(
      adminConsumerDeviceCreateSchema.safeParse({ ...base, averageLoadPercent: 33 }).success,
    ).toBe(true);
  });

  it("rejects averageLoadPercent outside 1..100", () => {
    expect(
      adminConsumerDeviceCreateSchema.safeParse({ ...base, averageLoadPercent: 0 }).success,
    ).toBe(false);
    expect(
      adminConsumerDeviceCreateSchema.safeParse({ ...base, averageLoadPercent: 101 }).success,
    ).toBe(false);
  });
});

describe("adminConsumerDeviceUpdateSchema", () => {
  it("requires id", () => {
    const parsed = adminConsumerDeviceUpdateSchema.safeParse({
      name: "X",
      categoryId: UUID,
      icon: null,
      defaultPower: 50,
      defaultVoltage: "12V",
      defaultHoursPerDay: 2,
      stepHours: 0.5,
      showHoursField: true,
      showFixedOption: false,
      isCooling: false,
      keywords: [],
      sortOrder: 0,
      isActive: true,
      isFeatured: false,
      averageLoadPercent: null,
    });
    expect(parsed.success).toBe(false);
  });
});
