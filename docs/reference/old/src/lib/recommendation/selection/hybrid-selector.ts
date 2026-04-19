/**
 * Hybrid Selector (KI + Algorithm)
 * 
 * Nutzt die bestehende KI-Logik zur Produktauswahl.
 * Der Algorithmus liefert die Vorauswahl (Preselection), die KI wählt daraus.
 */

import { generateProductSelection } from '@/lib/ai';
import { appendAmazonTag } from '@/lib/affiliate';
import { preselectProducts, type ProductWithFilter } from '@/lib/algorithm';
import type { RecommendationContext, SelectedProductRaw, TokenUsage } from '../types';

export async function selectProductsHybrid(
    context: RecommendationContext
): Promise<{ products: SelectedProductRaw[]; usage: TokenUsage; model: string }> {
    const {
        calculationInput,
        formattedPrompt,
        productContext,
        requirementsContext,
        preselectionContext,
        aiSettings: settings,
        allProducts,
        amazonPartnerTag,
        preCalculatedRequirements,
        preselection,
        formData
    } = context;

    if (!calculationInput || !settings) {
        throw new Error("Missing AI context for Hybrid Selection");
    }

    // Call AI
    const { data: aiResponseRaw, usage, model } = await generateProductSelection(
        {
            ...calculationInput,
            formattedPrompt: formattedPrompt || "",
            productContext: productContext || "",
            requirementsContext: requirementsContext || "",
            preselectionContext: preselectionContext || ""
        },
        settings.userPromptTemplate
    );

    const aiResponse = aiResponseRaw as any;
    const selectedProducts: SelectedProductRaw[] = [];
    const foundCategories = new Set<string>();
    const categorySlugToAIGroupKey = new Map<string, string>();

    // Handle new grouped format
    if (aiResponse.productGroups) {
        for (const [categorySlug, items] of Object.entries(aiResponse.productGroups)) {
            if (Array.isArray(items)) {
                for (const item of items) {
                    const pItem = item as any;
                    if (pItem.productId) {
                        const product = allProducts.find(p => p.id === pItem.productId);
                        if (product) {
                            foundCategories.add(product.category.slug);
                            categorySlugToAIGroupKey.set(product.category.slug, categorySlug);

                            let qty = pItem.quantity || 1;

                            // Apply Quantity Overrides (Safety Logic)
                            qty = applyQuantitySafetyOverrides(product, qty, preCalculatedRequirements);

                            selectedProducts.push({
                                productId: product.id,
                                quantity: qty,
                                isRecommended: !!pItem.isRecommended,
                                matchReason: pItem.reason || "Von KI ausgewählt.",
                                matchScore: 0, // KI liefert keinen Score
                                category: product.category.slug,
                                groupKey: categorySlug
                            });
                        }
                    }
                }
            }
        }
    }
    // Fallback: Flat Array
    else if (Array.isArray(aiResponse)) {
        for (const productId of aiResponse) {
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                foundCategories.add(product.category.slug);
                selectedProducts.push({
                    productId: product.id,
                    quantity: 1,
                    isRecommended: true,
                    matchReason: "Von KI ausgewählt.",
                    matchScore: 0,
                    category: product.category.slug,
                    groupKey: product.category.name // Fallback key
                });
            }
        }
    }

    // Inject Alternatives (Top candidates from Preselection NOT already selected)
    // Only if we have preselection data
    if (preselection) {
        const alreadySelectedIds = new Set(selectedProducts.map(p => p.productId));

        for (const category of preselection.categories) {
            // Get AI group key or fallback
            const aiGroupKey = categorySlugToAIGroupKey.get(category.categorySlug) || category.categoryName;

            // Check if recommended exists
            const hasRecommended = selectedProducts.some(p => p.category === category.categorySlug && p.isRecommended);

            // Find candidates not selected
            const alternatives = category.candidates
                .filter(c => !alreadySelectedIds.has(c.product.id))
                .slice(0, 1); // Max 1 alternative

            for (const alt of alternatives) {
                // Determine if this should be recommended (fallback if AI failed to pick any)
                const isRecommended = !hasRecommended;

                selectedProducts.push({
                    productId: alt.product.id,
                    quantity: alt.quantity || 1,
                    isRecommended: isRecommended,
                    matchReason: alt.matchReason,
                    matchScore: alt.matchScore,
                    category: category.categorySlug,
                    groupKey: aiGroupKey
                });
                alreadySelectedIds.add(alt.product.id);
            }
        }
    }

    return { products: selectedProducts, usage: usage || { inputTokens: 0, outputTokens: 0 }, model: model || "unknown" };
}

/**
 * Safety Algorithm to override AI hallucinated quantities
 */
function applyQuantitySafetyOverrides(product: any, aiQty: number, requirements: any): number {
    if (!requirements) return aiQty;

    // Battery Override
    if ((product.category.slug === 'batterie' || product.category.slug === 'batterien') && requirements?.battery?.recommendedCapacityAh) {
        try {
            const specs: any = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs || {};
            const cap = specs?.capacityAh || specs?.capacity;
            if (cap && cap > 0) {
                const needed = Math.ceil(requirements.battery.recommendedCapacityAh / cap);
                if (needed > 0 && needed !== aiQty) {
                    return needed;
                }
            }
        } catch (e) { }
    }

    // Solar Override
    if (product.category.slug === 'solarmodule' && requirements?.solarModules?.requiredWp) {
        try {
            const specs: any = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs || {};
            const moduleWp = specs?.maxPowerWp || specs?.powerWp || specs?.peakPowerWp;
            if (moduleWp && moduleWp > 0) {
                const needed = Math.ceil(requirements.solarModules.requiredWp / moduleWp);
                // Hard override if absurdedly high (AI confused dimensions with qty)
                if (aiQty > 50) return needed;
                if (needed > 0 && needed !== aiQty) return needed;
            }
        } catch (e) { }
    }

    return aiQty;
}
