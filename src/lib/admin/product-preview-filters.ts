/** Shape aligned with Prisma `CategoryFilter` fields used for admin preview. */
export type ProductPreviewCategoryFilter = {
  key: string;
  name: string;
  type: string;
  unit: string | null;
  sortOrder: number;
};

/** Eine Zeile in der Admin-Vorschau; `origin` steuert Gruppierung und Styling. */
export type ProductPreviewFilterRow = {
  label: string;
  value: string;
  origin: "defined" | "extra";
};

/**
 * In `filterValues` oft redundant zu `Product.brandId` / Relation — nicht nochmal anzeigen.
 * Keys case-insensitive.
 */
const OMIT_PREVIEW_JSON_KEYS = new Set(["brand", "brandid", "marke"]);

/**
 * Technische JSON-Keys ohne `CategoryFilter`-Eintrag → lesbare deutsche Bezeichnungen
 * (keine DB-Spalte „Übersetzung“; orientiert an Prisma-Feldern / Import-Konventionen).
 */
const LEGACY_KEY_LABELS_DE: Record<string, string> = {
  length: "Länge",
  width: "Breite",
  height: "Höhe",
  weight: "Gewicht",
  voltageV: "Nennspannung",
  maxChargeA: "Max. Ladestrom",
  maxDischargeA: "Max. Entladestrom",
  batteryType: "Batterietyp",
  inputVoltage: "Eingangsspannung",
  outputVoltage: "Ausgangsspannung",
  powerW: "Leistung",
  capacityAh: "Kapazität (Ah)",
  currentA: "Strom",
  crossSectionMm2: "Querschnitt",
  solarWp: "Solar-Leistung",
  supportedVoltages: "Unterstützte Spannungen",
  waveform: "Wellenform",
  fuseType: "Sicherungstyp",
  slots: "Anzahl Steckplätze",
  fuse: "Fassung",
};

function omitPreviewKeys(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([k]) => !OMIT_PREVIEW_JSON_KEYS.has(k.toLowerCase())),
  );
}

function labelForExtraKey(key: string): string {
  return LEGACY_KEY_LABELS_DE[key] ?? `Zusatzfeld „${key}“`;
}

function formatFilterScalar(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((v) => formatFilterScalar(v)).join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function withUnit(display: string, unit: string | null | undefined): string {
  const u = unit?.trim();
  if (!u) return display;
  return `${display} (${u})`;
}

function asFilterValuesRecord(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

/**
 * Builds rows for the admin product preview dialog.
 * - Respects `CategoryFilter` order and German `name` labels.
 * - Drops redundant brand keys (shown separately from Prisma relation).
 * - Extra JSON keys get German labels where known, else „Zusatzfeld „key““.
 */
export function buildProductPreviewFilterRows(
  filterValues: unknown,
  categoryFilters: ProductPreviewCategoryFilter[],
): ProductPreviewFilterRow[] {
  const rawRecord = asFilterValuesRecord(filterValues);
  if (!rawRecord) return [];

  const record = omitPreviewKeys(rawRecord);
  const sorted = [...categoryFilters].sort((a, b) => a.sortOrder - b.sortOrder);
  const consumed = new Set<string>();
  const rows: ProductPreviewFilterRow[] = [];

  for (const f of sorted) {
    if (!Object.prototype.hasOwnProperty.call(record, f.key)) continue;
    consumed.add(f.key);
    const val = record[f.key];
    rows.push({
      label: f.name,
      value: withUnit(formatFilterScalar(val), f.unit),
      origin: "defined",
    });
  }

  for (const key of Object.keys(record)) {
    if (consumed.has(key)) continue;
    rows.push({
      label: labelForExtraKey(key),
      value: formatFilterScalar(record[key]),
      origin: "extra",
    });
  }

  return rows;
}
