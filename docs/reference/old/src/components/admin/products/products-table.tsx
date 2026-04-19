"use client";

import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink, RefreshCcw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductActions } from "@/components/admin/product-actions";
import { ImportProductDialog } from "@/components/admin/products/import-product-dialog";
import { UpdateProductDialog } from "@/components/admin/products/update-product-dialog";
import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface Product {
    id: string;
    name: string;
    imageUrl: string | null;
    price: number | null;
    isActive: boolean;
    updatedAt: Date;
    affiliateUrl: string;
    asin: string | null;
    filterValues: any;
    category: Category;
    categoryId: string;
}

interface CategoryFilter {
    id: string;
    categoryId: string;
    name: string;
    key: string;
}

interface ProductsTableProps {
    initialProducts: Product[];
    categories: Category[];
    partnerTag?: string;
    allCategoryFilters: CategoryFilter[];
}

export function ProductsTable({ initialProducts, categories, partnerTag, allCategoryFilters }: ProductsTableProps) {
    const [showMissingOnly, setShowMissingOnly] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

    // Filter Logic
    const filteredProducts = useMemo(() => {
        if (!showMissingOnly) return initialProducts;

        return initialProducts.filter(p => {
            // Find valid filter keys for this category
            const requiredFilters = allCategoryFilters.filter(cf => cf.categoryId === p.categoryId);

            if (requiredFilters.length === 0) {
                // No filters defined for this category? Logic fallback:
                // If standard fields like price/image are missing?
                // Let's stick to filters for now. If no filters defined, maybe it's "complete" in terms of filters.
                return false;
            }

            const fv = p.filterValues || {};

            // Check if ANY required filter is missing or empty
            const isMissingAny = requiredFilters.some(filter => {
                if (filter.key === 'brand') return false; // Ignore brand for "missing" check per user request
                const value = fv[filter.key];
                return value === null || value === undefined || value === "";
            });

            return isMissingAny;
        });
    }, [initialProducts, showMissingOnly, allCategoryFilters]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                {/* Bulk Actions / Filters */}
                <div className="flex items-center gap-4 bg-card border rounded-lg p-2 shadow-sm">
                    <div className="flex items-center space-x-2 px-2">
                        <Checkbox
                            id="missingOnly"
                            checked={showMissingOnly}
                            onCheckedChange={(c) => setShowMissingOnly(c === true)}
                        />
                        <Label htmlFor="missingOnly" className="cursor-pointer text-sm font-medium flex items-center gap-2">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                            Nur unvollständige zeigen
                        </Label>
                    </div>

                    <div className="h-6 w-px bg-border" />

                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsUpdateDialogOpen(true)}
                        disabled={filteredProducts.length === 0}
                    >
                        <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                        {showMissingOnly ? 'Gefilterte aktualisieren' : 'Sichtbare aktualisieren'}
                        <span className="ml-1 opacity-60">({filteredProducts.length})</span>
                    </Button>
                </div>

                <ImportProductDialog />
            </div>

            {/* Products Table */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-6 py-4 font-medium">Produkt</th>
                            <th className="text-left px-6 py-4 font-medium">Kategorie</th>
                            <th className="text-left px-6 py-4 font-medium">Preis</th>
                            <th className="text-left px-6 py-4 font-medium">Status</th>
                            <th className="text-right px-6 py-4 font-medium">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    {showMissingOnly
                                        ? "Keine Produkte mit fehlenden Werten gefunden."
                                        : "Keine Produkte vorhanden."}
                                </td>
                            </tr>
                        )}
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="h-10 w-10 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                                Bild
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium line-clamp-1">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(product.updatedAt).toLocaleDateString("de-DE")}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                        {product.category.name}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {product.price ? `${product.price.toFixed(2)} €` : "-"}
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.isActive
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                                            }`}
                                    >
                                        {product.isActive ? "Aktiv" : "Inaktiv"}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="hidden md:flex items-center gap-1">
                                            {product.affiliateUrl && (
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a
                                                        href={product.affiliateUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Bei Amazon ansehen"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/products/${product.id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <ProductActions
                                                product={product}
                                                variant="dropdown"
                                                partnerTag={partnerTag}
                                            />
                                        </div>
                                        <div className="md:hidden">
                                            <ProductActions
                                                product={product}
                                                variant="dropdown"
                                                partnerTag={partnerTag}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <UpdateProductDialog
                products={filteredProducts}
                isOpen={isUpdateDialogOpen}
                onClose={() => setIsUpdateDialogOpen(false)}
                allCategoryFilters={allCategoryFilters}
            />
        </div>
    );
}
