"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Prisma } from "@prisma/client";
import { formatFormDataForAI, formatFormDataCompact, formatProductsForAI, type AIProductContext } from "@/lib/format-for-ai";

interface ResultJsonViewerProps {
    resultId: string;
    formData: Prisma.JsonValue;
    calculations: Prisma.JsonValue;
    recommendations: Prisma.JsonValue;
    schematicData: Prisma.JsonValue;
    productContext?: string;
    fullPrompt?: string;
    products?: any[];
}

type ViewMode = "formatted" | "json" | "compact" | "products" | "full_prompt" | "selected_products_context" | "user_selection";

export default function ResultJsonViewer({
    resultId,
    formData,
    calculations,
    recommendations,
    schematicData,
    productContext,
    fullPrompt,
    products,
}: ResultJsonViewerProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiResponse, setAiResponse] = useState<object | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("formatted");

    // Debug Mount
    useMemo(() => {
        console.log("--- Frontend: ResultJsonViewer MOUNTED ---");
    }, []);

    // Use AI response if available, otherwise fallback to props
    const rawRecommendations = (aiResponse as any)?.recommendations || recommendations;

    // Filter out price from recommendations before displaying
    const activeRecommendations = useMemo(() => {
        if (!rawRecommendations || typeof rawRecommendations !== 'object') return rawRecommendations;

        const recs = { ...rawRecommendations } as any;
        if (Array.isArray(recs.selectedProducts)) {
            recs.selectedProducts = recs.selectedProducts.map((p: any) => {
                const { price, ...rest } = p;
                return rest;
            });
        }
        return recs;
    }, [rawRecommendations]);

    const hasRecommendations = activeRecommendations &&
        (activeRecommendations.selectedProducts?.length > 0 || Object.keys(activeRecommendations).length > 0);

    // Format the formData for AI
    const formattedText = useMemo(() => {
        if (!formData || typeof formData !== 'object') return 'Keine Daten vorhanden';
        try {
            return formatFormDataForAI(formData as unknown as Parameters<typeof formatFormDataForAI>[0]);
        } catch (e) {
            console.error('Error formatting for AI:', e);
            return 'Fehler beim Formatieren der Daten';
        }
    }, [formData]);

    const compactText = useMemo(() => {
        if (!formData || typeof formData !== 'object') return 'Keine Daten';
        try {
            return formatFormDataCompact(formData as unknown as Parameters<typeof formatFormDataCompact>[0]);
        } catch (e) {
            return 'Fehler';
        }
    }, [formData]);

    // Format Selected Products for AI Context
    const selectedProductsContext = useMemo(() => {
        if (!activeRecommendations || !activeRecommendations.selectedProducts || !products) return null;

        try {
            console.log("--- DEBUG Products Context ---");
            console.log("Products available:", products.length);
            console.log("Recommendations selected:", activeRecommendations.selectedProducts);

            // FIX: The recommendations use 'productId', but the DB products use 'id'
            const selectedIds = new Set(activeRecommendations.selectedProducts.map((p: any) => p.productId));
            const selectedItems = products.filter((p: any) => selectedIds.has(p.id));

            console.log("Matched Items:", selectedItems.length);

            if (selectedItems.length === 0) return "Keine passenden Produkte in der Datenbank gefunden.";

            // Map to AIProductContext shape
            const contextItems: AIProductContext[] = selectedItems.map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category ? { name: p.category.name, slug: p.category.slug } : { name: 'Unbekannt', slug: 'unknown' },
                price: p.price,
                specs: p.specs,
                imageUrl: p.imageUrl
            }));

            return formatProductsForAI(contextItems);
        } catch (e) {
            console.error("Error formatting selected products:", e);
            return "Fehler beim Formatieren der ausgewählten Produkte.";
        }
    }, [activeRecommendations, products]);

    const handleGenerateAI = async () => {
        // ALERT to verify click
        alert("Button Clicked! Check Console.");
        console.log("--- Frontend: Generating AI Recommendations (Button Clicked) ---");
        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch(`/api/results/${resultId}/generate`, {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Fehler beim Generieren");
            }

            const data = await response.json();
            setAiResponse(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unbekannter Fehler");
        } finally {
            setIsGenerating(false);
        }
    };

    // Format User Selected Products for AI Context
    const userSelectionContext = useMemo(() => {
        const sel = (schematicData as any)?.userSelection; // array of IDs
        if (!sel || !Array.isArray(sel) || !products) return null;

        const selectedItems = products.filter((p: any) => sel.includes(p.id));
        if (selectedItems.length === 0) return "Keine Auswahl gespeichert.";

        const contextItems: AIProductContext[] = selectedItems.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category ? { name: p.category.name, slug: p.category.slug } : { name: 'Unbekannt', slug: 'unknown' },
            price: p.price,
            specs: p.specs
        }));

        return formatProductsForAI(contextItems);
    }, [schematicData, products]);

    return (
        <div className="space-y-6">
            {/* ... (Selected Products) ... */}

            {/* View Mode Toggle */}
            <div className="flex gap-2 flex-wrap">
                <Button variant={viewMode === "formatted" ? "default" : "outline"} onClick={() => setViewMode("formatted")}>
                    🤖 KI-Format
                </Button>
                <Button variant={viewMode === "compact" ? "default" : "outline"} onClick={() => setViewMode("compact")}>
                    📝 Kompakt
                </Button>
                <Button variant={viewMode === "json" ? "default" : "outline"} onClick={() => setViewMode("json")}>
                    📋 JSON
                </Button>
                {productContext && (
                    <Button variant={viewMode === "products" ? "default" : "outline"} onClick={() => setViewMode("products")}>
                        📦 Alle Produkte (Kontext)
                    </Button>
                )}
                {fullPrompt && (
                    <Button variant={viewMode === "full_prompt" ? "default" : "outline"} onClick={() => setViewMode("full_prompt")}>
                        🔮 Kompletter Prompt
                    </Button>
                )}
                {selectedProductsContext && (
                    <Button variant={viewMode === "selected_products_context" ? "default" : "outline"} onClick={() => setViewMode("selected_products_context")}>
                        ✨ Vorgeschlagene Produkte
                    </Button>
                )}
                {userSelectionContext && (
                    <Button variant={viewMode === "user_selection" ? "default" : "outline"} onClick={() => setViewMode("user_selection")}>
                        🛒 Ausgewählte Produkte (Final)
                    </Button>
                )}
            </div>

            {/* Compact Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-mono">
                    {compactText}
                </p>
            </div>

            {/* Main Content based on view mode */}
            {viewMode === "formatted" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                            🤖 KI-Prompt-Format
                        </div>
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500">
                            {"{{PROMPT_FORMAT}}"}
                        </span>
                    </h2>
                    <pre className="p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-b-lg">
                        {formattedText}
                    </pre>
                </div>
            )}

            {viewMode === "compact" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700">
                        📝 Kompakte Zusammenfassung
                    </h2>
                    <div className="p-4">
                        <p className="text-lg">{compactText}</p>
                    </div>
                </div>
            )}

            {viewMode === "json" && (
                <div className="space-y-4">
                    <JsonSection title="📋 Formular-Daten (formData)" data={formData} />
                    <JsonSection title="🧮 Berechnungen (calculations)" data={calculations} emptyMessage="Noch keine Berechnungen vorhanden" />
                    <JsonSection title="📦 Empfehlungen (recommendations)" data={activeRecommendations} emptyMessage="Noch keine Empfehlungen vorhanden" />
                    <JsonSection title="⚡ Schaltplan-Daten (schematicData)" data={schematicData} emptyMessage="Noch keine Schaltplan-Daten vorhanden" />
                </div>
            )}

            {viewMode === "products" && productContext && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                            📦 Produkte für KI-Kontext
                        </div>
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500">
                            {"{{PRODUCT_CONTEXT}}"}
                        </span>
                    </h2>
                    <pre className="p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-b-lg">
                        {productContext}
                    </pre>
                </div>
            )}

            {viewMode === "full_prompt" && fullPrompt && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                        🔮 Kompletter Prompt (Vorschau)
                        <span className="text-sm font-normal text-muted-foreground">
                            (So wird er an die API geschickt)
                        </span>
                    </h2>
                    <pre className="p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-b-lg">
                        {fullPrompt}
                    </pre>
                </div>
            )}

            {viewMode === "selected_products_context" && selectedProductsContext && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                        ✨ Vorgeschlagene Produkte (KI-Vorschlag)
                        <span className="text-sm font-normal text-muted-foreground">
                            (Basis vor User-Auswahl)
                        </span>
                    </h2>
                    <pre className="p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-b-lg">
                        {selectedProductsContext}
                    </pre>
                </div>
            )}

            {viewMode === "user_selection" && userSelectionContext && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                            🛒 Ausgewählte Produkte (Benutzer)
                            <span className="text-sm font-normal text-muted-foreground">
                                (Final für Schaltplan)
                            </span>
                        </div>
                    </h2>
                    <pre className="p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-b-lg">
                        {userSelectionContext}
                    </pre>
                </div>
            )}

            {/* Generate AI Button */}
            {/* Generate/Regenerate AI Button */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200 mb-3">
                    {hasRecommendations
                        ? "Du kannst die Empfehlungen neu generieren lassen."
                        : "Es wurden noch keine KI-Empfehlungen generiert."}
                </p>
                <Button
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                >
                    {isGenerating ? "Generiere..." : (hasRecommendations ? "🔄 Neu Generieren" : "✨ KI-Empfehlungen generieren")}
                </Button>
                {error && (
                    <p className="text-red-600 mt-2">{error}</p>
                )}
            </div>

            {/* AI Response (if just generated) */}
            {
                aiResponse && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                            ✅ Neue KI-Antwort erhalten
                        </h3>
                        <pre className="bg-white dark:bg-gray-800 p-4 rounded overflow-x-auto text-sm">
                            {JSON.stringify(aiResponse, null, 2)}
                        </pre>
                    </div>
                )
            }
        </div >
    );
}

function JsonSection({
    title,
    data,
    emptyMessage = "Keine Daten vorhanden"
}: {
    title: string;
    data: Prisma.JsonValue;
    emptyMessage?: string;
}) {
    const isEmpty = !data || (typeof data === "object" && Object.keys(data as object).length === 0);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700">
                {title}
            </h2>
            {isEmpty ? (
                <p className="p-4 text-gray-500 italic">{emptyMessage}</p>
            ) : (
                <pre className="p-4 overflow-x-auto text-sm font-mono">
                    {JSON.stringify(data, null, 2)}
                </pre>
            )}
        </div>
    );
}
