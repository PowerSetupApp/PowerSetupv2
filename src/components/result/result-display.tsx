"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Share2, Check, ArrowLeft, Plus, RefreshCw, Loader2, Sparkles, Bug } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProductCarousel } from "./product-carousel";
import { CableGrid } from "./cable-grid";
import { useRouter } from "next/navigation";
import { SummaryCard } from "./result-summary-card";
import { SolarBagSuggestion } from "./solar-bag-suggestion";
import { ResultDebugCalculations } from "./result-debug-calculations";

interface Product {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    affiliateUrl: string | null;
    price: number | null;
    category: {
        name: string;
        slug: string; // Add slug to interface
    };
}

interface ResultDisplayProps {
    resultId: string;
    expiresAt: Date;
    recommendations: any; // Using any for flexibility with JSON structure
    products: Product[];
    userConfig?: any; // FormData from DB
    calculations?: any; // SystemRequirements from DB
    // onGenerate is now internal or optional if we want to override
}

export default function ResultDisplay({
    resultId,
    expiresAt,
    recommendations,
    products,
    userConfig,
    calculations,
}: ResultDisplayProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [creationStep, setCreationStep] = useState(0); // 0: Idle, 1: Analyzing, 2: Selecting, 3: Finalizing
    const [mounted, setMounted] = useState(false);
    const [isDebugOpen, setIsDebugOpen] = useState(false);

    // Prevent hydration mismatch by only rendering dynamic content after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Format date consistently - only on client side after mount
    const formattedExpiryDate = mounted
        ? new Date(expiresAt).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })
        : "";

    const handleCopyId = () => {
        navigator.clipboard.writeText(resultId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/result/${resultId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const selectedProducts = useMemo(() => {
        let rawList: any[] = [];

        // Support both structures
        if (recommendations?.productGroups) {
            // Flatten the groups
            Object.entries(recommendations.productGroups).forEach(([slug, items]: [string, any]) => {
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        rawList.push({ ...item, category: slug }); // Inject slug
                    });
                }
            });
        } else if (Array.isArray(recommendations?.selectedProducts)) {
            rawList = recommendations.selectedProducts;
        }

        if (rawList.length === 0) return [];

        const seenIds = new Set<string>();

        // DETERMINE MANDATORY CATEGORIES BASED ON USER CONFIG
        const mandatoryCategories = new Set<string>();
        if (userConfig) {
            // 1. Shore Power -> Charger
            if (userConfig.energySources?.includes('shore_power')) mandatoryCategories.add('charger');
            if (userConfig.energySources?.includes('shore_power')) mandatoryCategories.add('ladegeraet');

            // 2. Alternator -> Booster
            if (userConfig.energySources?.includes('alternator')) mandatoryCategories.add('ladebooster');

            // 3. Solar -> Controller + Module
            if (userConfig.energySources?.includes('solar')) {
                const solarType = userConfig.solarSetupType || 'roof';

                if (solarType === 'roof' || solarType === 'mixed') {
                    mandatoryCategories.add('solar_controller');
                    mandatoryCategories.add('solar_module');
                }

                if (solarType === 'portable' || solarType === 'mixed') {
                    mandatoryCategories.add('faltbare_solartaschen');
                    if (solarType === 'portable') {
                        mandatoryCategories.add('solar_controller');
                    }
                }
            }

            // 4. 230V -> Inverter
            const has230V = userConfig.consumers?.some((c: any) => c.voltage === 230);
            if (has230V) mandatoryCategories.add('inverter');
            if (has230V) mandatoryCategories.add('wechselrichter');

            // 5. Battery (Always)
            mandatoryCategories.add('battery');
            mandatoryCategories.add('batterie');
        }

        // 1. Map to enriched objects
        const mappedList = rawList.map((rec: any) => {
            if (rec.isMissing || (typeof rec.productId === 'string' && rec.productId.startsWith('missing-'))) {
                return {
                    ...rec,
                    isMissing: true,
                    name: rec.name || "Nicht gefunden",
                    category: rec.category || "Unbekannt"
                };
            }

            const id = rec.productId || rec.id;

            // DEDUPLICATION LOGIC MODIFIED
            // We want to allow duplicates IF they are explicitly recommended (e.g. multiple cables).
            // But we still want to avoid accidental duplicates for general listing if not intended.
            // Current approach: Allow ALL explicitly recommended items. Dedup only 'optionals' or unflagged ones?
            // Actually, simplest is to allow deduplication KEYED by (id + index) or just allow mapped list to have duplicates.
            // But `products.find` is expensive if list is huge? No, it's fine.

            // Allow same ID if it is a different "recommendation instance" (meaning it might have a different reason)
            // So we effectively REMOVE string deduplication for the mapping phase.
            // We will handle grouping/deduping visually later if needed.
            // seenIds.add(id); // REMOVED check

            const product = products.find((p) => p.id === id);
            if (!product) return null;

            const categorySlug = product.category?.slug || (typeof rec.category === 'string' ? rec.category : product.category?.name?.toLowerCase()) || '';

            // ROBUSTNESS: Extract Amount from Reason if default is "1" but text says otherwise
            let finalAmount = rec.amount || rec.quantity;

            // NEW: Check for explicit length field (for cables)
            if (rec.length) {
                finalAmount = `${rec.length} Meter`;
            }

            const explanationText = rec.reason || rec.explanation || '';

            // If amount is missing or "1" (or "1 Stück"), check if reason implies more
            if (!finalAmount || String(finalAmount) === '1' || finalAmount === '1 Stück') {
                // Regex for "2 Stück", "2x", "2 Modi" etc.
                const quantityMatch = explanationText.match(/(\d+)\s*(?:Stück|Stk|x(?!\d)|Modul)/i);
                // x(?!\d) prevents matching dimensions like 100x200

                // Specific text numbers
                const textNumbers: Record<string, string> = {
                    'zwei': '2', 'drei': '3', 'vier': '4', 'fünf': '5', 'sechs': '6'
                };

                let foundQty = null;

                if (quantityMatch && parseInt(quantityMatch[1]) > 1) {
                    foundQty = quantityMatch[1];
                } else {
                    // Check text words
                    for (const [word, digit] of Object.entries(textNumbers)) {
                        if (explanationText.toLowerCase().includes(`${word} stück`) || explanationText.toLowerCase().includes(`${word} module`)) {
                            foundQty = digit;
                            break;
                        }
                    }
                }

                if (foundQty) {
                    finalAmount = `${foundQty} Stück`;
                }
            }

            return {
                ...product,
                affiliateUrl: rec.affiliateUrl || product.affiliateUrl,
                categorySlug: categorySlug, // Use robust slug
                explanation: explanationText,
                reason: explanationText,
                amount: finalAmount,
                quantity: finalAmount, // Sync both
                originalIsRecommended: rec.isRecommended, // Store original AI decision
                isOptional: rec.isOptional,
                categoryLabel: product.category?.name
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null);

        // 2. Group and Enforce "Single Recommendation" Rule
        const groupedBySlug: Record<string, typeof mappedList> = {};
        mappedList.forEach(item => {
            const key = item.categorySlug || 'other';
            if (!groupedBySlug[key]) groupedBySlug[key] = [];
            groupedBySlug[key].push(item);
        });

        // 3. Process Groups
        const finalFlatList: any[] = [];

        Object.entries(groupedBySlug).forEach(([slug, groupItems]) => {
            const isMandatoryCategory = mandatoryCategories.has(slug);

            // Check if ANY items are explicitly recommended by AI to allow multiple recommendations
            const anyExplicitlyRecommended = groupItems.some(item => item.originalIsRecommended);
            let firstFallbackIndex = -1;

            if (!anyExplicitlyRecommended && isMandatoryCategory && groupItems.length > 0) {
                // If mandatory but AI forgot to recommend any, recommend the first one
                firstFallbackIndex = 0;
            }

            // Apply flags
            const processedGroup = groupItems.map((item, index) => {
                let isRecommended = false;

                if (anyExplicitlyRecommended) {
                    // Respect AI's decision (can be multiple)
                    isRecommended = !!item.originalIsRecommended;
                } else if (index === firstFallbackIndex) {
                    // Fallback
                    isRecommended = true;
                }

                // SPECIAL RULE: For "Kabel" (cables), we typically want ALL returned cables to be recommended,
                // because the AI usually lists the specific set needed (red, black, different sizes).
                // Unless explicitly marked as optional by AI, we assume they are needed.
                if ((slug === 'cable' || slug === 'kabel' || slug.includes('cable')) && !item.isOptional) {
                    isRecommended = true;
                }

                return {
                    ...item,
                    isRecommended,
                    // If it's NOT recommended, it's optional/alternative
                    isOptional: !isRecommended
                };
            });

            finalFlatList.push(...processedGroup);
        });

        return finalFlatList;
    }, [recommendations, products, userConfig]);

    const hasResults = selectedProducts.length > 0;



    // Loading Animation Steps
    useEffect(() => {
        if (!isGenerating) {
            setCreationStep(0);
            return;
        }

        // Expanded steps for more engagement
        const steps = [
            { t: 0, s: 1 },    // Start Analyzing
            { t: 2500, s: 2 }, // Check Requirements
            { t: 5000, s: 3 }, // Solar Calculation
            { t: 7500, s: 4 }, // Battery Type
            { t: 10000, s: 5 }, // Dimensioning
            { t: 12500, s: 6 }, // Product Search
            { t: 15500, s: 7 }, // Finalizing
        ];

        const timeouts = steps.map(step => setTimeout(() => setCreationStep(step.s), step.t));
        return () => timeouts.forEach(clearTimeout);
    }, [isGenerating]);

    // Internal Generate Function
    const handleGenerate = async () => {
        console.log("Handle Generate triggered");
        setIsGenerating(true);
        try {
            console.log("Fetching API...");
            const response = await fetch(`/api/results/${resultId}/generate`, {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Fehler beim Generieren");
            }

            console.log("API Success, refreshing router...");
            // Success: Refresh the page to show new data
            router.refresh();

            // Safety timeout: If refresh doesn't happen fast enough or data is empty
            // we don't want to get stuck forever. 
            // Although hopefully the refresh triggers a re-render with new data.
        } catch (err) {
            console.error("Generation failed", err);
            alert("Es gab ein Problem bei der Generierung. Bitte versuche es erneut.");
            setIsGenerating(false);
        }
    };

    // Determine if we have a valid response structure (regardless of matching)
    // This prevents infinite loops if the AI returns data that doesn't match our DB products.
    const hasResponse = useMemo(() => {
        return recommendations &&
            typeof recommendations === 'object' &&
            (recommendations.selectedProducts || Object.keys(recommendations).length > 0);
    }, [recommendations]);

    // Auto-Trigger on Mount if NO RESPONSE exists at all
    useEffect(() => {
        // Only trigger if we genuinely have NO data.
        if (!hasResponse && !isGenerating) {
            console.log("Auto-triggering generation because NO RESPONSE found.");
            handleGenerate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasResponse]);

    // Reset generating state when we get a response
    useEffect(() => {
        if (hasResponse && isGenerating) {
            console.log("Response found, resetting isGenerating to false.");
            setIsGenerating(false);
        }
    }, [hasResponse, isGenerating]);

    // Show loading state ONLY if we are actually generating OR if we have no response yet.
    const showLoading = isGenerating || (!hasResponse && !hasResults);

    // Loading UI
    if (showLoading) {
        const steps = [
            "Initialisiere System-Analyse...",
            "Prüfe Energiebedarf & Autarkiewünsche...",
            "Berechne optimale Solarleistung...",
            "Wähle passende Batterie-Technologie...",
            "Dimensioniere Kabelquerschnitte...",
            "Suche verfügbare Produkte...",
            "Finalisiere dein individuelles Setup..."
        ];

        const currentText = steps[Math.min(creationStep - 1, steps.length - 1)] || steps[0];
        const progressPercent = Math.min((creationStep / steps.length) * 100, 100);

        return (
            <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-10 animate-in fade-in duration-700">
                {/* Visual Icon Halo */}
                <div className="relative w-40 h-40 mx-auto">
                    <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/20 rounded-full animate-[ping_3s_ease-in-out_infinite] opacity-30"></div>
                    <div className="absolute inset-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-full animate-[pulse_2s_ease-in-out_infinite] opacity-50"></div>
                    <div className="relative flex items-center justify-center w-full h-full bg-white dark:bg-gray-800 rounded-full border-4 border-indigo-100 dark:border-indigo-900 shadow-xl">
                        {creationStep < 6 ? (
                            <Loader2 className="w-16 h-16 text-indigo-600 animate-[spin_3s_linear_infinite]" />
                        ) : (
                            <Sparkles className="w-16 h-16 text-amber-400 animate-pulse" />
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        {/* Dynamic Step Title */}
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white min-h-[3rem] items-center flex justify-center">
                            {currentText}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Wir erstellen deinen perfekten Schaltplan.
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner max-w-md mx-auto">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-700 ease-out shadow-lg"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>

                    {/* Checklist of completed steps */}
                    <div className="flex flex-col items-start w-fit mx-auto space-y-3 pt-6">
                        {steps.map((text, idx) => (
                            (idx + 1) < creationStep && (
                                <div key={idx} className="flex items-center gap-3 text-left animate-in slide-in-from-bottom-2 fade-in duration-500">
                                    <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                        <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.replace("...", "")}</span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Fallback if we have Response but No Results (e.g. no products matched)
    if (!hasResults && hasResponse) {
        return (
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold">Ergebnis (Keine Produkte zugeordnet)</h1>
                    <p>Die KI hat eine Antwort geliefert, aber es konnten keine Produkte aus der Datenbank zugeordnet werden.</p>
                    <p className="text-sm text-gray-500">Möglicherweise sind die Produkt-IDs ungültig oder die Produkte wurden gelöscht.</p>

                    <div className="flex justify-center gap-4 mt-8">
                        <Button variant="outline" onClick={handleGenerate}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Neu generieren
                        </Button>
                        <Button variant="default" asChild>
                            <Link href="/wizard">Zurück zum Setup</Link>
                        </Button>
                    </div>

                    {/* Debug Info */}
                    <div className="mt-8 text-left bg-gray-100 p-4 rounded overflow-auto max-h-64">
                        <pre className="text-xs">{JSON.stringify(recommendations, null, 2)}</pre>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">

            {/* Header Section */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Dein individuelles Strom-Setup
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Basierend auf deinen Angaben haben wir die perfekt aufeinander abgestimmten Komponenten für dich ausgewählt.
                </p>

                {/* System Analysis Summary */}
                {calculations && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left max-w-5xl mx-auto">
                        <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Tagesverbrauch</div>
                            <div className="text-3xl font-bold mt-1 text-gray-900 dark:text-gray-100">{Math.ceil(calculations.dailyWh)} Wh</div>
                            <div className="text-xs text-gray-400 mt-1">Voraussichtlicher Bedarf</div>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Batterie-Empfehlung</div>
                            <div className="text-3xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                                {calculations.battery?.recommendedCapacityAh || calculations.battery?.minCapacityAh} Ah
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                {calculations.battery?.hasSolar ? 'Inkl. Solar-Puffer' : 'Ohne Solar-Input'}
                            </div>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Solar-Leistung</div>
                            {calculations.solarModules ? (
                                <>
                                    <div className="text-3xl font-bold mt-1 text-gray-900 dark:text-gray-100">{Math.ceil(calculations.solarModules.requiredWp)} Wp</div>
                                    <div className="text-xs text-gray-400 mt-1">Empfohlenes Minimum</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-3xl font-bold mt-1 text-gray-400">-</div>
                                    <div className="text-xs text-gray-400 mt-1">Nicht gewählt</div>
                                </>
                            )}
                        </Card>
                        <Card className="p-4 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Wechselrichter</div>
                            {calculations.inverter ? (
                                <>
                                    <div className="text-3xl font-bold mt-1 text-gray-900 dark:text-gray-100">{calculations.inverter.recommendedW} W</div>
                                    <div className="text-xs text-gray-400 mt-1">Für 230V Geräte</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-3xl font-bold mt-1 text-gray-400">-</div>
                                    <div className="text-xs text-gray-400 mt-1">Nicht benötigt</div>
                                </>
                            )}
                        </Card>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        <span>ID: {resultId}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                            onClick={handleCopyId}
                            title="ID kopieren"
                        >
                            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                    </div>
                </div>
                <p className="text-xs text-center text-gray-400" suppressHydrationWarning>
                    Dieses Ergebnis ist bis zum {formattedExpiryDate || "..."} abrufbar.
                </p>
            </div>

            {/* Results Grid - Grouped by Category */}
            <div className="space-y-12">
                {(() => {
                    // 1. Group Products
                    const grouped = selectedProducts.reduce((acc: Record<string, any[]>, product: any) => {
                        let key = product.categorySlug || product.category?.name || 'Andere';

                        // User Request: Merge all cable types (Solar cables, etc.) into one "Cable" group
                        const lowerKey = String(key).toLowerCase();
                        if (lowerKey.includes('cable') || lowerKey.includes('kabel')) {
                            key = 'cable';
                        }

                        const safeKey = String(key);
                        if (!acc[safeKey]) acc[safeKey] = [];
                        acc[safeKey].push(product);
                        return acc;
                    }, {});

                    // 2. Split into Main and Optional
                    const mainGroups: [string, any[]][] = [];
                    const optionalGroups: [string, any[]][] = [];

                    (Object.entries(grouped) as [string, any[]][]).forEach(([key, products]) => {
                        const recommendedItems = products.filter(p => p.isRecommended);
                        const optionalItems = products.filter(p => !p.isRecommended);

                        // Checks for "Cable/Kabel" category
                        const isCableCategory = key.toLowerCase().includes('cable') || key.toLowerCase().includes('kabel');

                        if (recommendedItems.length > 0) {
                            if (isCableCategory) {
                                // DO NOT SPLIT CABLES
                                // Keep all recommended cables AND optional cables in one group
                                mainGroups.push([key, [...recommendedItems, ...optionalItems]]);
                            } else {
                                // SPLIT STRATEGY for other products (e.g. Inverters, Batteries):
                                // Create a separate group for EACH recommended item so they appear "stacked"
                                recommendedItems.forEach((recItem, index) => {
                                    const groupProducts = [recItem];
                                    // Attach alternatives/optionals ONLY to the first recommendation group
                                    if (index === 0) {
                                        groupProducts.push(...optionalItems);
                                    }

                                    // Ensure unique keys for React
                                    const uniqueKey = index === 0 ? key : `${key}_${index}`;
                                    mainGroups.push([uniqueKey, groupProducts]);
                                });
                            }
                        } else {
                            // No recommended items -> purely optional group
                            optionalGroups.push([key, products]);
                        }
                    });

                    // 3. Render Helper
                    const renderGroup = ([groupKey, products]: [string, any[]]) => {
                        const categoryName = products[0]?.categoryLabel ||
                            (products[0]?.category?.name) ||
                            groupKey.charAt(0).toUpperCase() + groupKey.slice(1);

                        // Sort: Recommended first
                        const sortedProducts = [...products].sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));

                        // Check if group is optional to add specific header/notice
                        const isOptionalGroup = products[0]?.isOptional;

                        const isCableCategory = groupKey === 'cable' || categoryName.toLowerCase().includes('kabel') || categoryName.toLowerCase().includes('cable');

                        // Force generic title for merged cable group
                        const displayTitle = isCableCategory ? 'Kabel' : categoryName;

                        return (
                            <div key={groupKey} className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2 border-gray-100 dark:border-gray-800">
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">
                                        {displayTitle}
                                    </h3>
                                    {isOptionalGroup && (
                                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                            Optional
                                        </span>
                                    )}
                                </div>

                                {isOptionalGroup && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 mb-4">
                                        <span className="font-semibold">Info:</span> {products[0]?.reason || "Diese Komponente ist nicht zwingend erforderlich, kann aber sinnvoll sein."}
                                    </div>
                                )}

                                {isCableCategory ? (
                                    <CableGrid
                                        products={sortedProducts}
                                        cableLengths={(userConfig as any)?.cableLengths}
                                    />
                                ) : (
                                    <ProductCarousel
                                        products={sortedProducts}
                                        categoryName={categoryName}
                                    />
                                )}
                            </div>
                        );
                    };

                    return (
                        <>
                            {/* Main Required Groups */}
                            {mainGroups.map(renderGroup)}

                            {/* Separator if both exist */}
                            {mainGroups.length > 0 && optionalGroups.length > 0 && (
                                <div className="relative py-12">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t-2 border-dashed border-gray-300 dark:border-gray-700"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-lg font-bold text-blue-800 dark:text-blue-200 shadow-sm border border-blue-100 dark:border-blue-800">
                                            ✨ Nützliche Upgrades & Erweiterungen
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Optional Upgrade Groups */}
                            {optionalGroups.map(renderGroup)}
                        </>
                    );
                })()}
            </div>

            {/* Schematic Generation CTA */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-8 text-center text-white shadow-xl relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>

                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-indigo-200 text-sm font-medium border border-white/10 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Empfohlenes Upgrade</span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Mach es offiziell: Dein professioneller Schaltplan
                    </h3>

                    <p className="text-lg text-indigo-100/90 leading-relaxed">
                        Verwandle diese Produktliste in einen exakten, gut lesbaren Schaltplan.
                        Inklusive aller Kabelquerschnitte, Sicherungen und Verkabelungshinweise.
                        Perfekt für den direkten Einbau.
                    </p>

                    <div className="pt-4">
                        <Button
                            asChild
                            size="lg"
                            className="bg-white text-indigo-900 hover:bg-gray-100 hover:scale-105 transition-all duration-300 text-lg font-semibold px-8 py-6 shadow-xl shadow-indigo-900/50"
                        >
                            <Link href={`/result/${resultId}/schematic/checkout`}>
                                Schaltplan konfigurieren & erstellen
                                <ArrowLeft className="ml-2 w-5 h-5 rotate-180" />
                            </Link>
                        </Button>
                    </div>

                    <p className="text-sm text-indigo-300/60">
                        Überprüfe deine Auswahl im nächsten Schritt, bevor der Plan erstellt wird.
                    </p>
                </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" size="lg" asChild className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Link href="/wizard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Setup bearbeiten
                    </Link>
                </Button>

                <Button variant="outline" size="lg" onClick={handleCopyLink} className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Share2 className="mr-2 h-4 w-4" />
                    Link teilen
                </Button>

                <Button variant="default" size="lg" asChild className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200">
                    <Link href="/">
                        <Plus className="mr-2 h-4 w-4" />
                        Neues Setup erstellen
                    </Link>
                </Button>
            </div>

            {/* Solar Bag Suggestion - Only show if solar is selected and there's a deficit */}
            {calculations?.solarModules && userConfig?.energySources?.includes('solar') && (
                <SolarBagSuggestion
                    requiredWp={calculations.solarModules.requiredWp || 0}
                    availableWp={calculations.solarModules.totalAvailableWp || 0}
                />
            )}

            {/* Debug Button - Fixed position */}
            <Button
                variant="ghost"
                size="sm"
                className="fixed bottom-4 left-4 z-50 opacity-50 hover:opacity-100 transition-opacity bg-gray-900/80 text-white hover:bg-gray-900"
                onClick={() => setIsDebugOpen(true)}
            >
                <Bug className="h-4 w-4 mr-2" />
                Debug
            </Button>

            {/* Debug Modal */}
            <ResultDebugCalculations
                isOpen={isDebugOpen}
                onOpenChange={setIsDebugOpen}
                calculations={calculations}
                userConfig={userConfig}
            />
        </div>
    );
}
