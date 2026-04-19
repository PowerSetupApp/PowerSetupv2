/**
 * Algorithm Selector
 * 
 * Rein algorithmische Produktauswahl basierend auf Match-Scores.
 * Wählt für jede Kategorie das Top-Produkt + Alternativen.
 */

import type { PreselectionResult, CategoryPreselection } from '@/lib/algorithm';
import type { SelectedProductRaw, RecommendationContext } from '../types';

/**
 * Wählt Produkte rein algorithmisch basierend auf Match-Scores.
 * 
 * Strategie:
 * 1. Für jede Kategorie: Kandidat mit höchstem Score = Empfehlung
 * 2. Kandidaten 2-3 = Alternativen
 * 3. Quantity kommt direkt aus der Preselection
 */
export function selectProductsAlgorithmically(
    context: RecommendationContext
): SelectedProductRaw[] {
    const { preselection } = context;
    const selectedProducts: SelectedProductRaw[] = [];

    for (const category of preselection.categories) {
        if (category.candidates.length === 0) continue;

        // Top-1 = Empfehlung (höchster Score)
        const topCandidate = category.candidates[0];

        // Only recommend if score > 0 (compatible)
        if (topCandidate.matchScore > 0) {
            selectedProducts.push({
                productId: topCandidate.product.id,
                quantity: topCandidate.quantity || 1,
                isRecommended: true,
                matchScore: topCandidate.matchScore,
                matchReason: topCandidate.matchReason,
                category: category.categorySlug,
                groupKey: category.categoryName,
            });
        }

        // Top 2-3 = Alternativen (max 2 Alternativen pro Kategorie)
        // CRITICAL: Only include alternatives with score > 0 (compatible products)
        const alternatives = category.candidates
            .slice(1, 3)
            .filter(alt => alt.matchScore > 0); // ← FILTER INCOMPATIBLE

        for (const alt of alternatives) {
            selectedProducts.push({
                productId: alt.product.id,
                quantity: alt.quantity || 1,
                isRecommended: false,
                matchScore: alt.matchScore,
                matchReason: alt.matchReason,
                category: category.categorySlug,
                groupKey: category.categoryName,
            });
        }
    }

    return selectedProducts;
}
