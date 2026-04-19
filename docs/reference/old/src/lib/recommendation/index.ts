/**
 * Recommendation Engine - Public API
 */

export * from './types';

import type { RecommendationConfig, RecommendationContext, RecommendationResult, SelectedProduct, SelectedProductRaw, TokenUsage } from './types';
import type { SystemRequirements } from '@/lib/algorithm';
import { selectProductsAlgorithmically } from './selection/algorithm-selector';
import { selectProductsHybrid } from './selection/hybrid-selector';
import { generateAlgorithmReasons } from './reasoning/algorithm-reasoner';
import { generateAIReasons } from './reasoning/ai-reasoner';
import { enrichProducts } from './utils/product-enricher';

/**
 * Generiert Produktempfehlungen basierend auf der Konfiguration.
 * 
 * Flow:
 * 1. Produktauswahl (Selection): Algorithmus ODER Hybrid (KI)
 * 2. Begründungstexte (Reasoning): Algorithmus ODER KI ODER Keine
 * 3. Anreicherung (Enrichment): DB-Daten & Bilder
 */
export async function generateRecommendation(
    config: RecommendationConfig,
    context: RecommendationContext
): Promise<RecommendationResult> {

    // ==========================================
    // STEP 1: Produktauswahl (SELECTION)
    // ==========================================

    let rawProducts: SelectedProductRaw[] = [];
    let aiUsage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
    let model: string = "algorithm";

    try {
        if (config.productSelectionMode === 'algorithm') {
            rawProducts = selectProductsAlgorithmically(context);
        } else {
            // Hybrid Mode
            const result = await selectProductsHybrid(context);
            rawProducts = result.products;
            aiUsage = result.usage;
            model = result.model;
        }
    } catch (error) {
        console.error("Selection failed", error);
        // Fallback to algorithm if hybrid fails
        console.warn("Falling back to algorithmic selection due to error");
        rawProducts = selectProductsAlgorithmically(context);
    }

    // ==========================================
    // STEP 2: Begründungstexte (REASONING)
    // ==========================================

    let reasons: Map<string, string> = new Map();

    try {
        if (config.reasonGenerationMode === 'algorithm') {
            reasons = generateAlgorithmReasons(rawProducts, context);
        } else if (config.reasonGenerationMode === 'ai') {
            const aiResult = await generateAIReasons(rawProducts, context);
            reasons = aiResult.reasons;

            // Usage addieren (falls Selection auch schon Tokens verbraucht hat)
            if (aiResult.usage) {
                aiUsage.inputTokens += aiResult.usage.inputTokens;
                aiUsage.outputTokens += aiResult.usage.outputTokens;
                if (model === "algorithm") model = aiResult.model; // Wenn Selection Algo war, nimm AI Model
            }
        }
        // 'none' -> returns empty map
    } catch (error) {
        console.error("Reasoning failed", error);
        // Fallback to algo reasons
        reasons = generateAlgorithmReasons(rawProducts, context);
    }

    // ==========================================
    // STEP 3: Anreicherung (ENRICHMENT)
    // ==========================================

    const enrichedProducts = enrichProducts(rawProducts, reasons, context);

    // ==========================================
    // STEP 4: Warnings & Explanation
    // ==========================================

    const warnings = detectWarnings(enrichedProducts, context.preCalculatedRequirements);
    const explanation = generateExplanation(config);

    return {
        selectedProducts: enrichedProducts,
        warnings,
        explanation,
        config,
        aiUsage: {
            model,
            ...aiUsage
        }
    };
}

function detectWarnings(products: SelectedProduct[], requirements: SystemRequirements | null): string[] {
    const warnings: string[] = [];

    if (!requirements) return warnings;

    // Required categories that must have at least one recommended product
    const requiredCategories: { slug: string; label: string; condition: boolean }[] = [
        { slug: 'batterien', label: 'Batterie', condition: true },
        { slug: 'wechselrichter', label: 'Wechselrichter', condition: !!requirements.inverter?.needed },
        { slug: 'ladebooster', label: 'Ladebooster', condition: !!requirements.booster?.needed },
        { slug: 'batterieladegeraete', label: 'Batterieladegerät', condition: !!requirements.charger?.needed },
        { slug: 'solar-laderegler', label: 'Solar-Laderegler', condition: !!requirements.solarController?.needed },
    ];

    for (const cat of requiredCategories) {
        if (!cat.condition) continue;
        const found = products.some(p => p.category === cat.slug && p.isRecommended && !p.isMissing);
        if (!found) {
            warnings.push(`Kein passendes Produkt für ${cat.label} gefunden. Bitte prüfe das Sortiment.`);
        }
    }

    // Warn if battery is very small relative to daily consumption
    const recommendedAh = requirements.battery?.recommendedCapacityAh;
    const dailyWh = requirements.battery?.dailyWh;
    const voltage = requirements.systemVoltage;
    if (recommendedAh && dailyWh && voltage) {
        const batteryWh = recommendedAh * voltage;
        if (batteryWh < dailyWh * 0.8) {
            warnings.push(`Die empfohlene Batterie (${recommendedAh} Ah) deckt weniger als 80 % des Tagesverbrauchs (${Math.round(dailyWh)} Wh). Erhöhe die Autarkie-Tage oder reduziere den Verbrauch.`);
        }
    }

    return warnings;
}

function generateExplanation(config: RecommendationConfig): string {
    const parts = [];
    if (config.productSelectionMode === 'algorithm') {
        parts.push("Produktauswahl: Rein Algorithmisch (Basierend auf technischen Daten).");
    } else {
        parts.push("Produktauswahl: Hybrid (Algorithmus + KI).");
    }

    if (config.reasonGenerationMode === 'ai') {
        parts.push("Texte: KI-Generiert.");
    } else if (config.reasonGenerationMode === 'algorithm') {
        parts.push("Texte: Standard-Templates.");
    }

    return parts.join(" ");
}
