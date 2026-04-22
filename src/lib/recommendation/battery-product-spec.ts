import { readPositiveNumberFilter } from "@/lib/recommendation/wiring/filter-values";

import type { ProductRecommendationRow } from "./types";

/** Nominale Bordspannung aus Nenn- oder Katalog-Angabe (V). */
const VOLTAGE_FILTER_KEYS = [
  "voltageV",
  "nennspannungV",
  "nennspannung",
  "nominalVoltageV",
  "systemVoltageV",
  "nominalVoltage",
  "spannung",
] as const;

const BMS_DISCHARGE_KEYS = [
  "bmsDischargeA",
  "bmsMaxDischargeA",
  "bmsMaxContinuousA",
  "bmsContinuousA",
  "bmsContinousA",
  "bmsA",
  "bms_a",
  "bmsDauerA",
] as const;

/**
 * Sichtbar gemachte Nennspannung (Spalte oder Kategoriefilter), für Abgleich mit
 * `AlgorithmOutput.battery.voltage` (12/24/48 V).
 */
export function effectiveBatteryVoltageV(row: ProductRecommendationRow): number | null {
  if (row.voltageV != null && row.voltageV > 0) return row.voltageV;
  return readPositiveNumberFilter(row.filterValues, VOLTAGE_FILTER_KEYS);
}

/**
 * Typische 12.8/25.6-V-Nennungen auf 12/24/48 V-Bus zuordnen.
 * Gibt `null` zurück, wenn kein sinnvoller Bucket erkannt wird (kein harter Ausschluss).
 */
export function nominalSystemVoltageFromCellVoltage(v: number): 12 | 24 | 48 | null {
  if (!Number.isFinite(v) || v <= 0) return null;
  if (v < 19) return 12;
  if (v < 40) return 24;
  return 48;
}

/**
 * BMS-Maximal-Entladestrom (A) aus `filterValues`, sofern gepflegt.
 */
export function bmsDischargeAFromRow(row: ProductRecommendationRow): number | null {
  return readPositiveNumberFilter(row.filterValues, BMS_DISCHARGE_KEYS);
}

export function productNominalSystemVoltageV(row: ProductRecommendationRow): 12 | 24 | 48 | null {
  const e = effectiveBatteryVoltageV(row);
  if (e == null) return null;
  return nominalSystemVoltageFromCellVoltage(e);
}
