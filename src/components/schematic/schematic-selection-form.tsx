"use strict";
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Info, ArrowRight, Zap, Battery, Sun, Truck, Plug, Box } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Prisma } from "@prisma/client";
import { toast } from "sonner";
import { saveSchematicSelection } from "@/app/actions/schematic";

interface Product {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    category: {
        id: string;
        name: string;
        slug: string;
    };
    categorySlug?: string;
}

interface SchematicSelectionFormProps {
    resultId: string;
    initialRecommendations: any;
    products: Product[];
}

export default function SchematicSelectionForm({
    resultId,
    initialRecommendations,
    products
}: SchematicSelectionFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Process Initial Data to determine default selection
    const { groupedProducts, defaultSelection } = useMemo(() => {
        const grouped: Record<string, { recommended: Product[], optional: Product[] }> = {};
        const selection: Record<string, string> = {}; // categorySlug -> productId

        // Flatten recommendations similar to result-display
        let rawList: any[] = [];
        if (initialRecommendations?.productGroups) {
            Object.entries(initialRecommendations.productGroups).forEach(([slug, items]: [string, any]) => {
                if (Array.isArray(items)) items.forEach(item => rawList.push({ ...item, category: slug }));
            });
        } else if (Array.isArray(initialRecommendations?.selectedProducts)) {
            rawList = initialRecommendations.selectedProducts;
        }

        rawList.forEach(rec => {
            const product = products.find(p => p.id === (rec.productId || rec.id));
            if (!product) return;

            const slug = product.category.slug;
            if (!grouped[slug]) grouped[slug] = { recommended: [], optional: [] };

            if (rec.isRecommended) {
                // Avoid duplicates in recommended
                if (!grouped[slug].recommended.some(p => p.id === product.id)) {
                    grouped[slug].recommended.push(product);
                }
                // Default select the first recommended item for this category if not already selected
                if (!selection[slug]) selection[slug] = product.id;
            } else {
                // Avoid duplicates in optional
                if (!grouped[slug].optional.some(p => p.id === product.id)) {
                    grouped[slug].optional.push(product);
                }
            }
        });

        // Also add products from DB that might be relevant alternatives (same category)
        products.forEach(p => {
            const slug = p.category.slug;
            if (!grouped[slug]) grouped[slug] = { recommended: [], optional: [] };

            // Avoid duplicates
            const isAlreadyIn = grouped[slug].recommended.some(x => x.id === p.id) || grouped[slug].optional.some(x => x.id === p.id);
            if (!isAlreadyIn) {
                grouped[slug].optional.push(p);
            }
        });

        return { groupedProducts: grouped, defaultSelection: selection };
    }, [initialRecommendations, products]);

    const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>(defaultSelection);

    const handleSelect = (categorySlug: string, productId: string) => {
        setSelectedProducts(prev => ({ ...prev, [categorySlug]: productId }));
    };

    const handleGenerate = async () => {
        setIsSubmitting(true);
        try {
            const selectedIds = Object.values(selectedProducts);
            await saveSchematicSelection(resultId, selectedIds);

            toast.success("Auswahl gespeichert! Weiter zur Überprüfung...");
            router.push(`/result/${resultId}/schematic/generate`);

        } catch (error) {
            console.error("Error saving selection:", error);
            toast.error("Fehler beim Speichern der Auswahl.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper for icons based on category
    const getCategoryIcon = (slug: string) => {
        if (slug.includes('battery') || slug.includes('batterie')) return <Battery className="w-5 h-5" />;
        if (slug.includes('solar')) return <Sun className="w-5 h-5" />;
        if (slug.includes('inverter') || slug.includes('wechselrichter')) return <Zap className="w-5 h-5" />;
        if (slug.includes('charge') || slug.includes('lade')) return <Plug className="w-5 h-5" />;
        return <Box className="w-5 h-5" />;
    };

    const categoryOrder = ['solar_module', 'solar_controller', 'battery', 'inverter', 'charger', 'booster'];
    const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
        const idxA = categoryOrder.indexOf(a);
        const idxB = categoryOrder.indexOf(b);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });

    return (
        <div className="space-y-8">
            <div className="grid gap-8">
                {sortedCategories.map(slug => {
                    const group = groupedProducts[slug];
                    // Skip if no recommended products (unless we want to show everything)
                    if (group.recommended.length === 0 && group.optional.length === 0) return null;

                    const categoryName = group.recommended[0]?.category.name || group.optional[0]?.category.name || slug;

                    return (
                        <Card key={slug} className="overflow-hidden border-indigo-50 dark:border-indigo-900/50 shadow-sm">
                            <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        {getCategoryIcon(slug)}
                                    </div>
                                    <CardTitle>{categoryName}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Recommended Section */}
                                    {group.recommended.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => handleSelect(slug, product.id)}
                                            className={`
                                                cursor-pointer relative rounded-xl border-2 p-4 transition-all hover:scale-[1.01]
                                                ${selectedProducts[slug] === product.id
                                                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-md'
                                                    : 'border-transparent bg-white dark:bg-gray-800 shadow-sm hover:border-gray-200 dark:hover:border-gray-700'}
                                            `}
                                        >
                                            <div className="absolute top-3 right-3">
                                                {selectedProducts[slug] === product.id && (
                                                    <div className="h-6 w-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute top-3 left-3">
                                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200">
                                                    Empfohlen
                                                </Badge>
                                            </div>

                                            <div className="mt-8 flex flex-col gap-4">
                                                <div className="relative aspect-square w-full max-w-[120px] mx-auto bg-white rounded-lg p-2 mix-blend-multiply dark:mix-blend-normal">
                                                    {product.imageUrl ? (
                                                        <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                                                            <Box className="text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-center">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{product.name}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Alternatives */}
                                    {group.optional.length > 0 && (
                                        <div className="col-span-full mt-4">
                                            <h5 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                                                <Info className="w-4 h-4" />
                                                Alternativen wählen
                                            </h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {group.optional.map(product => (
                                                    <div
                                                        key={product.id}
                                                        onClick={() => handleSelect(slug, product.id)}
                                                        className={`
                                                            cursor-pointer flex items-center gap-3 p-3 rounded-lg border transition-all
                                                            ${selectedProducts[slug] === product.id
                                                                ? 'border-indigo-600 bg-indigo-50/30'
                                                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'}
                                                        `}
                                                    >
                                                        <div className="h-4 w-4 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                                                            {selectedProducts[slug] === product.id && <div className="h-2.5 w-2.5 bg-indigo-600 rounded-full" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{product.name}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 mb-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50">
                <div className="container mx-auto max-w-4xl flex items-center justify-between">
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {Object.keys(selectedProducts).length} Komponenten ausgewählt
                        </p>
                        <p className="text-xs text-gray-500">Bereit zur Generierung</p>
                    </div>
                    <Button
                        size="lg"
                        onClick={handleGenerate}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isSubmitting ? "Wird gespeichert..." : "Schaltplan generieren"}
                        <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
            {/* Spacer for fixed bottom bar */}
            <div className="h-24"></div>
        </div>
    );
}
