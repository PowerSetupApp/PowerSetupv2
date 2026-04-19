import type { AlgorithmOutput } from "@/lib/algorithm/types";
import type {
  PrefilterResult,
  ProductRecommendationRow,
  RecommendationBucket,
  ScoredProduct,
} from "@/lib/recommendation/types";

/** Kennzahlen aus `calculate()`, an denen der Produkt-Prefilter ausrichtet. */
export type AlgorithmRecommendationTargets = {
  battery: {
    recommendedCapacityAh: number;
    voltage: number;
    type: string;
  };
  solar: {
    needed: boolean;
    requiredWp: number;
    maxRoofWp: number;
    portableWp: number;
  };
  inverter: {
    needed: boolean;
    recommendedW: number;
    peakLoadW: number;
  };
  controller: {
    needed: boolean;
    currentA: number;
    type: string;
  };
  charger: {
    needed: boolean;
    recommendedCurrentA: number;
  };
  booster: {
    needed: boolean;
    outputCurrentA: number;
  };
  cable: {
    routes: number;
    maxRecommendedCrossSectionMm2: number;
  };
};

export type EnrichedPrefilterProduct = ScoredProduct & {
  capacityAh: number | null;
  voltageV: number | null;
  solarWp: number | null;
  powerW: number | null;
  currentA: number | null;
  crossSectionMm2: number | null;
  batteryType: string | null;
  waveform: string | null;
  categoryName: string | null;
};

export type AlgorithmTestRecommendationBucketRow = {
  bucket: RecommendationBucket;
  labelDe: string;
  items: EnrichedPrefilterProduct[];
};

/** Rückgabe von `runAlgorithmTestAction` für die Admin-UI. */
export type AlgorithmTestRecommendationPreviewPayload = {
  /** `false`, wenn der Produktkatalog nicht geladen werden konnte. */
  catalogOk: boolean;
  targets: AlgorithmRecommendationTargets;
  buckets: AlgorithmTestRecommendationBucketRow[];
};

const BUCKET_ORDER: RecommendationBucket[] = ["battery", "solar", "inverter", "controller", "cable", "other"];

const BUCKET_LABEL_DE: Record<RecommendationBucket, string> = {
  battery: "Batterie",
  solar: "Solar / Module",
  inverter: "Wechselrichter",
  controller: "Solarladeregler",
  cable: "Kabel",
  other: "Sonstiges (z. B. Lader, Booster, …)",
};

export function buildRecommendationTargets(output: AlgorithmOutput): AlgorithmRecommendationTargets {
  const maxCable = output.cables.length
    ? Math.max(...output.cables.map((c) => c.recommendedCrossSection))
    : 0;
  return {
    battery: {
      recommendedCapacityAh: output.battery.recommendedCapacityAh,
      voltage: output.battery.voltage,
      type: output.battery.type,
    },
    solar: {
      needed: output.solar.needed,
      requiredWp: output.solar.requiredWp,
      maxRoofWp: output.solar.maxRoofWp,
      portableWp: output.solar.portableWp,
    },
    inverter: {
      needed: output.inverter.needed,
      recommendedW: output.inverter.recommendedW,
      peakLoadW: output.inverter.peakLoadW,
    },
    controller: {
      needed: output.controller.needed,
      currentA: output.controller.currentA,
      type: output.controller.type,
    },
    charger: {
      needed: output.charger.needed,
      recommendedCurrentA: output.charger.recommendedCurrentA,
    },
    booster: {
      needed: output.booster.needed,
      outputCurrentA: output.booster.outputCurrentA,
    },
    cable: {
      routes: output.cables.length,
      maxRecommendedCrossSectionMm2: maxCable,
    },
  };
}

export function enrichPrefilterForAdmin(
  prefilter: PrefilterResult,
  productById: Map<string, ProductRecommendationRow>,
): AlgorithmTestRecommendationBucketRow[] {
  return BUCKET_ORDER.map((bucket) => {
    const items: EnrichedPrefilterProduct[] = prefilter[bucket].map((sp) => {
      const p = productById.get(sp.productId);
      return {
        ...sp,
        capacityAh: p?.capacityAh ?? null,
        voltageV: p?.voltageV ?? null,
        solarWp: p?.solarWp ?? null,
        powerW: p?.powerW ?? null,
        currentA: p?.currentA ?? null,
        crossSectionMm2: p?.crossSectionMm2 ?? null,
        batteryType: p?.batteryType ?? null,
        waveform: p?.waveform ?? null,
        categoryName: p?.categoryName ?? null,
      };
    });
    return { bucket, labelDe: BUCKET_LABEL_DE[bucket], items };
  });
}
