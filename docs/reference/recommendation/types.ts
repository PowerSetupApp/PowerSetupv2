/**
 * Recommendation Engine Types
 * 
 * Gemeinsame Types für Produktauswahl und Begründungsgenerierung.
 */

import type { SystemRequirements, PreselectionResult, PreselectedProduct } from '@/lib/algorithm';

// ==========================================
// Konfiguration
// ==========================================

/** Modus für die Produktauswahl */
export type ProductSelectionMode = 'algorithm' | 'hybrid';

/** Modus für die Begründungstexte */
export type ReasonGenerationMode = 'algorithm' | 'ai' | 'none';

/** Vollständige Konfiguration der Recommendation Engine */
export interface RecommendationConfig {
    productSelectionMode: ProductSelectionMode;
    reasonGenerationMode: ReasonGenerationMode;
}

// ==========================================
// Rohes Auswahl-Ergebnis (vor Anreicherung)
// ==========================================

export interface SelectedProductRaw {
    productId: string;
    quantity: number;
    isRecommended: boolean;
    matchScore: number;
    matchReason: string;
    category: string;
    groupKey: string;
}

// ==========================================
// Finales Produkt-Ergebnis
// ==========================================

export interface SelectedProduct {
    productId: string;
    quantity: number;
    reason: string;
    isRecommended: boolean;
    name: string;
    affiliateUrl: string | null;
    imageUrl: string | null;
    price: number | null;
    category: string;
    groupKey?: string;
    isMissing?: boolean;
    matchScore?: number;
}

// ==========================================
// Gesamt-Ergebnis
// ==========================================

export interface RecommendationResult {
    selectedProducts: SelectedProduct[];
    warnings: string[];
    explanation: string;
    config: RecommendationConfig;
    aiUsage?: {
        model: string;
        inputTokens: number;
        outputTokens: number;
    };
}

// ==========================================
// Context für Engines
// ==========================================

export interface RecommendationContext {
    preselection: PreselectionResult;
    allProducts: any[];
    formData: any;
    preCalculatedRequirements: SystemRequirements | null;
    amazonPartnerTag: string;
    // Für Hybrid/AI-Modus
    calculationInput?: any;
    formattedPrompt?: string;
    productContext?: string;
    requirementsContext?: string;
    preselectionContext?: string;
    aiSettings?: any;
    userPromptTemplate?: string;
}

// ==========================================
// Token-Nutzung
// ==========================================

export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
}
