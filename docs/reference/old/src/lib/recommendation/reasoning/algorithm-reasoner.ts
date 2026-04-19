/**
 * Algorithm Reasoner
 * 
 * Generiert Begründungen basierend auf Templates und Match-Reasons.
 */

import type { SystemRequirements } from '@/lib/algorithm';
import type { SelectedProductRaw, RecommendationContext } from '../types';
import { getTemplateReason } from './templates';

export function generateAlgorithmReasons(
    products: SelectedProductRaw[],
    context: RecommendationContext
): Map<string, string> {
    const reasons = new Map<string, string>();
    const { allProducts, preCalculatedRequirements } = context;

    for (const p of products) {
        // 1. Wenn ein matchReason vom Algorithmus existiert und aussagekräftig ist
        // (nicht nur "Von KI ausgewählt"), nutzen wir diesen.
        // Wir bereinigen ihn vorher ggf. etwas.
        if (p.matchReason && !p.matchReason.includes("Von KI ausgewählt")) {
            reasons.set(p.productId, cleanReason(p.matchReason));
            continue;
        }

        // 2. Fallback: Template System
        const fullProduct = allProducts.find(prod => prod.id === p.productId);
        if (fullProduct) {
            const templateReason = getTemplateReason(
                p.category,
                fullProduct,
                preCalculatedRequirements
            );
            reasons.set(p.productId, templateReason);
        } else {
            reasons.set(p.productId, "Basierend auf deinen Anforderungen ausgewählt.");
        }
    }

    return reasons;
}

function cleanReason(reason: string): string {
    // Entfernt technische Prefixe wie "Erfüllt Minimum: "
    return reason
        .replace(/^Erfüllt Minimum \(.+?\)\.?\s*/, 'Erfüllt die Mindestanforderungen. ')
        .replace(/^Optimal für Anforderung\.?\s*/, 'Optimal dimensioniert für deine Anforderungen. ');
}
