import * as z from "zod";

export const ADMIN_EXPORT_DOMAINS = [
  "products",
  "brands",
  "brand-filter-categories",
  "categories",
  "consumer-categories",
  "consumer-devices",
  "system-settings",
  "algorithm-settings",
  "model-pricing",
  "prompt-versions",
] as const;

export type AdminExportDomain = (typeof ADMIN_EXPORT_DOMAINS)[number];

export function isAdminExportDomain(s: string): s is AdminExportDomain {
  return (ADMIN_EXPORT_DOMAINS as readonly string[]).includes(s);
}

/** API-Keys und andere Geheimnisse — Export standardmäßig maskieren. */
export const REDACTED_SECRET_PLACEHOLDER = "[REDACTED]";
export const SECRET_SYSTEM_SETTING_KEYS = new Set(["gemini_api_key", "openai_api_key"]);

const categoryFilterSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string(),
  key: z.string(),
  type: z.string(),
  unit: z.string().nullable().optional(),
  options: z.array(z.string()).default([]),
  sortOrder: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const categoryWithFiltersSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().int(),
  filters: z.array(categoryFilterSchema).default([]),
});

const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  affiliateUrl: z.string().nullable().optional(),
  asin: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  categoryId: z.string().uuid(),
  specVersion: z.number().int(),
  specs: z.string(),
  powerW: z.number().int().nullable().optional(),
  capacityAh: z.number().int().nullable().optional(),
  voltageV: z.number().int().nullable().optional(),
  batteryType: z.string().nullable().optional(),
  currentA: z.number().int().nullable().optional(),
  crossSectionMm2: z.number().nullable().optional(),
  solarWp: z.number().int().nullable().optional(),
  supportedVoltages: z.unknown().nullable().optional(),
  maxDischargeA: z.number().int().nullable().optional(),
  waveform: z.string().nullable().optional(),
  fuseType: z.string().nullable().optional(),
  filterValues: z.unknown().nullable().optional(),
  isActive: z.boolean(),
  brandId: z.string().uuid().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const brandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  showInPreferences: z.boolean(),
  types: z.array(z.string()).default([]),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const brandFilterCategorySchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  label: z.string(),
  categorySlugs: z.array(z.string()).default([]),
  sortOrder: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const consumerCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().int(),
});

const consumerDeviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  i18nKey: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  defaultPower: z.number().int(),
  defaultVoltage: z.string(),
  defaultHoursPerDay: z.number(),
  stepHours: z.number(),
  showHoursField: z.boolean(),
  showFixedOption: z.boolean(),
  isCooling: z.boolean(),
  keywords: z.array(z.string()).default([]),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  categoryId: z.string().uuid(),
  averageLoadPercent: z.number().int().min(1).max(100).nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const systemSettingRowSchema = z.object({
  key: z.string(),
  value: z.string(),
  updatedAt: z.coerce.date(),
});

const modelPricingRowSchema = z.object({
  id: z.string().uuid(),
  modelId: z.string(),
  displayName: z.string().nullable().optional(),
  provider: z.string(),
  inputPrice: z.number(),
  outputPrice: z.number(),
  updatedAt: z.coerce.date(),
});

const promptVersionSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int(),
  systemPrompt: z.string(),
  userPromptTemplate: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/** Nur Prisma-Spalten von `AlgorithmSettings` (v2) — plus `id`. */
const ALGORITHM_SETTINGS_ALLOWED_KEYS = new Set([
  "id",
  "maxAutarchyDays",
  "pshTable",
  "solarBagAlignmentUplift",
  "driveHoursPerDay",
  "dodDefaults",
  "roundtripDefaults",
  "cRateChargeMax",
  "absorptionTailH",
  "chargerTargetCRate",
  "shoreBridgeReliefDays",
  "alternatorBridgeStandingCredit",
  "topUpCoverageStandingCapMult",
  "peakFactor",
  "batterySafetyFactor",
  "autarchyPshDerate",
  "autarchyMaxBridgeDays",
  "hardBridgeDays",
  "topUpCoverageCap",
  "topUpCoverageCapAtLowPsh",
  "topUpCoveragePshBandHigh",
  "topUpCoveragePshBandLow",
  "topUpCoveragePortableWeight",
  "topUpCoveragePortableCapBump",
  "topUpCoverageAbsMax",
  "shoreBatteryReliefAutarchyThresholdDays",
  "inverterEfficiency",
  "inverterStandbyW",
  "inverterStandbyHours",
  "alternatorContinuousLimitA",
  "boosterEfficiency",
  "chargerEfficiency",
  "solarSystemEfficiency",
  "wpPerM2Rigid",
  "wpPerM2Flexible",
  "roofUtilizationFactor",
  "solarBagUtilization",
  "voltageDropCritical",
  "voltageDropNormal",
  "copperResistivity",
  "inverterClasses",
  "chargerClasses",
  "solarControllerClasses",
  "cableSizes",
  "minPreselectionScore",
  "productSelectionMode",
  "reasonGenerationMode",
  "createdAt",
  "updatedAt",
]);

export function normalizeAlgorithmSettingsImportRow(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of ALGORITHM_SETTINGS_ALLOWED_KEYS) {
    if (key in raw && raw[key] !== undefined) out[key] = raw[key];
  }
  out.id = typeof raw.id === "string" ? raw.id : "default";

  if (out.dodDefaults === undefined && typeof raw.dodLifepo4 === "number") {
    out.dodDefaults = {
      lifepo4: raw.dodLifepo4,
      agm: typeof raw.dodAgm === "number" ? raw.dodAgm : 0.5,
      gel: typeof raw.dodGel === "number" ? raw.dodGel : 0.5,
    };
  }

  if (
    out.peakFactor === undefined &&
    typeof raw.simultaneousLow === "number" &&
    raw.simultaneousLow >= 1 &&
    typeof raw.simultaneousModerate === "number" &&
    raw.simultaneousModerate >= 1 &&
    typeof raw.simultaneousHigh === "number" &&
    raw.simultaneousHigh >= 1
  ) {
    out.peakFactor = {
      low: raw.simultaneousLow,
      moderate: raw.simultaneousModerate,
      high: raw.simultaneousHigh,
    };
  }

  return out;
}

/**
 * Nur Spalten, die es in `AlgorithmSettings` (v2) wirklich gibt.
 * Verhindert P2022, wenn z. B. ein alter Client oder JSON noch `dodLifepo4` mitschickt.
 */
export function pickAlgorithmSettingsDbFields(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of ALGORITHM_SETTINGS_ALLOWED_KEYS) {
    const v = row[key];
    if (v !== undefined && v !== null) {
      out[key] = v;
    }
  }
  return out;
}

const algorithmSettingsRowSchema = z
  .record(z.string(), z.unknown())
  .superRefine((val, ctx) => {
    if (typeof val.id !== "string") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "id (string) erforderlich", path: ["id"] });
    }
  })
  .transform((raw) => normalizeAlgorithmSettingsImportRow(raw));

export function buildExportEnvelope<T>(kind: AdminExportDomain, items: T[]) {
  return {
    exportVersion: 1 as const,
    exportedAt: new Date().toISOString(),
    kind,
    items,
  };
}

export function parseImportItemsArray<T>(raw: unknown, itemSchema: z.ZodType<T>): T[] {
  const asArray = z.array(z.unknown());
  const asObject = z.object({
    items: z.array(z.unknown()),
  });

  let list: unknown[];
  if (Array.isArray(raw)) {
    list = asArray.parse(raw);
  } else if (raw && typeof raw === "object" && "items" in raw) {
    list = asObject.parse(raw).items;
  } else {
    throw new z.ZodError([
      {
        code: "custom",
        message: "Erwarte JSON-Array oder Objekt mit `items`.",
        path: [],
      },
    ]);
  }

  return list.map((row, i) => {
    try {
      return itemSchema.parse(row);
    } catch (e) {
      if (e instanceof z.ZodError) {
        const err = new z.ZodError(e.issues.map((issue) => ({ ...issue, path: [i, ...issue.path] })));
        throw err;
      }
      throw e;
    }
  });
}

export function parseProductsImport(raw: unknown) {
  return parseImportItemsArray(raw, productSchema);
}

export function parseBrandsImport(raw: unknown) {
  return parseImportItemsArray(raw, brandSchema);
}

export function parseBrandFilterCategoriesImport(raw: unknown) {
  return parseImportItemsArray(raw, brandFilterCategorySchema);
}

export function parseCategoriesImport(raw: unknown) {
  return parseImportItemsArray(raw, categoryWithFiltersSchema);
}

export function parseConsumerCategoriesImport(raw: unknown) {
  return parseImportItemsArray(raw, consumerCategorySchema);
}

export function parseConsumerDevicesImport(raw: unknown) {
  return parseImportItemsArray(raw, consumerDeviceSchema);
}

export function parseSystemSettingsImport(raw: unknown) {
  return parseImportItemsArray(raw, systemSettingRowSchema);
}

export function parseModelPricingImport(raw: unknown) {
  return parseImportItemsArray(raw, modelPricingRowSchema);
}

export function parsePromptVersionsImport(raw: unknown) {
  return parseImportItemsArray(raw, promptVersionSchema);
}

export function parseAlgorithmSettingsImport(raw: unknown): z.infer<typeof algorithmSettingsRowSchema> {
  if (raw && typeof raw === "object" && "items" in raw === false && "id" in raw) {
    return algorithmSettingsRowSchema.parse(raw);
  }
  const obj = z
    .object({
      item: algorithmSettingsRowSchema,
    })
    .or(
      z.object({
        items: z.tuple([algorithmSettingsRowSchema]),
      }),
    )
    .parse(raw);
  if ("item" in obj) return obj.item;
  return obj.items[0];
}

export function redactSystemSettingsForExport(
  rows: { key: string; value: string; updatedAt: Date }[],
  includeSecrets: boolean,
) {
  if (includeSecrets) return rows;
  return rows.map((r) =>
    SECRET_SYSTEM_SETTING_KEYS.has(r.key) ? { ...r, value: REDACTED_SECRET_PLACEHOLDER } : r,
  );
}

export function filterSystemSettingsForImport(
  rows: { key: string; value: string; updatedAt: Date }[],
): { key: string; value: string; updatedAt: Date }[] {
  return rows.filter((r) => {
    if (r.value === REDACTED_SECRET_PLACEHOLDER) return false;
    if (SECRET_SYSTEM_SETTING_KEYS.has(r.key) && r.value.trim() === "") return false;
    return true;
  });
}

export type ParsedCategoryWithFilters = z.infer<typeof categoryWithFiltersSchema>;
export type ParsedProduct = z.infer<typeof productSchema>;

export function collectMissingProductReferences(
  products: ParsedProduct[],
  existingCategoryIds: Set<string>,
  existingBrandIds: Set<string>,
): { missingCategories: string[]; missingBrands: string[] } {
  const missingCategories = new Set<string>();
  const missingBrands = new Set<string>();
  for (const p of products) {
    if (!existingCategoryIds.has(p.categoryId)) missingCategories.add(p.categoryId);
    if (p.brandId && !existingBrandIds.has(p.brandId)) missingBrands.add(p.brandId);
  }
  return {
    missingCategories: [...missingCategories],
    missingBrands: [...missingBrands],
  };
}

export function collectMissingConsumerDeviceCategories(
  devices: z.infer<typeof consumerDeviceSchema>[],
  existingCategoryIds: Set<string>,
): string[] {
  const missing = new Set<string>();
  for (const d of devices) {
    if (!existingCategoryIds.has(d.categoryId)) missing.add(d.categoryId);
  }
  return [...missing];
}

export function validateCategoryFiltersBelongToCategory(categories: ParsedCategoryWithFilters[]): string | null {
  for (const c of categories) {
    for (const f of c.filters) {
      if (f.categoryId !== c.id) {
        return `Filter „${f.key}“ hat categoryId ${f.categoryId}, erwartet ${c.id}.`;
      }
    }
  }
  return null;
}
