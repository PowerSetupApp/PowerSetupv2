"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Share2, Check, ArrowLeft, Plus, RefreshCw, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProductCarousel } from "./product-carousel";
import { useRouter } from "next/navigation";

interface Product {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    affiliateUrl: string;
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
    // onGenerate is now internal or optional if we want to override
}

export default function ResultDisplay({
    resultId,
    expiresAt,
    recommendations,
    products,
    userConfig,
}: ResultDisplayProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [creationStep, setCreationStep] = useState(0); // 0: Idle, 1: Analyzing, 2: Selecting, 3: Finalizing
    const [mounted, setMounted] = useState(false);

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
            const has230V = userConfig.consumers?.some((c: any) => c.voltage === '230V');
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

            // DEDUPLICATION
            if (seenIds.has(id)) return null;
            seenIds.add(id);

            const product = products.find((p) => p.id === id);
            if (!product) return null;

            const categorySlug = product.category?.slug || (typeof rec.category === 'string' ? rec.category : product.category?.name?.toLowerCase()) || '';

            return {
                ...product,
                affiliateUrl: rec.affiliateUrl || product.affiliateUrl,
                categorySlug: categorySlug, // Use robust slug
                explanation: rec.reason || rec.explanation,
                reason: rec.reason,
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

        console.log("Starting Loading Animation Steps");
        const steps = [
            { t: 100, s: 1 }, // Start Analyzing immediately
            { t: 4000, s: 2 }, // After 4s, Picking Products
            { t: 9000, s: 3 }, // After 9s, Finalizing
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

    if (showLoading) {
        return (
            <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-8">
                <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-full animate-ping opacity-20 duration-1000"></div>
                    <div className="relative flex items-center justify-center w-32 h-32 bg-indigo-50 dark:bg-gray-800 rounded-full border-4 border-indigo-100 dark:border-indigo-900">
                        {creationStep === 1 && <Sparkles className="w-12 h-12 text-indigo-600 animate-pulse" />}
                        {creationStep === 2 && <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />}
                        {creationStep === 3 && <Check className="w-12 h-12 text-green-500 animate-bounce" />}
                        {creationStep === 0 && <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />}
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-all duration-500">
                        {creationStep === 0 && "Initialisiere..."}
                        {creationStep === 1 && "Analysiere deine Anforderungen..."}
                        {creationStep === 2 && "Suche passende Komponenten..."}
                        {creationStep === 3 && "Erstelle dein Setup..."}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Das kann einen Moment dauern. Die KI stellt dein individuelles Paket zusammen.
                    </p>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden max-w-sm mx-auto">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
                        style={{ width: `${creationStep === 0 ? 5 : creationStep * 33}%` }}
                    ></div>
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
                        const key = product.categorySlug || product.category?.name || 'Andere';
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

                        if (recommendedItems.length > 0) {
                            // SPLIT STRATEGY: 
                            // Create a separate group for EACH recommended item so they appear "stacked"
                            recommendedItems.forEach((recItem, index) => {
                                const groupProducts = [recItem];
                                // Attach alternatives/optionals ONLY to the first recommendation group
                                // to avoid duplicating them or cluttering the UI.
                                if (index === 0) {
                                    groupProducts.push(...optionalItems);
                                }

                                // Ensure unique keys for React
                                const uniqueKey = index === 0 ? key : `${key}_${index}`;
                                mainGroups.push([uniqueKey, groupProducts]);
                            });
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

                        return (
                            <div key={groupKey} className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2 border-gray-100 dark:border-gray-800">
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">
                                        {categoryName}
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

                                <ProductCarousel
                                    products={sortedProducts}
                                    categoryName={categoryName}
                                />
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
        </div>
    );
}
