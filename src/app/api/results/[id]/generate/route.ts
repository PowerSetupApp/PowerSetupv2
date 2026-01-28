import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { AIInput, AIConsumerInput, AIProductInput, generateProductSelection } from "@/lib/ai";
// calculateSystemRequirements is now part of @/lib/algorithm but not used directly here
import { getAISettings } from "@/app/actions/settings";
import { getGeneralSettings } from "@/app/actions/general-settings";
import { getAlgorithmSettings } from "@/app/actions/algorithm-settings";
import { appendAmazonTag } from "@/lib/affiliate";
import { formatFormDataForAI, formatProductsForAI, AIProductContext, formatFormDataCompact, formatSystemRequirementsForAI } from "@/lib/format-for-ai";
import { preFilterProducts, getFilterStats, preselectProducts, formatPreselectionForAI, type ProductWithFilter, type SystemRequirements } from "@/lib/algorithm";

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
            voltage: typeof formData.systemVoltage === 'number' ? formData.systemVoltage : parseInt(String(formData.systemVoltage).replace("V", "") || "12"),
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

        // Note: calculations are already precomputed and stored in result.calculations
        // Use those instead of recalculating

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
        const algorithmSettings = await getAlgorithmSettings();
        const amazonPartnerTag = generalSettings.amazonPartnerTag;

        // Get min score threshold from settings (default 30)
        const minScoreThreshold = algorithmSettings.minPreselectionScore ?? 30;

        // Prepare Full Product Context - with pre-filtering
        const preCalculatedRequirements = result.calculations as unknown as SystemRequirements | null;

        // DEBUG: Log calculations status
        console.log(`[DEBUG] result.calculations exists: ${!!result.calculations}`);
        console.log(`[DEBUG] preCalculatedRequirements: ${preCalculatedRequirements ? 'has data' : 'null/undefined'}`);
        if (preCalculatedRequirements) {
            console.log(`[DEBUG] systemVoltage: ${preCalculatedRequirements.systemVoltage}`);
        }

        // Prepare shared formatted prompt
        let formattedPrompt = "";
        try {
            // Enhance formData with calculated values and fallbacks for old data
            const enhancedFormData = {
                ...formData,
                recommendedCapacityAh: preCalculatedRequirements?.battery?.recommendedCapacityAh || null,
                // Fallback: If roofAreas is missing or empty, derive from solarDimensions
                roofAreas: (formData.roofAreas && formData.roofAreas.length > 0)
                    ? formData.roofAreas
                    : (formData.solarDimensions
                        ? [{ id: 'main', name: 'main', length: formData.solarDimensions.length, width: formData.solarDimensions.width }]
                        : [{ id: 'main', name: 'main', length: 200, width: 100 }]),
                // Fallback for vehicleVoltage
                vehicleVoltage: formData.vehicleVoltage || 12,
            };
            formattedPrompt = formatFormDataForAI(enhancedFormData);
        } catch (e) {
            console.error("Error formatting form data:", e);
            formattedPrompt = formatFormDataCompact(formData);
        }

        let compatibleProducts = allProducts as unknown as ProductWithFilter[];
        let preselectionContext = "";

        // Only run preselection if we have calculated requirements
        if (preCalculatedRequirements && preCalculatedRequirements.systemVoltage) {
            // Step 1: Basic compatibility filter (voltage, battery type)
            compatibleProducts = preFilterProducts(
                allProducts as unknown as ProductWithFilter[],
                preCalculatedRequirements
            );

            const filterStats = getFilterStats(allProducts as unknown as ProductWithFilter[], compatibleProducts);
            console.log(`[Product Pre-Filter] ${filterStats.total} → ${filterStats.filtered} products (${filterStats.removed} removed)`);

            // Step 2: Advanced preselection with Match-Scores
            const preselection = preselectProducts(
                compatibleProducts,
                preCalculatedRequirements,
                formData,
                minScoreThreshold
            );

            console.log(`[Product Preselection] Score threshold: ${minScoreThreshold}, selected: ${preselection.selectedProducts} products`);
            for (const cat of preselection.categories) {
                console.log(`  - ${cat.categoryName}: ${cat.candidates.length} candidates`);
            }

            // Format preselection for AI prompt (with scores)
            preselectionContext = formatPreselectionForAI(preselection);
        } else {
            console.log(`[Product Preselection] Skipped - no calculations available`);
        }

        // Also keep the regular product context for full list
        const productContext = formatProductsForAI(compatibleProducts as unknown as AIProductContext[]);

        // Prepare Pre-calculated Requirements Context
        const requirementsContext = preCalculatedRequirements
            ? formatSystemRequirementsForAI(preCalculatedRequirements as any)
            : "";

        // Call AI
        // Call AI
        const { data: aiResponseRaw, usage, model } = await generateProductSelection(
            { ...calculationInput, formattedPrompt, productContext, requirementsContext, preselectionContext },
            settings.userPromptTemplate
        );

        // We need to cast or parse.
        const aiResponse = aiResponseRaw as any;

        const selectedProductsEnriched: any[] = [];
        const foundCategories = new Set<string>();
        // Track AI groupKey for each DB category slug (for alternatives later)
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
                                // Track the AI groupKey for this DB category slug
                                categorySlugToAIGroupKey.set(product.category.slug, categorySlug);
                                selectedProductsEnriched.push({
                                    productId: product.id,
                                    quantity: (() => {
                                        // 1. Get AI Quantity
                                        let qty = pItem.quantity || 1;

                                        // 2. Battery Safety Override
                                        if ((product.category.slug === 'batterie' || product.category.slug === 'batterien') && preCalculatedRequirements?.battery?.recommendedCapacityAh) {
                                            try {
                                                const specs: any = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
                                                const cap = specs?.capacityAh || specs?.capacity;
                                                if (cap && cap > 0) {
                                                    const needed = Math.ceil(preCalculatedRequirements.battery.recommendedCapacityAh / cap);
                                                    if (needed > 0 && needed !== qty) {
                                                        console.log(`[Battery Qty Override] Product: ${product.name}`);
                                                        console.log(`  - AI suggested: ${qty}x`);
                                                        console.log(`  - Calculated: ${needed}x (${preCalculatedRequirements.battery.recommendedCapacityAh}Ah ÷ ${cap}Ah)`);
                                                        console.log(`  - Using calculated value: ${needed}x`);
                                                        qty = needed;
                                                    } else if (needed === qty) {
                                                        console.log(`[Battery Qty Check] Product: ${product.name} - AI and calculated agree: ${qty}x`);
                                                    }
                                                }
                                            } catch (e) {
                                                console.error("[Battery Qty Override] Error parsing battery specs:", e);
                                            }
                                        }

                                        // 3. Solar Module Safety Override (AI often confuses roof dimensions with quantity!)
                                        if (product.category.slug === 'solarmodule' && preCalculatedRequirements?.solarModules?.requiredWp) {
                                            try {
                                                const specs: any = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
                                                const moduleWp = specs?.maxPowerWp || specs?.powerWp || specs?.peakPowerWp;
                                                if (moduleWp && moduleWp > 0) {
                                                    const needed = Math.ceil(preCalculatedRequirements.solarModules.requiredWp / moduleWp);

                                                    // Sanity check: If AI suggests absurd quantity (>50), definitely override
                                                    // If AI suggests reasonable quantity but different from calculated, log and validate
                                                    if (qty > 50) {
                                                        console.warn(`[Solar Qty Override - CRITICAL] Product: ${product.name}`);
                                                        console.warn(`  - AI suggested ABSURD quantity: ${qty}x (likely confused with roof dimensions!)`);
                                                        console.warn(`  - Calculated: ${needed}x (${preCalculatedRequirements.solarModules.requiredWp}Wp ÷ ${moduleWp}Wp)`);
                                                        console.warn(`  - FORCING calculated value: ${needed}x`);
                                                        qty = needed;
                                                    } else if (needed > 0 && needed !== qty) {
                                                        console.log(`[Solar Qty Override] Product: ${product.name}`);
                                                        console.log(`  - AI suggested: ${qty}x`);
                                                        console.log(`  - Calculated: ${needed}x (${preCalculatedRequirements.solarModules.requiredWp}Wp ÷ ${moduleWp}Wp)`);
                                                        console.log(`  - Using calculated value: ${needed}x`);
                                                        qty = needed;
                                                    } else if (needed === qty) {
                                                        console.log(`[Solar Qty Check] Product: ${product.name} - AI and calculated agree: ${qty}x`);
                                                    }
                                                }
                                            } catch (e) {
                                                console.error("[Solar Qty Override] Error parsing solar module specs:", e);
                                            }
                                        }

                                        return qty;
                                    })(),
                                    reason: pItem.reason || "Basierend auf deinen Anforderungen ausgewählt.",
                                    isRecommended: !!pItem.isRecommended, // Catch the flag
                                    name: product.name,
                                    affiliateUrl: appendAmazonTag(product.affiliateUrl || "", amazonPartnerTag),
                                    imageUrl: product.imageUrl,
                                    price: product.price,
                                    category: product.category.slug,
                                    groupKey: categorySlug // Store the AI-provided group key (e.g. "Solar-Laderegler (Dach)")
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
                        affiliateUrl: appendAmazonTag(product.affiliateUrl || "", amazonPartnerTag),
                        imageUrl: product.imageUrl,
                        price: product.price,
                        category: product.category.slug
                    });
                }
            }
        }

        // --- 4. Inject Alternative Products from Preselection ---
        // For each category in our preselection, add top candidates that are NOT already recommended
        if (preCalculatedRequirements && preCalculatedRequirements.systemVoltage) {
            const preselection = preselectProducts(
                compatibleProducts,
                preCalculatedRequirements,
                formData,
                minScoreThreshold
            );

            const alreadySelectedIds = new Set(selectedProductsEnriched.map((p: any) => p.productId));

            for (const category of preselection.categories) {
                // Get the AI groupKey that was used for this category (fallback to categoryName)
                const aiGroupKey = categorySlugToAIGroupKey.get(category.categorySlug) || category.categoryName;

                // Check if there are already recommended products in this category
                const hasRecommendedInCategory = selectedProductsEnriched.some(
                    (p: any) => p.category === category.categorySlug && p.isRecommended
                );

                // Find candidates that are not already selected
                const alternatives = category.candidates
                    .filter(c => !alreadySelectedIds.has(c.product.id))
                    .slice(0, 1); // Max 1 alternative per category

                for (const alt of alternatives) {
                    const product = allProducts.find(p => p.id === alt.product.id);
                    if (product) {
                        // If no recommended product exists in this category, mark this as recommended
                        const isRecommended = !hasRecommendedInCategory;

                        // Use calculated quantity from preselection, default to 1 if not available
                        const quantity = alt.quantity || 1;

                        selectedProductsEnriched.push({
                            productId: product.id,
                            quantity: quantity,
                            reason: alt.matchReason, // Use matchReason directly without score prefix
                            isRecommended: isRecommended,
                            isOptional: false, // NOT optional, should appear in main group
                            name: product.name,
                            affiliateUrl: appendAmazonTag(product.affiliateUrl || "", amazonPartnerTag),
                            imageUrl: product.imageUrl,
                            price: product.price,
                            category: product.category.slug,
                            groupKey: aiGroupKey // Use the same groupKey as AI recommendations
                        });
                        alreadySelectedIds.add(product.id); // Prevent duplicates
                    }
                }
            }
        }

        // --- 5. Check for Missing Categories ---
        const warnings: string[] = [];
        const requiredCategories = new Map<string, string>(); // slug -> display name

        // Always require Battery (core component)
        requiredCategories.set("batterien", "Batterie");

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
            requiredCategories.set("batterieladegeraete", "Ladegerät (Landstrom)");
        }

        // Inverter (if 230V consumers exist)
        const has230VConsumers = formData.consumers?.some((c: any) => c.voltage === 230 || c.voltage === "230V");
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
                calculations: result.calculations ? JSON.parse(JSON.stringify(result.calculations)) : undefined, // Keep pre-stored calculations
                recommendations: JSON.parse(JSON.stringify(recommendations)),
                schematicData: {},
                version: result.version + 1,
                aiModel: model,
                inputTokens: usage?.inputTokens || 0,
                outputTokens: usage?.outputTokens || 0,
            },
        });

        return NextResponse.json({
            success: true,
            calculations: preCalculatedRequirements,
            recommendations: recommendations,
            schematic: {},
            result: updatedResult,
            debugInfo: {
                provider: settings.provider,
                model: model,
                inputTokens: usage?.inputTokens,
                outputTokens: usage?.outputTokens,
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
