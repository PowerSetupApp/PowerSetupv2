import { describe, expect, it } from "vitest";

import type { AmazonExtractedProduct } from "@/lib/amazon/extractor";
import { applyTechnicalDetailNumericInference } from "@/lib/amazon/infer-from-item";
import type { AmazonItem } from "@/lib/amazon/types";

function baseExtracted(over: Partial<AmazonExtractedProduct> = {}): AmazonExtractedProduct {
  return {
    name: "T",
    description: null,
    price: null,
    brandName: null,
    powerW: null,
    capacityAh: null,
    voltageV: null,
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
    outputPowerW: null,
    peakPowerW: null,
    maxChargeCurrent: null,
    inputVolts: null,
    outputVolts: null,
    ...over,
  };
}

describe("applyTechnicalDetailNumericInference", () => {
  it("fills maxDischargeA from Amazon.de Stromstärke row (B0DB7VBZ7J layout)", () => {
    const item: AmazonItem = {
      asin: "B0DB7VBZ7J",
      itemInfo: {
        technicalInfo: {
          technicalDetails: [
            { name: "Batterie-Spannung", value: "12,8 Volt" },
            { name: "Stromstärke", value: "140 Ampere" },
            { name: "Batteriekapazität", value: "280 Amperestunden" },
          ],
        },
      },
    };
    const out = applyTechnicalDetailNumericInference(baseExtracted(), item);
    expect(out.maxDischargeA).toBe(140);
  });

  it("does not override existing maxDischargeA", () => {
    const item: AmazonItem = {
      asin: "B0DB7VBZ7J",
      itemInfo: {
        technicalInfo: {
          technicalDetails: [{ name: "Stromstärke", value: "140 Ampere" }],
        },
      },
    };
    const out = applyTechnicalDetailNumericInference(baseExtracted({ maxDischargeA: 99 }), item);
    expect(out.maxDischargeA).toBe(99);
  });
});
