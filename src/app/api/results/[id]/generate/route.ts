import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { AIInput, AIConsumerInput, AIProductInput, generateProductSelection } from "@/lib/ai";
import { calculateSystemRequirements } from "@/lib/calculations";
import { getAISettings } from "@/app/actions/settings";
import { getGeneralSettings } from "@/app/actions/general-settings";
import { appendAmazonTag } from "@/lib/affiliate";
import { formatFormDataForAI, formatProductsForAI, AIProductContext, formatFormDataCompact } from "@/lib/format-for-ai";

// POST /api/results/[id]/generate - Generate AI recommendations
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log("--- API ROUTE HIT: /api/results/[id]/generate ---");
    try {
        const { id } = await params;
        console.log("Result ID:", id);

        // Fetch result
        const result = await prisma.result.findUnique({
            where: { id },
        });

        if (!result) {
            return NextResponse.json(
                { error: "Result nicht gefunden" },
                { status: 404 }
            );
        }

        // Check if expired
        if (new Date() > result.expiresAt) {
            return NextResponse.json(
                { error: "Result ist abgelaufen" },
                { status: 410 }
            );
        }

        // Parse form data
        const formData = result.formData as any;

        // --- 1. Calculate Requirements (TS) ---
        const consumers: AIConsumerInput[] = (formData.consumers || []).map((c: any) => ({
            name: c.name,
            power: c.power,
            hoursPerDay: c.usageHoursPerDay,
        }));

        const calculationInput: AIInput = {
            vehicleType: formData.vehicleType || "campervan",
            voltage: parseInt(formData.systemVoltage?.replace("V", "") || "12"),
            batteryType: formData.batteryPreference || "any",
            energySources: formData.energySources || [],
            consumers,
            travelBehavior: formData.travelBehavior || { season: "all", tripDuration: "week", winterLocation: "varies", standingDuration: "medium" },
            autarkyDays: formData.autarchyDays || 3,
            solarConfig: { setupType: "roof", roofModuleType: "rigid", portableBags: [] },
            cabling: { starterToService: 0, serviceToInverter: 0, solarToRegulator: 0 },
            comfortLevel: formData.comfortLevel || "standard",
            products: [], // Not needed for calc
        };

        const calculations = calculateSystemRequirements(calculationInput);

        // --- 2. Single-Pass Product Selection ---

        // Fetch all products
        const allProducts = await prisma.product.findMany({
            where: { isActive: true },
            include: { category: true },
        });

        // Determine required categories helps validatity but for a General Prompt we trust the AI/Prompt
        // We pass ALL products to context

        const settings = await getAISettings();
        const generalSettings = await getGeneralSettings();
        const amazonPartnerTag = generalSettings.amazonPartnerTag;

        // Prepare shared formatted prompt
        let formattedPrompt = "";
        try {
            formattedPrompt = formatFormDataForAI(formData);
        } catch (e) {
            console.error("Error formatting form data:", e);
            formattedPrompt = formatFormDataCompact(formData);
        }

        // Prepare Full Product Context
        const productContext = formatProductsForAI(allProducts as unknown as AIProductContext[]);

        // Call AI
        const selectedIds = await generateProductSelection(
            { ...calculationInput, formattedPrompt, productContext },
            settings.userPromptTemplate
        );

        // Call AI using generic type return (string) - we parse it manually
        // We know generateProductSelection returns a string[] OR object if we modify it.
        // Actually generateProductSelection in lib/ai.ts is typed to return string[].
        // We need to bypass or update lib/ai.ts too.
        // BUT generateProductSelection merely parses whatever JSON it gets.
        // Let's modify generateProductSelection in lib/ai.ts to return 'any' or update it later.

        // Wait, generateProductSelection strictly looks for `selectedIds`.
        // We need to update lib/ai.ts to support `productGroups`?
        // Or we can cheat and let the AI return `selectedIds` as a flat list AND `productGroups` in the same JSON?
        // Prompt says "Antworte ausschließlich mit einem JSON-Objekt...".
        // The current lib/ai.ts looks for `selectedIds` or `productGroups`?
        // Let's check lib/ai.ts again. It looks for `json.selectedIds`.

        // We must update lib/ai.ts to support the new format OR we make the AI return BOTH formats (redundant but easier without touching lib/ai recursively).
        // PROPOSAL: Update the prompt to include a flat list just for the parsing logic? NO, that confuses the grouping.

        // BETTER: Use a new function or update `generateProductSelection` to optional generic return.
        // Since I can't edit lib/ai.ts easily without potentially breaking other things (though it seems dedicated to this flow).

        // Let's update lib/ai.ts to handle `productGroups`.

        // Actually, let's assume I update lib/ai.ts first.
        // I will do that in the next step.
        // For now, let's write the route logic assuming `generateProductSelection` returns the full JSON object or we change how we call it.

        const aiResponseRaw = await generateProductSelection(
            { ...calculationInput, formattedPrompt, productContext },
            settings.userPromptTemplate
        );

        // We need to cast or parse. 
        // If I update generateProductSelection to return `any`, then:
        const aiResponse = aiResponseRaw as any;

        const selectedProductsEnriched: any[] = [];
        const foundCategories = new Set<string>();

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
                                selectedProductsEnriched.push({
                                    productId: product.id,
                                    quantity: 1,
                                    reason: pItem.reason || "Basierend auf deinen Anforderungen ausgewählt.",
                                    isRecommended: !!pItem.isRecommended, // Catch the flag
                                    name: product.name,
                                    affiliateUrl: appendAmazonTag(product.affiliateUrl, amazonPartnerTag),
                                    imageUrl: product.imageUrl,
                                    price: product.price,
                                    category: product.category.slug
                                });
                            }
                        }
                    }
                }
            }
        }
        // Fallback or Legacy (if AI fails strict JSON and returns flat list or old prompt used)
        else if (Array.isArray(aiResponse)) {
            // This happens if generateProductSelection fell back to array of strings
            for (const productId of aiResponse) {
                const product = allProducts.find(p => p.id === productId);
                if (product) {
                    foundCategories.add(product.category.slug);
                    selectedProductsEnriched.push({
                        productId: product.id,
                        quantity: 1,
                        reason: "Basierend auf deinen Anforderungen ausgewählt.",
                        isRecommended: true, // Default to true for single list
                        name: product.name,
                        affiliateUrl: appendAmazonTag(product.affiliateUrl, amazonPartnerTag),
                        imageUrl: product.imageUrl,
                        price: product.price,
                        category: product.category.slug
                    });
                }
            }
        }

        // --- 4. Check for Missing Categories ---
        const warnings: string[] = [];
        const requiredCategories = new Map<string, string>(); // slug -> display name

        // Always require Battery (core component)
        requiredCategories.set("batterie", "Batterie");

        // Solar
        if (formData.energySources?.includes("solar")) {
            requiredCategories.set("solar-laderegler", "Solar-Laderegler");
            requiredCategories.set("solarmodule", "Solarmodul");
        }

        // Alternator / Booster
        if (formData.energySources?.includes("alternator")) {
            requiredCategories.set("ladebooster", "Ladebooster");
        }

        // Shore Power / Charger
        if (formData.energySources?.includes("shore_power")) {
            requiredCategories.set("ladegeraet", "Ladegerät (Landstrom)");
        }

        // Inverter (if 230V consumers exist)
        const has230VConsumers = formData.consumers?.some((c: any) => c.voltage === "230V" || c.voltage.includes("230"));
        if (has230VConsumers) {
            requiredCategories.set("wechselrichter", "Wechselrichter");
        }

        // Check for missing
        for (const [slug, name] of requiredCategories.entries()) {
            if (!foundCategories.has(slug)) {
                // Add explicit "Not Found" entry for UI
                selectedProductsEnriched.push({
                    productId: `missing-${slug}`, // clear marker
                    quantity: 0,
                    reason: "Kein passendes Produkt gefunden.",
                    name: `Kein passendes Produkt für ${name} gefunden`,
                    affiliateUrl: null,
                    imageUrl: null,
                    price: null,
                    category: slug,
                    isMissing: true // Flag for frontend if needed
                });
                warnings.push(`Konnte kein passendes Produkt für die Kategorie '${name}' finden.`);
            }
        }

        const recommendations = {
            selectedProducts: selectedProductsEnriched,
            warnings: warnings,
            explanation: "Die Produktauswahl basiert auf einer detaillierten Analyse deiner Anforderungen. Wir haben versucht, für jede relevante Kategorie das optimale Produkt zu finden.",
        };

        const updatedResult = await prisma.result.update({
            where: { id },
            data: {
                calculations: JSON.parse(JSON.stringify(calculations)),
                recommendations: JSON.parse(JSON.stringify(recommendations)),
                schematicData: {},
                version: result.version + 1,
            },
        });

        return NextResponse.json({
            success: true,
            calculations: calculations,
            recommendations: recommendations,
            schematic: {},
            result: updatedResult,
            debugInfo: {
                provider: settings.provider,
                model: settings.model,
                hasGeminiKey: !!settings.geminiApiKey,
                hasOpenAIKey: !!settings.openaiApiKey,
                amazonTag: amazonPartnerTag,
            }
        });

    } catch (error) {
        console.error("Error generating AI recommendations:", error);

        // Try to fetch settings for debug info, fail safe
        let debugSettings: any = { provider: "unknown", model: "unknown" };
        try {
            const { getAISettings } = await import("@/app/actions/settings");
            debugSettings = await getAISettings();
        } catch (e) { }

        return NextResponse.json({
            error: error instanceof Error ? error.message : "Interner Serverfehler",
            debugInfo: {
                provider: debugSettings.provider || "unknown",
                model: debugSettings.model || "unknown",
                hasGeminiKey: !!debugSettings.geminiApiKey,
                hasOpenAIKey: !!debugSettings.openaiApiKey,
                errorDetails: error instanceof Error ? error.message : String(error)
            }
        }, { status: 500 });
    }
}
