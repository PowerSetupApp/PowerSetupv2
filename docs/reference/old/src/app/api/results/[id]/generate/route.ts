import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatFormDataCompact, formatSystemRequirementsForAI, formatProductsForAI, type SystemRequirementsForAI, formatFormDataForAI } from "@/lib/format-for-ai";
import { formatPreselectionForAI, type PreselectionResult } from "@/lib/algorithm/product-preselection";
import { getAISettings, type AISettings } from "@/app/actions/settings";
import { getGeneralSettings } from "@/app/actions/general-settings";
import { getAlgorithmSettings } from "@/app/actions/algorithm-settings";
import { type AIInput, type AIConsumerInput, generateProductSelection } from "@/lib/ai";
import { updateResult } from "@/app/actions/results";
import {
    calculateSystemRequirements,
    preselectProducts,
    preFilterProducts,
    getFilterStats,
    type ProductWithFilter,
    type PreselectedProduct,
    type SystemRequirements
} from "@/lib/algorithm";
import { generateRecommendation } from "@/lib/recommendation";

// POST /api/results/[id]/generate - Generate AI recommendations
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

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
            include: { category: true, brand: { select: { name: true } } },
        });

        // Determine required categories helps validatity but for a General Prompt we trust the AI/Prompt
        // We pass ALL products to context

        const aiSettings = await getAISettings();
        const generalSettings = await getGeneralSettings();
        const algorithmSettings = await getAlgorithmSettings();
        const amazonPartnerTag = generalSettings.amazonPartnerTag;

        // Get min score threshold from settings (default 30)
        const minScoreThreshold = algorithmSettings.minPreselectionScore ?? 30;

        // Prepare Full Product Context - with pre-filtering
        // FORCE RE-CALCULATION to ensure latest algorithm logic is applied
        // Map flat formData fields to the customOverrides structure that the algorithm expects
        const wizardInput = {
            ...formData,
            customOverrides: {
                battery: formData.customBatteryCapacity ?? null,
                solar: formData.customSolarPower ?? null,
                booster: formData.customBoosterCurrent ?? null,
                controller: formData.customSolarControllerCurrent ?? null,
                inverter: formData.customInverterPower ?? null,
                charger: formData.customChargerCurrent ?? null,
            },
        };
        const preCalculatedRequirements = await calculateSystemRequirements(wizardInput as any);

        // Prepare shared formatted prompt
        let formattedPrompt = "";
        try {
            // Enhance formData with calculated values and fallbacks for old data
            const enhancedFormData = {
                ...formData,
                recommendedCapacityAh: preCalculatedRequirements?.battery?.recommendedCapacityAh || null,
                calculatedDailyWh: preCalculatedRequirements?.battery?.dailyWh || null,
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

        let compatibleProducts = allProducts.map(p => ({
            ...p,
            brandName: (p as any).brand?.name ?? null,
        })) as unknown as ProductWithFilter[];
        let preselectionContext = "";
        let preselection = null;

        // Only run preselection if we have calculated requirements
        if (preCalculatedRequirements && preCalculatedRequirements.systemVoltage) {
            // Step 1: Basic compatibility filter (voltage, battery type)
            compatibleProducts = preFilterProducts(
                allProducts as unknown as ProductWithFilter[],
                preCalculatedRequirements
            );

            const filterStats = getFilterStats(allProducts as unknown as ProductWithFilter[], compatibleProducts);

            // Step 2: Advanced preselection with Match-Scores
            const brandPreferences = {
                charger: formData.brandPreferenceCharger ?? null,
                battery: formData.brandPreferenceBattery ?? null,
                solar: formData.brandPreferenceSolar ?? null,
            };
            preselection = preselectProducts(
                compatibleProducts,
                preCalculatedRequirements,
                formData,
                minScoreThreshold,
                brandPreferences
            );

            // Format preselection for AI prompt (with scores)
            preselectionContext = formatPreselectionForAI(preselection);
        } else {
            // Create empty preselection object to avoid errors
            preselection = {
                selectedProducts: 0,
                categories: [],
                totalProducts: 0,
                minScoreThreshold: 0
            };
        }

        // --- 3. Recommendation Engine ---

        // Recommendation Mode Casten (Fallback auf Algorithm wenn DB Feld leer)
        const recConfig = {
            productSelectionMode: (algorithmSettings.productSelectionMode || 'algorithm') as 'algorithm' | 'hybrid',
            reasonGenerationMode: (algorithmSettings.reasonGenerationMode || 'algorithm') as 'algorithm' | 'ai' | 'none'
        };

        // Context vorbereiten
        // Note: productContext and requirementsContext kept optional/undefined if not needed by new engine
        const recContext = {
            preselection,
            allProducts,
            formData,
            preCalculatedRequirements: preCalculatedRequirements as any,
            amazonPartnerTag: amazonPartnerTag,

            // AI Context (wird nur für Hybrid/AI Modes benötigt)
            calculationInput,
            formattedPrompt,
            preselectionContext,
            aiSettings,
        };

        // Engine aufrufen
        const { selectedProducts: selectedProductsEnriched, aiUsage, explanation } = await generateRecommendation(recConfig, recContext);

        // --- 4. Update Database ---
        const recommendations = {
            selectedProducts: selectedProductsEnriched,
            warnings: explanation ? [explanation] : [], // Add explanation as a note/warning for now
            explanation: explanation,
            debugInfo: {
                aiModel: aiUsage?.model || 'unknown',
                inputTokens: aiUsage?.inputTokens || 0,
                outputTokens: aiUsage?.outputTokens || 0
            }
        };

        const updatedResult = await prisma.result.update({
            where: { id, version: result.version },
            data: {
                calculations: preCalculatedRequirements ? JSON.parse(JSON.stringify(preCalculatedRequirements)) : undefined,
                recommendations: JSON.parse(JSON.stringify(recommendations)),
                schematicData: {},
                version: result.version + 1,
                aiModel: aiUsage?.model || 'unknown',
                inputTokens: aiUsage?.inputTokens || 0,
                outputTokens: aiUsage?.outputTokens || 0,
            },
        }).catch((e: any) => {
            if (e?.code === 'P2025') {
                throw new Error('CONFLICT');
            }
            throw e;
        });


        return NextResponse.json({
            success: true,
            calculations: preCalculatedRequirements,
            recommendations: recommendations,
            schematic: {},
            result: updatedResult,
            debugInfo: {
                provider: aiSettings.provider,
                model: aiUsage?.model || 'unknown',
                inputTokens: aiUsage?.inputTokens || 0,
                outputTokens: aiUsage?.outputTokens || 0,
                hasGeminiKey: !!aiSettings.geminiApiKey,
                hasOpenAIKey: !!aiSettings.openaiApiKey,
                amazonTag: amazonPartnerTag,
                mode: recConfig
            }
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'CONFLICT') {
            return NextResponse.json(
                { error: "Konflikt: Die Empfehlungen wurden bereits von einer anderen Anfrage generiert. Bitte Seite neu laden." },
                { status: 409 }
            );
        }

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
