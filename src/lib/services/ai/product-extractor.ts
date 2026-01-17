/**
 * AI Product Extractor Service
 * Extracts structured product data from Amazon API responses using OpenAI/Gemini.
 * Uses context-aware prompting based on the target product category.
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AmazonItem } from '../amazon/types';
import { getAISettings } from '@/app/actions/settings';

// Extracted data matching our Prisma Product model fields
export interface ExtractedProductData {
    name: string;
    description: string | null;
    price: number | null;
    imageUrl: string | null;
    affiliateUrl: string | null;
    asin: string;
    // Technical specs (filter fields)
    powerW: number | null;
    capacityAh: number | null;
    voltageV: number | null;
    batteryType: string | null;
    currentA: number | null;
    crossSectionMm2: number | null;
    solarWp: number | null;
    supportedVoltages: number[] | null;
    maxDischargeA: number | null;
    waveform: string | null;
    fuseType: string | null;
    // Brand name for fuzzy matching
    brandName: string | null;
    // Raw specs for display
    specs: string;
}

// Category-specific extraction rules
const CATEGORY_EXTRACTION_RULES: Record<string, string> = {
    'batterien': `
Focus on extracting:
- capacityAh: Battery capacity in Ah (e.g., "100Ah" -> 100)
- voltageV: Nominal voltage (e.g., "12.8V" -> 12, "25.6V" -> 24)
- batteryType: One of "lifepo4", "agm", "gel" (look for "LiFePO4", "Lithium", "AGM", "GEL")
- maxDischargeA: Maximum discharge current in Amps (often near BMS specs)
`,
    'wechselrichter': `
Focus on extracting:
- powerW: Continuous power in Watts (e.g., "2000W Dauerleistung" -> 2000)
- voltageV: Input voltage (e.g., "12V DC" -> 12)
- waveform: "pure_sine" if "reiner Sinus" or "Pure Sine", else "modified_sine"
`,
    'solar-laderegler': `
Focus on extracting:
- currentA: Maximum charging current in Amps (e.g., "15A" -> 15)
- supportedVoltages: Array of supported voltages [12, 24] from "12V/24V Auto"
- Identify if MPPT or PWM type from title/features
`,
    'ladebooster': `
Focus on extracting:
- currentA: Charging current in Amps
- supportedVoltages: Supported battery voltages [12, 24, 48]
`,
    'batterieladegeraete': `
Focus on extracting:
- currentA: Charging current in Amps
- supportedVoltages: Supported voltages
`,
    'solarmodule': `
Focus on extracting:
- solarWp: Peak power in Watts (Wp)
- voltageV: Open circuit voltage if available
`,
    'kabel': `
Focus on extracting:
- crossSectionMm2: Cable cross-section (e.g., "25mm²" -> 25)
`,
    'sicherungen': `
Focus on extracting:
- currentA: Fuse rating in Amps
- fuseType: "thermal" or "magnetic"
`,
};

function buildExtractionPrompt(amazonItem: AmazonItem, categorySlug: string): string {
    const categoryRules = CATEGORY_EXTRACTION_RULES[categorySlug] || '';

    // Serialize the Amazon item data
    const itemJson = JSON.stringify(amazonItem, null, 2);

    return `
You are a technical product data extractor for camper/boat electrical equipment.

## Task
Extract structured data from the following Amazon product JSON.

## Target Category
The user has selected "${categorySlug}" as the product category.

${categoryRules ? `## Category-Specific Rules\n${categoryRules}` : ''}

## Extraction Guidelines
1. **name**: Clean product title (remove excessive keywords, keep brand + model + key specs)
2. **description**: First 2-3 feature bullet points combined, max 200 chars
3. **price**: Numeric value only (e.g., 99.00)
4. **brandName**: Manufacturer/Brand name
5. **voltageV**: Always normalize to 12, 24, or 48 (e.g., "12.8V" -> 12)
6. **supportedVoltages**: Array like [12, 24] if device supports multiple
7. **specs**: Formatted Markdown for display (### Technische Daten\\n- Key: Value)

## Output Format
Return ONLY valid JSON matching this structure:
{
  "name": "string",
  "description": "string | null",
  "price": "number | null",
  "brandName": "string | null",
  "powerW": "number | null",
  "capacityAh": "number | null",
  "voltageV": "number | null",
  "batteryType": "string | null",
  "currentA": "number | null",
  "crossSectionMm2": "number | null",
  "solarWp": "number | null",
  "supportedVoltages": "[number] | null",
  "maxDischargeA": "number | null",
  "waveform": "string | null",
  "fuseType": "string | null",
  "specs": "string"
}

## Amazon Product Data
\`\`\`json
${itemJson}
\`\`\`
`;
}

export async function extractProductData(
    amazonItem: AmazonItem,
    categorySlug: string
): Promise<ExtractedProductData> {
    const settings = await getAISettings();
    const provider = settings.provider;

    const prompt = buildExtractionPrompt(amazonItem, categorySlug);

    console.log(`[AiProductExtractor] Extracting data for ASIN ${amazonItem.asin} (Category: ${categorySlug})`);

    let responseText: string;

    if (provider === 'openai') {
        const apiKey = settings.openaiApiKey;
        if (!apiKey) throw new Error('OpenAI API Key is missing.');

        const openai = new OpenAI({ apiKey });

        let model = settings.model || 'gpt-4o';
        // Safety check: If model string looks like a Google model, fallback to GPT-4o
        if (model.includes('gemini') || model.includes('models/')) {
            console.warn(`[AiProductExtractor] Invalid OpenAI model "${model}" detected. Falling back to gpt-4o.`);
            model = 'gpt-4o';
        }

        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: 'You are a structured data extraction assistant. Output only valid JSON.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' },
        });
        responseText = response.choices[0]?.message?.content || '{}';
    } else {
        // Google Gemini
        const apiKey = settings.geminiApiKey;
        if (!apiKey) throw new Error('Google Gemini API Key is missing.');

        const genAI = new GoogleGenerativeAI(apiKey);
        const preferredModel = settings.model || 'gemini-2.0-flash-exp';

        try {
            const model = genAI.getGenerativeModel({
                model: preferredModel,
                generationConfig: { responseMimeType: 'application/json' },
            });

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            });
            responseText = result.response.text();

        } catch (error: any) {
            console.warn(`[AiProductExtractor] Gemini Error (${error.message}). Checking for OpenAI fallback...`);

            if (settings.openaiApiKey) {
                console.log('[AiProductExtractor] Falling back to OpenAI (gpt-4o)...');
                const openai = new OpenAI({ apiKey: settings.openaiApiKey });
                const response = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: 'You are a structured data extraction assistant. Output only valid JSON.' },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.1,
                    response_format: { type: 'json_object' },
                });
                responseText = response.choices[0]?.message?.content || '{}';
            } else {
                // No fallback available, rethrow
                throw error;
            }
        }
    }

    console.log('[AiProductExtractor] Raw AI Response:', responseText.substring(0, 500));

    // Parse the response
    const parsed = JSON.parse(responseText);

    // Build the extracted data with fallbacks
    const extracted: ExtractedProductData = {
        name: parsed.name || amazonItem.itemInfo?.title?.displayValue || 'Unknown Product',
        description: parsed.description || null,
        price: typeof parsed.price === 'number' ? parsed.price : (amazonItem.offers?.listings?.[0]?.price?.amount || null),
        imageUrl: amazonItem.images?.primary?.large?.url || null,
        affiliateUrl: amazonItem.detailPageUrl || null,
        asin: amazonItem.asin,
        powerW: typeof parsed.powerW === 'number' ? parsed.powerW : null,
        capacityAh: typeof parsed.capacityAh === 'number' ? parsed.capacityAh : null,
        voltageV: typeof parsed.voltageV === 'number' ? parsed.voltageV : null,
        batteryType: parsed.batteryType || null,
        currentA: typeof parsed.currentA === 'number' ? parsed.currentA : null,
        crossSectionMm2: typeof parsed.crossSectionMm2 === 'number' ? parsed.crossSectionMm2 : null,
        solarWp: typeof parsed.solarWp === 'number' ? parsed.solarWp : null,
        supportedVoltages: Array.isArray(parsed.supportedVoltages) ? parsed.supportedVoltages : null,
        maxDischargeA: typeof parsed.maxDischargeA === 'number' ? parsed.maxDischargeA : null,
        waveform: parsed.waveform || null,
        fuseType: parsed.fuseType || null,
        brandName: parsed.brandName || amazonItem.itemInfo?.byLineInfo?.brand?.displayValue || null,
        specs: parsed.specs || '',
    };

    // Post-processing: Ensure extracted technical fields are included in specs
    let specs = extracted.specs;
    const appendSpec = (key: string, value: any, unit: string = '') => {
        if (value !== null && value !== undefined && !specs.toLowerCase().includes(key.toLowerCase())) {
            specs += `\n- ${key}: ${value}${unit}`;
        }
    };

    appendSpec('Leistung', extracted.powerW, ' W');
    appendSpec('Kapazität', extracted.capacityAh, ' Ah');
    appendSpec('Spannung', extracted.voltageV, ' V');
    appendSpec('Max. Ladestrom', extracted.currentA, ' A');
    appendSpec('Max. Entladestrom', extracted.maxDischargeA, ' A');
    appendSpec('Solar-Leistung', extracted.solarWp, ' Wp');
    if (extracted.supportedVoltages) appendSpec('Unterstützte Spannungen', extracted.supportedVoltages.join(', '), ' V');
    appendSpec('Kabelquerschnitt', extracted.crossSectionMm2, ' mm²');
    appendSpec('Batterietyp', extracted.batteryType);
    appendSpec('Wellenform', extracted.waveform);

    extracted.specs = specs.trim();

    console.log('[AiProductExtractor] Extracted:', {
        name: extracted.name,
        brandName: extracted.brandName,
        voltageV: extracted.voltageV,
        currentA: extracted.currentA,
        capacityAh: extracted.capacityAh,
    });

    return extracted;
}
