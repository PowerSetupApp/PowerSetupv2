import { describe, expect, it } from "vitest";

import type { AmazonExtractedProduct } from "@/lib/amazon/extractor";
import type { AmazonItem } from "@/lib/amazon/types";
import { buildRecommendationScalars, mapAmazonExtractionToImportPayload } from "@/lib/amazon/map-to-product-create";
import type { AdminCategoryFilterEditorRow } from "@/lib/db/queries/admin-catalog-read";

describe("buildRecommendationScalars", () => {
  it("prefers inverter continuous watts from outputPowerW", () => {
    const extracted: AmazonExtractedProduct = {
      name: "Inv",
      description: null,
      price: null,
      brandName: null,
      powerW: 500,
      capacityAh: null,
      voltageV: 12,
      batteryType: null,
      currentA: null,
      crossSectionMm2: null,
      solarWp: null,
      supportedVoltages: null,
      maxDischargeA: null,
      maxChargeA: null,
      waveform: null,
      fuseType: null,
      triggerType: null,
      color: null,
      dimensions_length: null,
      dimensions_width: null,
      weight: null,
      specs: "",
      cellType: null,
      constructionType: null,
      maxInputVoltageV: null,
      hasBluetooth: null,
      outputPowerW: 2000,
      peakPowerW: 4000,
      maxChargeCurrent: null,
      inputVolts: null,
      outputVolts: null,
    };
    const s = buildRecommendationScalars(extracted);
    expect(s.powerW).toBe(2000);
    expect(s.solarWp).toBe(null);
  });
});

describe("mapAmazonExtractionToImportPayload", () => {
  const batteryFilters: AdminCategoryFilterEditorRow[] = [
    { id: "1", key: "brand", name: "Marke", type: "brand", unit: null, options: [], sortOrder: 0 },
    {
      id: "2",
      key: "capacityAh",
      name: "Kapazität",
      type: "number",
      unit: "Ah",
      options: [],
      sortOrder: 1,
    },
    {
      id: "3",
      key: "voltageV",
      name: "Spannung",
      type: "select",
      unit: "V",
      options: ["12V", "24V", "48V"],
      sortOrder: 2,
    },
    {
      id: "4",
      key: "batteryType",
      name: "Typ",
      type: "select",
      unit: null,
      options: ["LiFePo4", "AGM", "GEL"],
      sortOrder: 3,
    },
  ];

  const amazonItem: AmazonItem = {
    asin: "B09TEST123",
    detailPageUrl: "https://www.amazon.de/dp/B09TEST123",
    itemInfo: { title: { displayValue: "Test Battery" } },
  };

  it("maps brand and battery filters", () => {
    const extracted: AmazonExtractedProduct = {
      name: "LiFePO4 200Ah",
      description: "desc",
      price: 100,
      brandName: "LIONTRON",
      powerW: null,
      capacityAh: 200,
      voltageV: 12,
      batteryType: "lifepo4",
      currentA: null,
      crossSectionMm2: null,
      solarWp: null,
      supportedVoltages: null,
      maxDischargeA: 150,
      maxChargeA: 50,
      waveform: null,
      fuseType: null,
      triggerType: null,
      color: null,
      dimensions_length: null,
      dimensions_width: null,
      weight: null,
      specs: "### Spec\n- A: 1",
      cellType: null,
      constructionType: null,
      maxInputVoltageV: null,
      hasBluetooth: null,
      outputPowerW: null,
      peakPowerW: null,
      maxChargeCurrent: null,
      inputVolts: null,
      outputVolts: null,
    };
    const brands = [
      { id: "brand-1", name: "LIONTRON" },
      { id: "brand-2", name: "Other" },
    ];
    const out = mapAmazonExtractionToImportPayload(extracted, amazonItem, batteryFilters, brands);
    expect(out.brandId).toBe("brand-1");
    expect(out.suggestedBrandName).toBe(null);
    expect(out.filterValues.brand).toBe("brand-1");
    expect(out.filterValues.capacityAh).toBe(200);
    expect(out.filterValues.voltageV).toBe("12V");
    expect(out.filterValues.batteryType).toBe("LiFePo4");
    expect(out.scalars.capacityAh).toBe(200);
    expect(out.scalars.batteryType).toBe("lifepo4");
    expect(out.asin).toBe("B09TEST123");
  });
});
