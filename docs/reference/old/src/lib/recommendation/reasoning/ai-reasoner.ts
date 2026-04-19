/**
 * AI Reasoner
 * 
 * Generiert natürlichsprachliche Begründungen mithilfe der KI.
 * Ideal wenn die Produktauswahl algorithmisch war, aber der Text "menschlich" klingen soll.
 * Spart Tokens, da nicht die volle Auswahl-Logik durchlaufen muss.
 */

import { generateText } from '@/lib/ai';
import type { SelectedProductRaw, RecommendationContext, TokenUsage } from '../types';

export async function generateAIReasons(
    products: SelectedProductRaw[],
    context: RecommendationContext
): Promise<{ reasons: Map<string, string>; usage: TokenUsage; model: string }> {
    const { aiSettings, preCalculatedRequirements } = context;

    if (!aiSettings) {
        throw new Error("Missing AI settings for AI Reasoning");
    }

    // Prepare minimal context for reasoning
    const productListText = products.map(p => {
        // Find basic info
        const prodRaw = context.allProducts.find(ap => ap.id === p.productId);
        const name = prodRaw?.name || "Unbekanntes Produkt";
        const cat = p.category;
        const matches = p.matchReason ? `(Tech-Check: ${p.matchReason})` : "";
        return `- ID: ${p.productId}\n  Name: ${name}\n  Kategorie: ${cat}\n  Infos: ${matches}`;
    }).join('\n\n');

    const systemPrompt = `Du bist ein Experte für Camper-Elektrik.
Deine Aufgabe: Schreibe für jedes der folgenden Produkte eine kurze, überzeugende Begründung (1-2 Sätze).
Erkläre dem Nutzer, warum dieses Produkt gut zu seinem System passt.
Nutze "Du"-Ansprache. Sei freundlich und kompetent.

System-Kontext:
- Spannung: ${preCalculatedRequirements?.systemVoltage}V
- Batterie-Typ: ${preCalculatedRequirements?.batteryType}
- Tagesbedarf: ${preCalculatedRequirements?.dailyWh}Wh

Antworte AUSSCHLIESSLICH als gültiges JSON Objekt:
{
  "product_id_1": "Begründungstext...",
  "product_id_2": "Begründungstext..."
}
Kein Markdown, kein Text davor oder danach.`;

    const userPrompt = `Hier sind die ausgewählten Produkte:\n\n${productListText}`;

    try {
        const { text, usage, model } = await generateText({
            systemPrompt,
            userPrompt,
            model: aiSettings.model,
            apiKey: aiSettings.openaiApiKey || aiSettings.geminiApiKey || "",
            provider: aiSettings.provider as any
        });

        const reasonsMap = new Map<string, string>();

        try {
            // Clean JSON (remove markdown blocks if present)
            const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonText);

            for (const [id, reason] of Object.entries(parsed)) {
                if (typeof reason === 'string') {
                    reasonsMap.set(id, reason);
                }
            }
        } catch (e) {
            console.error("Failed to parse AI reasoning JSON", e);
            // Fallback: Map empty, will fallback to templates later
        }

        return {
            reasons: reasonsMap,
            usage: usage || { inputTokens: 0, outputTokens: 0 },
            model: model || "unknown"
        };

    } catch (error) {
        console.error("AI Reasoning failed", error);
        return {
            reasons: new Map(),
            usage: { inputTokens: 0, outputTokens: 0 },
            model: "error"
        };
    }
}
