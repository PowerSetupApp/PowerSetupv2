import type { AmazonItem } from "@/lib/amazon/types";

/** Portiert aus Legacy `mock-amazon-service.ts` — nur feste Test-ASINs. */
const MOCK_PRODUCTS: Record<string, AmazonItem> = {
  B075NQQRPD: {
    asin: "B075NQQRPD",
    detailPageUrl: "https://www.amazon.de/dp/B075NQQRPD",
    itemInfo: {
      title: {
        displayValue:
          "Victron SmartSolar MPPT Laderegler 75/15 Solarladeregler 12V 24V 15A Bluetooth integriert SCC075015060R",
      },
      byLineInfo: {
        brand: { displayValue: "Victron Energy" },
        manufacturer: { displayValue: "Victron Energy B.V." },
      },
      features: {
        displayValues: [
          "Integriertes Bluetooth Smart: Vollständige Kontrolle und Überwachung per Smartphone",
          "Ultraschnelles Maximum Power Point Tracking (MPPT) für maximalen Ertrag",
          "PV-Spannung bis 75V, Batterieladestrom bis 15A",
          "Für 12V und 24V Batteriesysteme geeignet (Auto-Erkennung)",
        ],
      },
      productInfo: {
        itemDimensions: {
          height: { displayValue: 10, unit: "cm" },
          length: { displayValue: 13, unit: "cm" },
          width: { displayValue: 4, unit: "cm" },
          weight: { displayValue: 0.5, unit: "kg" },
        },
      },
      technicalInfo: {
        technicalDetails: [
          { name: "Maximale PV-Leistung", value: "200W (12V) / 400W (24V)" },
          { name: "Maximaler Ladestrom", value: "15A" },
          { name: "Maximale PV-Spannung", value: "75V" },
          { name: "Nennspannung", value: "12V / 24V Auto" },
        ],
      },
      classifications: { productGroup: { displayValue: "Automotive" } },
    },
    images: {
      primary: {
        large: {
          url: "https://m.media-amazon.com/images/I/61M9UCVPJSL._AC_SL1000_.jpg",
          height: 1500,
          width: 1500,
        },
      },
    },
    offers: {
      listings: [
        {
          price: { displayAmount: "99,00 €", amount: 99, currency: "EUR" },
          availability: { message: "Auf Lager", type: "InStock" },
        },
      ],
    },
  },
  B09LIONBAT: {
    asin: "B09LIONBAT",
    detailPageUrl: "https://www.amazon.de/dp/B09LIONBAT",
    itemInfo: {
      title: {
        displayValue:
          "LiFePO4 12,8V 200Ah LX; 2560Wh; > 3000 Zyklen bei 90% Entladungstiefe (DOD) mit BMS und Bluetooth Überwachung; für Wohnmobil oder Boot 390x233x255mm - LISMART12200LX",
      },
      byLineInfo: {
        brand: { displayValue: "LIONTRON" },
        manufacturer: { displayValue: "LIONTRON" },
      },
      features: {
        displayValues: [
          "Extrem Zyklenfest Sehr hohe Energiedichte Lange Lagerfähigkeit Lithium Technologie (LiFePO4, Lithium Eisenphosphat)",
          "Nennspannung 12,8V - Ladeschlußspannung 14.4 - 14.6V - Ladestrom 100-150A - Entladestrom (Dauer/Spitze) 150-200A",
        ],
      },
      technicalInfo: {
        technicalDetails: [
          { name: "Marke", value: "LIONTRON" },
          { name: "Batteriekapazität", value: "200 Ah" },
          { name: "Batterie-Spannung", value: "12,8 Volt" },
        ],
      },
      classifications: { productGroup: { displayValue: "Auto & Motorrad" } },
    },
    images: {
      primary: {
        large: {
          url: "https://m.media-amazon.com/images/I/71KWq7bRAiL._AC_SL1500_.jpg",
          height: 1500,
          width: 1500,
        },
      },
    },
    offers: {
      listings: [{ price: { displayAmount: "2.079,00 €", amount: 2079, currency: "EUR" } }],
    },
  },
  B08VICINV2: {
    asin: "B08VICINV2",
    detailPageUrl: "https://www.amazon.de/dp/B08VICINV2",
    itemInfo: {
      title: {
        displayValue: "Victron Energy Phoenix Wechselrichter 12/2000 230V VE.Direct Schuko - PIN122200000",
      },
      byLineInfo: {
        brand: { displayValue: "Victron Energy" },
        manufacturer: { displayValue: "Victron Energy B.V." },
      },
      features: {
        displayValues: [
          "Der Phoenix 12/2000 Wechselrichter von Victron Energy wandelt 12V Gleichstrom in 230V Wechselstrom mit reiner Sinuswelle um. Dauerleistung 2000W, Spitzenleistung bis 4000W.",
        ],
      },
      technicalInfo: {
        technicalDetails: [
          { name: "Marke", value: "Victron Energy" },
          { name: "Leistung", value: "2000 Watt" },
          { name: "Ausgangsspannung", value: "230 Volt" },
        ],
      },
      classifications: { productGroup: { displayValue: "Automotive" } },
    },
    images: {
      primary: {
        large: {
          url: "https://m.media-amazon.com/images/I/61xQbIq2URL._AC_SL1200_.jpg",
          height: 1200,
          width: 1200,
        },
      },
    },
    offers: {
      listings: [{ price: { displayAmount: "549,00 €", amount: 549, currency: "EUR" } }],
    },
  },
};

export async function fetchMockAmazonItem(asin: string): Promise<AmazonItem | null> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const key = asin.toUpperCase().trim();
  return MOCK_PRODUCTS[key] ?? null;
}
