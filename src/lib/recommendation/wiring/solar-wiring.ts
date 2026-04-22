import {
  ambientTempDerateFactor,
  continuousAmpacityAForStandardMm2,
} from "@/lib/algorithm/cable-ampacity";
import { SOLAR_CABLE_PORTABLE_MM2, SOLAR_CABLE_ROOF_MM2 } from "@/lib/algorithm/constants";
import type { AlgorithmTuning } from "@/lib/algorithm/algorithm-tuning";
import type { AlgorithmOutput } from "@/lib/algorithm/types";
import type {
  AISelectionItem,
  PrefilterResult,
  ProductRecommendationRow,
} from "@/lib/recommendation/types";

import { readPositiveNumberFilter } from "./filter-values";
import type { SolarWiringRationale, SolarWiringRecommendation, SolarWiringWarning } from "./types";

const VOC_KEYS = [
  "Voc",
  "voc",
  "Uoc",
  "U_oc",
  "openCircuitVoltageV",
  "Leerlaufspannung",
  "leerlaufspannung_V",
] as const;

const VMPP_KEYS = [
  "Vmpp",
  "vmpp",
  "Umpp",
  "U_mpp",
  "mppVoltageV",
  "Spannung(V)",
  "spannungV",
  "voltageV",
] as const;

const IMPP_KEYS = ["Impp", "impp", "mppCurrentA", "I_mpp"] as const;

const MPPT_MAX_V_KEYS = [
  "maxPvInputVoltageV",
  "maxPvVoltageV",
  "pvMaxVoltageV",
  "maxOpenCircuitVoltagePv",
  "Max PV Spannung",
  "maxPVSpannung",
  "max_pv_voltage",
  "maxPvV",
] as const;

function wiringDescription(seriesCount: number, parallelCount: number): string {
  if (seriesCount <= 0 || parallelCount <= 0) return "—";
  if (seriesCount === 1 && parallelCount === 1) return "1 Modul (ein Strang)";
  const s = `${seriesCount} Module in Reihe`;
  const p =
    parallelCount === 1
      ? "ein Strang"
      : `${parallelCount} Stränge parallel`;
  return `${s} · ${p}`;
}

function rationaleFor(seriesCount: number, parallelCount: number, moduleCount: number): SolarWiringRationale {
  if (seriesCount === moduleCount && parallelCount === 1) return "alle-reihe";
  if (parallelCount === moduleCount && seriesCount === 1) return "alle-parallel";
  return "mischung";
}

function nextSuggestedModuleCount(n: number): number {
  if (n < 1) return 1;
  return n % 2 === 1 ? n + 1 : n + 2;
}

export function computeSolarWiring(params: {
  moduleCount: number;
  moduleRow: ProductRecommendationRow | null;
  controllerRow: ProductRecommendationRow | null;
  /** Nur Dach-Array: Portable-only bleibt ohne Verschaltungshinweis. */
  calculations: AlgorithmOutput;
  tuning: AlgorithmTuning;
}): SolarWiringRecommendation | null {
  const { moduleCount, moduleRow, controllerRow, calculations, tuning } = params;
  const roof = calculations.solar.maxRoofWp > 0;
  if (!roof || !calculations.solar.needed || !calculations.controller.needed) return null;
  if (moduleCount < 1 || !moduleRow || !controllerRow) return null;

  const fvM = moduleRow.filterValues;
  const fvC = controllerRow.filterValues;

  const Voc = readPositiveNumberFilter(fvM, VOC_KEYS);
  const Vmpp = readPositiveNumberFilter(fvM, VMPP_KEYS);
  const Impp = readPositiveNumberFilter(fvM, IMPP_KEYS);
  const Vmax = readPositiveNumberFilter(fvC, MPPT_MAX_V_KEYS);

  if (Voc == null || Vmpp == null || Vmax == null) return null;

  const mult = tuning.vocColdMultiplier > 0 ? tuning.vocColdMultiplier : 1.2;
  const VocCold = Voc * mult;
  const N_series_max = Math.floor(Vmax / VocCold);
  const warnings: SolarWiringWarning[] = [];

  if (N_series_max < 1) {
    return {
      seriesCount: 0,
      parallelCount: 0,
      totalModules: moduleCount,
      arrayVoltageVmppV: 0,
      arrayVoltageVocColdV: VocCold,
      arrayCurrentImppA: 0,
      mpptMaxInputV: Vmax,
      rationale: "kein-feasible",
      warnings: [{ kind: "mppt-voltage-exceeded", required: VocCold, available: Vmax }],
      description: "Keine zulässige Verschaltung — MPPT max. PV-Spannung zu niedrig für selbst ein Modul (Kälte-Voc).",
    };
  }

  const N = moduleCount;

  if (N === 1) {
    return {
      seriesCount: 1,
      parallelCount: 1,
      totalModules: 1,
      arrayVoltageVmppV: Vmpp,
      arrayVoltageVocColdV: VocCold,
      arrayCurrentImppA: Impp ?? 0,
      mpptMaxInputV: Vmax,
      rationale: "alle-reihe",
      warnings: [],
      description: wiringDescription(1, 1),
    };
  }

  const candidates: [number, number][] = [];
  for (let s = 1; s <= N_series_max; s++) {
    if (N % s !== 0) continue;
    const p = N / s;
    candidates.push([s, p]);
  }

  candidates.sort((a, b) => {
    if (b[0] !== a[0]) return b[0] - a[0];
    return a[1] - b[1];
  });

  const [bestS, bestP] = candidates[0]!;
  const rationale: SolarWiringRationale = rationaleFor(bestS, bestP, N);
  if (bestS === 1 && bestP === N && N > 1 && N_series_max === 1) {
    warnings.push({ kind: "module-count-not-divisible", suggested: nextSuggestedModuleCount(N) });
  }

  const moduleWp = moduleRow.solarWp ?? 0;
  const imppEff = Impp ?? (moduleWp > 0 && Vmpp > 0 ? moduleWp / Vmpp : 0);
  const iParallel = imppEff * bestP;

  const cableMm2 = roof ? SOLAR_CABLE_ROOF_MM2 : SOLAR_CABLE_PORTABLE_MM2;
  const derate = ambientTempDerateFactor(tuning.ambientTempC);
  const ampLimit = continuousAmpacityAForStandardMm2(
    cableMm2,
    tuning.cableAmpacityInstallMode,
    derate,
  );
  if (ampLimit > 0 && iParallel * tuning.cableCurrentSafetyFactor > ampLimit) {
    warnings.push({ kind: "parallel-current-high", currentA: iParallel, cableMm2 });
  }

  return {
    seriesCount: bestS,
    parallelCount: bestP,
    totalModules: bestS * bestP,
    arrayVoltageVmppV: Vmpp * bestS,
    arrayVoltageVocColdV: VocCold * bestS,
    arrayCurrentImppA: iParallel,
    mpptMaxInputV: Vmax,
    rationale,
    warnings,
    description: wiringDescription(bestS, bestP),
  };
}

function finalProductId(
  selections: AISelectionItem[] | null | undefined,
  bucket: "solar" | "controller",
  prefilterTopId: string | undefined,
): string | null {
  if (selections?.length) {
    const hit = selections.find((s) => s.bucket === bucket);
    if (hit?.productId) return hit.productId;
  }
  return prefilterTopId ?? null;
}

function rowById(
  id: string | null,
  products: ProductRecommendationRow[],
): ProductRecommendationRow | null {
  if (!id) return null;
  return products.find((p) => p.id === id) ?? null;
}

/** Finale Produkt-IDs (KI oder Prefilter-Top-1) → Verschaltung / MPPT-Check. */
export function buildSolarWiringRecommendation(params: {
  calculations: AlgorithmOutput;
  prefilter: PrefilterResult;
  aiSelections: AISelectionItem[] | null | undefined;
  products: ProductRecommendationRow[];
  tuning: AlgorithmTuning;
}): SolarWiringRecommendation | null {
  const { calculations, prefilter, aiSelections, products, tuning } = params;
  const solarId = finalProductId(aiSelections, "solar", prefilter.solar[0]?.productId);
  const ctrlId = finalProductId(aiSelections, "controller", prefilter.controller[0]?.productId);
  const moduleRow = rowById(solarId, products);
  const controllerRow = rowById(ctrlId, products);
  const moduleWp = moduleRow?.solarWp;
  if (!moduleWp || moduleWp <= 0) return null;
  const req = Math.max(calculations.solar.requiredWp, 1);
  const moduleCount = Math.ceil(req / moduleWp);
  return computeSolarWiring({
    moduleCount,
    moduleRow,
    controllerRow,
    calculations,
    tuning,
  });
}
