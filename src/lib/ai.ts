import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { ProductSpec } from "./schemas/products";
import { getAISettings } from "@/app/actions/settings";



// ==========================================
// Main Function
// ==========================================

/**
 * Sends a single prompt to the AI and extracts Product IDs from the response.
 */
export async function generateProductSelection(
    input: AIInput,
    promptTemplate: string
): Promise<{ data: any; usage?: { inputTokens: number; outputTokens: number }; model: string }> {
    const settings = await getAISettings();
    const provider = settings.provider; // "google" | "openai"

    // Build User Prompt
    const userPrompt = buildPrompt(promptTemplate, input);

    const systemPrompt = `
Du bist ein KI-Assistent zur Produktauswahl.
Deine Aufgabe: Analysiere die Anforderungen und die verfügbaren Produkte.
Antworte mit einer Liste der passenden Produkt-IDs (UUIDs) im angeforderten JSON-Format.
`;

    const fullPromptContent = systemPrompt + "\n\n" + userPrompt;

    console.log(`--- AI Request (${provider.toUpperCase()}) ---`);

    try {
        let textCallback: () => Promise<{ text: string; usage?: { inputTokens: number; outputTokens: number } }>;

        if (provider === "openai") {
            const apiKey = settings.openaiApiKey;
            if (!apiKey) throw new Error("OpenAI API Key is missing.");

            const openai = new OpenAI({ apiKey });
            const modelName = settings.model || "gpt-4o";

            textCallback = async () => {
                const isO1Model = modelName.startsWith("o1-");
                const temperature = isO1Model ? 1 : 0.2;

                const response = await openai.chat.completions.create({
                    model: modelName,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: temperature,
                    response_format: { type: "json_object" }
                });
                return {
                    text: response.choices[0]?.message?.content || "",
                    usage: {
                        inputTokens: response.usage?.prompt_tokens || 0,
                        outputTokens: response.usage?.completion_tokens || 0,
                    }
                };
            };


        } else {
            // Default: Google Gemini
            const apiKey = settings.geminiApiKey;
            if (!apiKey) throw new Error("Google Gemini API Key is missing.");

            const genAI = new GoogleGenerativeAI(apiKey);
            const modelName = settings.model || "gemini-2.0-flash-exp";
            const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });

            textCallback = async () => {
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: fullPromptContent }] }],
                });
                const response = await result.response;
                const metadata = response.usageMetadata;
                return {
                    text: response.text(),
                    usage: {
                        inputTokens: metadata?.promptTokenCount || 0,
                        outputTokens: metadata?.candidatesTokenCount || 0,
                    }
                };
            };
        }

        // Execute with Retries
        const maxRetries = 3;
        let attempt = 0;
        let lastError: any = null;

        while (attempt < maxRetries) {
            try {
                console.log(`Attempt ${attempt + 1}/${maxRetries}...`);
                const response = await textCallback();
                const text = response.text;
                console.log("--- AI Raw Response ---");
                console.log(text.substring(0, 500) + "...");

                try {
                    // Try parsing JSON first
                    const json = JSON.parse(text);

                    // Support NEW productGroups format
                    if (json && json.productGroups) {
                        console.log("--- Parsed JSON Product Groups ---", Object.keys(json.productGroups));
                        return { data: json, usage: response.usage, model: settings.model || provider };
                    }

                    // Support OLD selectedIds format
                    if (json && Array.isArray(json.selectedIds)) {
                        console.log("--- Parsed JSON IDs ---", json.selectedIds);
                        return { data: json.selectedIds, usage: response.usage, model: settings.model || provider };
                    }

                    // Fallback for flat array
                    if (Array.isArray(json) && typeof json[0] === 'string') {
                        return { data: json, usage: response.usage, model: settings.model || provider };
                    }
                } catch (e) {
                    console.warn("Could not parse JSON response, falling back to Regex extraction.");
                }

                // Fallback: Extract all UUIDs using Regex
                const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
                const matches = text.match(uuidRegex);
                console.log("--- Extracted UUIDs (Regex) ---", matches);

                if (matches && matches.length > 0) {
                    return { data: Array.from(new Set(matches)), usage: response.usage, model: settings.model || provider };
                }

                console.warn("AI returned text but no UUIDs found.");
                throw new Error(`AI returned text but no valid Product IDs were found. Raw Text start: ${text.substring(0, 100)}...`);

            } catch (error: any) {
                console.error(`AI Generation Error (Attempt ${attempt + 1}):`, error);
                lastError = error;

                // Retry on Rate Limits OR 5xx errors
                if (error.message?.includes("429") || error.message?.includes("Too Many Requests") || error.status === 429 || error.status >= 500) {
                    attempt++;
                    if (attempt < maxRetries) {
                        const delay = 2000 * Math.pow(2, attempt);
                        console.log(`Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                } else {
                    // Fatal error (e.g. Auth, Invalid Request) - throw immediately
                    throw error;
                }
            }
        }

        throw lastError || new Error("AI generation failed after multiple retries.");

    } catch (e: any) {
        console.error("Fatal AI Error:", e);
        throw e;
    }
}


// ==========================================
// Interfaces
// ==========================================

export interface AIProductInput {
    id: string;
    name: string;
    category: string;
    price: number | null;
    specs: ProductSpec;
}

export interface AIConsumerInput {
    name: string;
    power: number; // Watt
    hoursPerDay: number;
}

export interface AIInput {
    vehicleType: string;
    voltage: number;
    batteryType: string;
    energySources: string[];
    consumers: AIConsumerInput[];
    travelBehavior: {
        season: string;
        tripDuration: string;
        winterLocation: string;
        standingDuration: string;
    };
    autarkyDays: number;
    solarConfig: {
        setupType: string;
        dimensions?: { length: number; width: number };
        roofModuleType: string;
        portableBags: { power: number }[];
    };
    cabling: {
        starterToService: number;
        serviceToInverter: number;
        solarToRegulator: number;
    };
    comfortLevel: string;
    products: AIProductInput[];
    // Pre-formatted strings for updated prompt templates
    formattedPrompt?: string;
    productContext?: string;
    selectedProductsContext?: string;
}

export interface AISelectedProduct {
    productId: string;
    reason: string;
    quantity: number;
}

export interface AICalculations {
    totalDailyConsumptionWh: number;
    requiredBatteryCapacityAh: number;
    recommendedSolarPowerWp: number;
}

export interface AISchematicComponent {
    id: string;
    type: string;
    label: string;
    x: number;
    y: number;
}

export interface AISchematicConnection {
    from: string;
    to: string;
    label?: string;
}

export interface AISchematic {
    components: AISchematicComponent[];
    connections: AISchematicConnection[];
}

export interface AIOutput {
    selectedProducts: AISelectedProduct[];
    calculations: AICalculations;
    schematic: AISchematic;
    warnings: string[];
    explanation: string;
}

// ==========================================
// Defaults (Fail-Safe)
// ==========================================

const DEFAULT_SYSTEM_PROMPT = `
Du bist ein Experte für mobile Stromversorgung in Campern und Booten.
Deine Aufgabe: Erstelle ein sicheres, normnahes Elektrik-Setup basierend auf den Anforderungen des Nutzers und den verfügbaren Produkten.

Regeln:
1. Sicherheit geht vor: Alle Komponenten müssen zueinander passen (Spannung, Stromstärke).
2. Dimensionierung:
   - Sicherungen passend zum Kabelquerschnitt.
   - Batteriekapazität basierend auf Tagesbedarf + Autarkie-Wunsch (DOD beachten: LiFePO4 90%, AGM 50%).
   - Solarleistung basierend auf Standort (D-A-CH Annahme) und Verbrauch.
3. Produktauswahl: Wähle NUR aus der bereitgestellten Liste "Verfügbare Produkte". Erfinde keine Produkte.
4. Warnhinweise: Füge explizite Warnungen hinzu, insbesondere bei 230V und hohen Strömen.
5. Erklärung: Erkläre deine Entscheidungen so, dass ein Laie sie versteht.

Antworte IMMER im validen JSON-Format.
`;



// ==========================================
// Prompt Builder
// ==========================================

export function buildPrompt(template: string, input: AIInput): string {
    let prompt = template;
    if (!prompt) {
        throw new Error("User Prompt Template is missing. Please configure it in Admin Settings.");
    }

    // New Placeholders
    if (input.formattedPrompt) {
        prompt = prompt.replace(/\{\{PROMPT_FORMAT\}\}/g, input.formattedPrompt);
    }

    if (input.productContext) {
        prompt = prompt.replace(/\{\{PRODUCT_CONTEXT\}\}/g, input.productContext);
    }

    if (input.selectedProductsContext) {
        prompt = prompt.replace(/\{\{SELECTED_PRODUCTS\}\}/g, input.selectedProductsContext);
    }

    // Legacy Placeholders (Backward Compatibility)
    if (prompt.includes("{{VEHICLE}}")) {
        const consumersList = input.consumers
            .map((c) => `- ${c.name}: ${c.power}W, ${c.hoursPerDay}h/Tag`)
            .join("\n");

        const productsJson = JSON.stringify(
            input.products.map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                price: p.price,
                specs: p.specs,
            })),
            null,
            2
        );

        // Format travel behavior
        const travelInfo = `Saison: ${input.travelBehavior.season}, Reisedauer: ${input.travelBehavior.tripDuration}, Winterstandort: ${input.travelBehavior.winterLocation}, Standdauer: ${input.travelBehavior.standingDuration}`;

        // Format solar config
        const solarInfo = `Typ: ${input.solarConfig.setupType}, Dachmodul: ${input.solarConfig.roofModuleType}${input.solarConfig.dimensions ? `, Fläche: ${input.solarConfig.dimensions.length}x${input.solarConfig.dimensions.width}cm` : ''}${input.solarConfig.portableBags.length > 0 ? `, Mobile Taschen: ${input.solarConfig.portableBags.map(b => b.power + 'W').join(', ')}` : ''}`;

        // Format cabling
        const cablingInfo = `Starter→Service: ${input.cabling.starterToService}m, Service→Wechselrichter: ${input.cabling.serviceToInverter}m, Solar→Regler: ${input.cabling.solarToRegulator}m`;

        prompt = prompt.replace(/\{\{VEHICLE\}\}/g, input.vehicleType);
        prompt = prompt.replace(/\{\{VOLTAGE\}\}/g, input.voltage.toString());
        prompt = prompt.replace(/\{\{BATTERY_TYPE\}\}/g, input.batteryType);
        prompt = prompt.replace(/\{\{ENERGY\}\}/g, input.energySources.join(", "));
        prompt = prompt.replace(/\{\{CONSUMERS\}\}/g, consumersList);
        prompt = prompt.replace(/\{\{TRAVEL\}\}/g, travelInfo);
        prompt = prompt.replace(/\{\{AUTARKY\}\}/g, input.autarkyDays.toString());
        prompt = prompt.replace(/\{\{SOLAR\}\}/g, solarInfo);
        prompt = prompt.replace(/\{\{CABLING\}\}/g, cablingInfo);
        prompt = prompt.replace(/\{\{BUDGET\}\}/g, input.comfortLevel);
        prompt = prompt.replace(/\{\{PRODUCTS\}\}/g, productsJson);
    }

    return prompt;
}
