import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ResultDisplay from "@/components/result/result-display";
import ResultDebugModal from "@/components/result/result-debug-modal";
import { formatProductsForAI } from "@/lib/format-for-ai";

interface ResultPageProps {
    params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
    const { id } = await params;

    // Fetch result from database
    const result = await prisma.result.findUnique({
        where: { id },
        include: {
            creditBalance: true,
        },
    });

    if (!result) {
        notFound();
    }

    // Check if expired
    if (new Date() > result.expiresAt) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-8">
                <h1 className="text-3xl font-bold text-red-600">Ergebnis abgelaufen</h1>
                <p className="mt-4 text-gray-600">
                    Dieses Ergebnis ist am {result.expiresAt.toLocaleDateString("de-DE")} abgelaufen.
                </p>
            </main>
        );
    }

    // Fetch all active products for context
    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { category: { sortOrder: 'asc' } }
    });

    // Format products as context string
    const productContext = formatProductsForAI(products as unknown as import("@/lib/format-for-ai").AIProductContext[]);

    // Fetch AI Settings to get the template
    const { getAISettings } = await import("@/app/actions/settings");
    const { formatFormDataForAI, formatFormDataCompact } = await import("@/lib/format-for-ai");
    // const { DEFAULT_USER_PROMPT_TEMPLATE } = await import("@/lib/ai-prompts"); // Removed

    const settings = await getAISettings();
    const template = settings.userPromptTemplate || "Fehler: Kein Prompt Template gefunden.";

    const { getGeneralSettings } = await import("@/app/actions/general-settings");
    const generalSettings = await getGeneralSettings();
    const { getAmazonLink } = await import("@/lib/amazon-link-helper");

    // Inject Partner Tag into Recommendations
    let recommendationsWithTags = result.recommendations;
    if (generalSettings.amazonPartnerTag && result.recommendations && typeof result.recommendations === 'object') {
        try {
            const recs = JSON.parse(JSON.stringify(result.recommendations)); // Deep clone
            if (Array.isArray(recs.selectedProducts)) {
                recs.selectedProducts = recs.selectedProducts.map((p: any) => ({
                    ...p,
                    affiliateUrl: p.affiliateUrl ? getAmazonLink(p.affiliateUrl, generalSettings.amazonPartnerTag) : p.affiliateUrl
                }));
            }
            recommendationsWithTags = recs;
        } catch (e) {
            console.error("Error injecting partner tags:", e);
        }
    }

    // Format Form Data
    let formattedFormData = "";
    try {
        formattedFormData = formatFormDataForAI(result.formData as any);
    } catch (e) {
        formattedFormData = "Fehler beim Formatieren.";
    }

    // Build the PROMPT (Manual replacement for display purposes)
    // This mimics the logic in lib/ai.ts buildPrompt for the main placeholders
    let fullPrompt = template;
    fullPrompt = fullPrompt.replace(/\{\{PROMPT_FORMAT\}\}/g, formattedFormData);
    fullPrompt = fullPrompt.replace(/\{\{PRODUCT_CONTEXT\}\}/g, productContext);

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                {/* Main Consumer View */}
                <ResultDisplay
                    resultId={id}
                    expiresAt={result.expiresAt}
                    recommendations={recommendationsWithTags}
                    products={products}
                    userConfig={result.formData}
                    calculations={result.calculations}
                />

                {/* Debug Modal (Hidden by default, accessible via bottom-left sticky button) */}
                <ResultDebugModal
                    resultId={id}
                    formData={result.formData}
                    calculations={result.calculations}
                    recommendations={recommendationsWithTags}
                    schematicData={result.schematicData}
                    productContext={productContext}
                    fullPrompt={fullPrompt}
                    products={products}
                />
            </div>
        </main>
    );
}
