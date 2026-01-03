/**
 * Mock Amazon Service for development and testing.
 * Returns realistic product data in Creators API format (camelCase).
 * This can be swapped with RealAmazonService once API access is available.
 */

import { IAmazonService, AmazonItem } from './types';

// Rich mock data for testing different product categories
const MOCK_PRODUCTS: Record<string, AmazonItem> = {
    // Victron SmartSolar MPPT 75/15 (real product)
    'B075NQQRPD': {
        asin: 'B075NQQRPD',
        detailPageUrl: 'https://www.amazon.de/dp/B075NQQRPD',
        itemInfo: {
            title: {
                displayValue: 'Victron SmartSolar MPPT Laderegler 75/15 Solarladeregler 12V 24V 15A Bluetooth integriert SCC075015060R',
            },
            byLineInfo: {
                brand: { displayValue: 'Victron Energy' },
                manufacturer: { displayValue: 'Victron Energy B.V.' },
            },
            features: {
                displayValues: [
                    'Integriertes Bluetooth Smart: Vollständige Kontrolle und Überwachung per Smartphone',
                    'Ultraschnelles Maximum Power Point Tracking (MPPT) für maximalen Ertrag',
                    'PV-Spannung bis 75V, Batterieladestrom bis 15A',
                    'Für 12V und 24V Batteriesysteme geeignet (Auto-Erkennung)',
                    'Programmierbare Laststeuerung, Tag/Nacht-Modus',
                    'VE.Direct Kommunikationsport für Systemintegration',
                    'Universell einsetzbar: LiFePO4, AGM, GEL, Blei-Säure',
                ],
            },
            productInfo: {
                itemDimensions: {
                    height: { displayValue: 10, unit: 'cm' },
                    length: { displayValue: 13, unit: 'cm' },
                    width: { displayValue: 4, unit: 'cm' },
                    weight: { displayValue: 0.5, unit: 'kg' },
                },
            },
            technicalInfo: {
                technicalDetails: [
                    { name: 'Maximale PV-Leistung', value: '200W (12V) / 400W (24V)' },
                    { name: 'Maximaler Ladestrom', value: '15A' },
                    { name: 'Maximale PV-Spannung', value: '75V' },
                    { name: 'Nennspannung', value: '12V / 24V Auto' },
                    { name: 'Artikelgewicht', value: '500 g' },
                ],
            },
            classifications: {
                productGroup: { displayValue: 'Automotive' },
            },
        },
        images: {
            primary: {
                large: {
                    url: 'https://m.media-amazon.com/images/I/61M9UCVPJSL._AC_SL1000_.jpg',
                    height: 1500,
                    width: 1500,
                },
            },
        },
        offers: {
            listings: [
                {
                    price: {
                        displayAmount: '99,00 €',
                        amount: 99.0,
                        currency: 'EUR',
                    },
                    availability: {
                        message: 'Auf Lager',
                        type: 'InStock',
                    },
                },
            ],
        },
    },

    // Mock LiFePO4 Battery - realistic Amazon format with less structured data
    'B09LIONBAT': {
        asin: 'B09LIONBAT',
        detailPageUrl: 'https://www.amazon.de/dp/B09LIONBAT',
        itemInfo: {
            title: {
                // Real Amazon titles contain many specs embedded
                displayValue: 'LiFePO4 12,8V 200Ah LX; 2560Wh; > 3000 Zyklen bei 90% Entladungstiefe (DOD) mit BMS und Bluetooth Überwachung; für Wohnmobil oder Boot 390x233x255mm - LISMART12200LX',
            },
            byLineInfo: {
                brand: { displayValue: 'LIONTRON' },
                manufacturer: { displayValue: 'LIONTRON' },
            },
            features: {
                // Real Amazon features are flowing text with mixed info
                displayValues: [
                    'Extrem Zyklenfest Sehr hohe Energiedichte Lange Lagerfähigkeit Lithium Technologie (LiFePO4, Lithium Eisenphosphat) Geringes Gewicht Nachhaltig, Batteriemanagementsystem (BMS), Bluetooth Überwachung, Batteriestatus immer im Blick 5 Jahre Herstellergarantie',
                    'Leichtes Öffnen der Batterie durch Lösen von nur vier Schrauben. Kein verklebtes Gehäuse. Keine verlöteten Zellen. Unkomplizierter kostengünstiger Service und Reparatur. Tausch von einzelnen Komponenten möglich.',
                    'Eins- zu eins mit Bleibatterien wie AGM oder Gel austauschbar, ohne Änderung der Ladestruktur. Geeignet für 12V Installationen, Parallelschaltung ist möglich (Serienschaltung auf bpsw. 24V nicht möglich)',
                    'Nennspannung 12,8V - Ladeschlußspannung 14.4 - 14.6V - Ladestrom 100-150A - Entladestrom (Dauer/Spitze) 150-200A',
                    'Mehr Energie pro Kilogramm. Gewicht nur ca. 26kg - Maße (BxHxT) 390x233x255mm',
                ],
            },
            technicalInfo: {
                // Real Amazon technical details are often sparse or inconsistent
                technicalDetails: [
                    { name: 'Marke', value: 'LIONTRON' },
                    { name: 'Akkuaufbau', value: 'Lithiumphosphat' },
                    { name: 'Batteriekapazität', value: '200 Unbekannt' }, // Amazon often has weird formatting
                    { name: 'Batterie-Spannung', value: '12,8 Volt' },
                    { name: 'Stromstärke', value: '200 Ampere' },
                    { name: 'Batteriegewicht', value: '26 Kilogramm' },
                    { name: 'Artikelabmessungen', value: '39 x 23,3 x 25,5 cm' },
                    { name: 'Empfohlene Anwendungen für Produkt', value: 'For us in the Mobile home or boat' },
                ],
            },
            classifications: {
                productGroup: { displayValue: 'Auto & Motorrad' },
            },
        },
        images: {
            primary: {
                large: {
                    url: 'https://m.media-amazon.com/images/I/71KWq7bRAiL._AC_SL1500_.jpg',
                    height: 1500,
                    width: 1500,
                },
            },
        },
        offers: {
            listings: [
                {
                    price: {
                        displayAmount: '2.079,00 €',
                        amount: 2079.0,
                        currency: 'EUR',
                    },
                },
            ],
        },
    },

    // Mock Inverter - realistic Amazon format
    'B08VICINV2': {
        asin: 'B08VICINV2',
        detailPageUrl: 'https://www.amazon.de/dp/B08VICINV2',
        itemInfo: {
            title: {
                // Real Amazon titles pack in specs
                displayValue: 'Victron Energy Phoenix Wechselrichter 12/2000 230V VE.Direct Schuko - PIN122200000',
            },
            byLineInfo: {
                brand: { displayValue: 'Victron Energy' },
                manufacturer: { displayValue: 'Victron Energy B.V.' },
            },
            features: {
                // Real Amazon features are flowing text
                displayValues: [
                    'Der Phoenix 12/2000 Wechselrichter von Victron Energy wandelt 12V Gleichstrom in 230V Wechselstrom mit reiner Sinuswelle um. Dauerleistung 2000W, Spitzenleistung bis 4000W für kurzzeitige Lastspitzen beim Einschalten von Geräten.',
                    'Reiner Sinus - Die reine Sinuswelle ist identisch mit dem Stromnetz und damit geeignet für empfindliche Elektronik wie Laptops, Fernseher, Kompressorkühlschränke, Mikrowellen und Kaffeemaschinen.',
                    'VE.Direct Kommunikationsport für Anschluss an GX-Geräte, VictronConnect App (via USB-Adapter) und MPPT-Laderegler. ECO-Modus für minimalen Stromverbrauch bei geringer Last.',
                    'Für 12V Batteriesysteme (Eingangsspannungsbereich 9,2V - 17V). Wirkungsgrad bis zu 93%. Integrierter Überlast-, Kurzschluss- und Überhitzungsschutz.',
                ],
            },
            technicalInfo: {
                // Real Amazon details - often incomplete or inconsistent
                technicalDetails: [
                    { name: 'Marke', value: 'Victron Energy' },
                    { name: 'Leistung', value: '2000 Watt' },
                    { name: 'Ausgangsspannung', value: '230 Volt' },
                    { name: 'Artikelgewicht', value: '12 kg' },
                ],
            },
            classifications: {
                productGroup: { displayValue: 'Automotive' },
            },
        },
        images: {
            primary: {
                large: {
                    url: 'https://m.media-amazon.com/images/I/61xQbIq2URL._AC_SL1200_.jpg',
                    height: 1200,
                    width: 1200,
                },
            },
        },
        offers: {
            listings: [
                {
                    price: {
                        displayAmount: '549,00 €',
                        amount: 549.0,
                        currency: 'EUR',
                    },
                },
            ],
        },
    },
};

export class MockAmazonService implements IAmazonService {
    private simulatedDelayMs: number;

    constructor(simulatedDelayMs = 800) {
        this.simulatedDelayMs = simulatedDelayMs;
    }

    async getItem(asin: string): Promise<AmazonItem | null> {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, this.simulatedDelayMs));

        // Normalize ASIN (uppercase)
        const normalizedAsin = asin.toUpperCase().trim();

        // Check if we have mock data for this ASIN
        const mockItem = MOCK_PRODUCTS[normalizedAsin];

        if (mockItem) {
            console.log(`[MockAmazonService] Returning mock data for ASIN: ${normalizedAsin}`);
            return mockItem;
        }

        console.log(`[MockAmazonService] No mock data found for ASIN: ${normalizedAsin}`);
        return null;
    }
}

// Default export for easy instantiation
export const mockAmazonService = new MockAmazonService();
