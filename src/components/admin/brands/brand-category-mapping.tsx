"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import {
    BrandFilterCategory,
    getBrandFilterCategories,
    getProductCategories,
    updateBrandFilterCategory
} from "@/app/actions/brands";

interface ProductCategory {
    slug: string;
    name: string;
}

interface BrandCategoryMappingProps {
    initialFilterCategories: BrandFilterCategory[];
    initialProductCategories: ProductCategory[];
}

export function BrandCategoryMapping({
    initialFilterCategories,
    initialProductCategories
}: BrandCategoryMappingProps) {
    const router = useRouter();
    const [filterCategories, setFilterCategories] = useState<BrandFilterCategory[]>(initialFilterCategories);
    const [productCategories] = useState<ProductCategory[]>(initialProductCategories);
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

    const handleToggleCategory = (filterKey: string, productSlug: string) => {
        setFilterCategories(prev =>
            prev.map(fc => {
                if (fc.key !== filterKey) return fc;

                const newSlugs = fc.categorySlugs.includes(productSlug)
                    ? fc.categorySlugs.filter(s => s !== productSlug)
                    : [...fc.categorySlugs, productSlug];

                return { ...fc, categorySlugs: newSlugs };
            })
        );
        setHasChanges(prev => ({ ...prev, [filterKey]: true }));
    };

    const handleSave = async (filterKey: string) => {
        setIsLoading(filterKey);
        const fc = filterCategories.find(f => f.key === filterKey);
        if (fc) {
            await updateBrandFilterCategory(filterKey, fc.categorySlugs);
            setHasChanges(prev => ({ ...prev, [filterKey]: false }));
        }
        setIsLoading(null);
        router.refresh();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kategorien-Zuordnung für Marken-Präferenzen</CardTitle>
                <CardDescription>
                    Lege fest, welche Produktkategorien zu welcher Marken-Präferenz im Wizard gehören.
                    Nur Marken mit Produkten in den ausgewählten Kategorien werden im jeweiligen Dropdown angezeigt.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {filterCategories.map((fc) => (
                    <div key={fc.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{fc.label}</h4>
                            {hasChanges[fc.key] && (
                                <Button
                                    size="sm"
                                    onClick={() => handleSave(fc.key)}
                                    disabled={isLoading === fc.key}
                                >
                                    {isLoading === fc.key ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-1" />
                                    )}
                                    Speichern
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
                            {productCategories.map((pc) => (
                                <label
                                    key={pc.slug}
                                    className="flex items-center gap-2 cursor-pointer text-sm"
                                >
                                    <Checkbox
                                        checked={fc.categorySlugs.includes(pc.slug)}
                                        onCheckedChange={() => handleToggleCategory(fc.key, pc.slug)}
                                    />
                                    <span>{pc.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
