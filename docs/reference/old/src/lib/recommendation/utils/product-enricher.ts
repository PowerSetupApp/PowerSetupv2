/**
 * Product Enricher
 * 
 * Reichert die rohen Produktdaten mit DB-Infos, Bildern und Affiliate-Links an.
 */

import { appendAmazonTag } from '@/lib/affiliate';
import type { SelectedProductRaw, SelectedProduct, RecommendationContext } from '../types';

export function enrichProducts(
    rawProducts: SelectedProductRaw[],
    reasons: Map<string, string>,
    context: RecommendationContext
): SelectedProduct[] {
    const { allProducts, amazonPartnerTag } = context;
    const enriched: SelectedProduct[] = [];

    // Track Categories to find Missing ones
    // (Logic for missing categories is handled in warnings generation)

    for (const raw of rawProducts) {
        const productDB = allProducts.find(p => p.id === raw.productId);

        if (!productDB) {
            console.warn(`Product DB entry not found for ID: ${raw.productId}`);
            continue;
        }

        // Get Reason: Map > Raw.matchReason > Default
        const finalReason = reasons.get(raw.productId) || raw.matchReason || "Passendes Produkt.";

        enriched.push({
            productId: raw.productId,
            quantity: raw.quantity,
            reason: finalReason,
            isRecommended: raw.isRecommended,
            name: productDB.name,
            affiliateUrl: appendAmazonTag(productDB.affiliateUrl || "", amazonPartnerTag),
            imageUrl: productDB.imageUrl,
            price: productDB.price,
            category: raw.category,
            groupKey: raw.groupKey,
            matchScore: raw.matchScore
        });
    }

    return enriched;
}
