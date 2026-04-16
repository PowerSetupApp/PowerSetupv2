/**
 * Reasoning Templates
 * 
 * Textbausteine für algorithmisch generierte Begründungen.
 */

import type { SystemRequirements } from '@/lib/algorithm';
import type { SelectedProductRaw } from '../types';

type ReasonTemplate = (product: any, specs: any, req: SystemRequirements | null) => string;

export const REASON_TEMPLATES: Record<string, ReasonTemplate> = {
    batterien: (product, specs, req) => {
        const cap = specs?.capacityAh || '?';
        const target = req?.battery?.recommendedCapacityAh || '?';
        return `Diese ${cap}Ah Batterie bietet ausreichend Kapazität für deinen geschätzten Tagesbedarf (Empfohlen: ~${target}Ah).`;
    },

    wechselrichter: (product, specs, req) => {
        const power = specs?.outputPowerW || specs?.powerW || '?';
        const needed = req?.inverter?.recommendedW || '?';
        return `Mit ${power}W Dauerleistung deckt dieser Wechselrichter deinen 230V-Bedarf von ${needed}W zuverlässig ab.`;
    },

    ladebooster: (product, specs, req) => {
        const current = specs?.maxChargeCurrent || specs?.currentA || '?';
        return `Dieser Ladebooster lädt deine Batterie während der Fahrt mit bis zu ${current}A.`;
    },

    batterieladegeraete: (product, specs, req) => {
        const current = specs?.maxChargeA || specs?.currentA || '?';
        return `Lädt die Batterie am Landstrom zuverlässig mit ${current}A nach.`;
    },

    'solar-laderegler': (product, specs, req) => {
        const current = specs?.maxAmpere || specs?.currentA || '?';
        return `Passender Solar-Laderegler für deine Module (bis ${current}A Ladestrom).`;
    },

    solarmodule: (product, specs, req) => {
        const power = specs?.maxPowerWp || specs?.powerWp || '?';
        return `Hochwertiges Solarmodul mit ${power}Wp Leistung für autarke Energie.`;
    },

    solartaschen: (product, specs, req) => {
        const power = specs?.maxPowerWp || specs?.powerWp || '?';
        return `Faltbare Solartasche mit ${power}Wp - ideal für flexible Ausrichtung zur Sonne.`;
    },

    kabel: (product, specs, req) => {
        const cross = specs?.crossSectionMm2 || '?';
        return `Hochwertiges Kabel mit ${cross}mm² Querschnitt für sichere Stromübertragung.`;
    }
};

export function getTemplateReason(
    categorySlug: string,
    product: any,
    requirements: SystemRequirements | null
): string {
    const template = REASON_TEMPLATES[categorySlug] || REASON_TEMPLATES['default'];

    // Parse specs safely
    let specs = {};
    if (product.specs) {
        try {
            specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
        } catch { }
    } else if (product.filterValues) {
        specs = product.filterValues;
    }

    if (template) {
        return template(product, specs, requirements);
    }

    return 'Technisch passendes Produkt für deine Anforderungen.';
}
