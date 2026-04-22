import { describe, expect, it } from "vitest";

import {
  REDACTED_SECRET_PLACEHOLDER,
  buildExportEnvelope,
  collectMissingConsumerDeviceCategories,
  collectMissingProductReferences,
  filterSystemSettingsForImport,
  parseAlgorithmSettingsImport,
  parseImportItemsArray,
  parseProductsImport,
  redactSystemSettingsForExport,
  validateCategoryFiltersBelongToCategory,
} from "./admin-catalog-json";
import * as z from "zod";

describe("admin-catalog-json", () => {
  it("parseImportItemsArray accepts raw array", () => {
    const schema = z.object({ id: z.string().uuid(), name: z.string() });
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const out = parseImportItemsArray([{ id, name: "x" }], schema);
    expect(out).toEqual([{ id, name: "x" }]);
  });

  it("parseImportItemsArray accepts envelope with items", () => {
    const schema = z.object({ id: z.string().uuid() });
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const out = parseImportItemsArray({ exportVersion: 1, exportedAt: "x", items: [{ id }] }, schema);
    expect(out).toEqual([{ id }]);
  });

  it("parseImportItemsArray rejects invalid shape", () => {
    expect(() => parseImportItemsArray({ foo: 1 }, z.string())).toThrow();
  });

  it("redactSystemSettingsForExport masks API keys", () => {
    const rows = [
      { key: "ai_model", value: "gpt-4o", updatedAt: new Date("2026-01-01") },
      { key: "openai_api_key", value: "secret", updatedAt: new Date("2026-01-01") },
    ];
    const out = redactSystemSettingsForExport(rows, false);
    expect(out[0]?.value).toBe("gpt-4o");
    expect(out[1]?.value).toBe(REDACTED_SECRET_PLACEHOLDER);
  });

  it("filterSystemSettingsForImport drops redacted rows", () => {
    const rows = [
      { key: "openai_api_key", value: REDACTED_SECRET_PLACEHOLDER, updatedAt: new Date() },
      { key: "ai_model", value: "x", updatedAt: new Date() },
    ];
    const out = filterSystemSettingsForImport(rows);
    expect(out.map((r) => r.key)).toEqual(["ai_model"]);
  });

  it("collectMissingProductReferences lists unknown FKs", () => {
    const cat = "550e8400-e29b-41d4-a716-446655440001";
    const brand = "550e8400-e29b-41d4-a716-446655440002";
    const products = parseProductsImport([
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        name: "P",
        categoryId: cat,
        brandId: brand,
        specVersion: 1,
        specs: "",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    const refs = collectMissingProductReferences(products, new Set(), new Set());
    expect(refs.missingCategories).toEqual([cat]);
    expect(refs.missingBrands).toEqual([brand]);
  });

  it("collectMissingConsumerDeviceCategories", () => {
    const cid = "550e8400-e29b-41d4-a716-446655440099";
    const devices = [
      {
        id: "550e8400-e29b-41d4-a716-446655440011",
        name: "D",
        defaultPower: 1,
        defaultVoltage: "12V",
        defaultHoursPerDay: 1,
        stepHours: 0.5,
        showHoursField: true,
        showFixedOption: false,
        isCooling: false,
        keywords: [],
        sortOrder: 0,
        isActive: true,
        isFeatured: false,
        categoryId: cid,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const missing = collectMissingConsumerDeviceCategories(devices as never, new Set());
    expect(missing).toEqual([cid]);
  });

  it("validateCategoryFiltersBelongToCategory catches mismatch", () => {
    const wrong = "550e8400-e29b-41d4-a716-446655440020";
    const err = validateCategoryFiltersBelongToCategory([
      {
        id: "550e8400-e29b-41d4-a716-446655440030",
        name: "C",
        slug: "c",
        sortOrder: 0,
        filters: [
          {
            id: "550e8400-e29b-41d4-a716-446655440040",
            categoryId: wrong,
            name: "F",
            key: "k",
            type: "text",
            options: [],
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ]);
    expect(err).toContain("categoryId");
  });

  it("parseAlgorithmSettingsImport reads v2 object and maps legacy DoD", () => {
    const row = {
      id: "default",
      dodLifepo4: 0.95,
      dodAgm: 0.5,
      dodGel: 0.5,
      batterySafetyFactor: 1.25,
      inverterClasses: "500",
      chargerClasses: "10",
      solarControllerClasses: "10",
      cableSizes: "6",
      voltageDropCritical: 1,
      voltageDropNormal: 3,
      copperResistivity: 0.0178,
      minPreselectionScore: 30,
      productSelectionMode: "algorithm",
      reasonGenerationMode: "algorithm",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const parsed = parseAlgorithmSettingsImport(row) as Record<string, unknown>;
    expect(parsed.id).toBe("default");
    expect(parsed.minPreselectionScore).toBe(30);
    expect(parsed.dodDefaults).toEqual({ lifepo4: 0.95, agm: 0.5, gel: 0.5 });
  });

  it("buildExportEnvelope sets kind and exportVersion", () => {
    const env = buildExportEnvelope("products", []);
    expect(env.exportVersion).toBe(1);
    expect(env.kind).toBe("products");
    expect(Array.isArray(env.items)).toBe(true);
  });
});
