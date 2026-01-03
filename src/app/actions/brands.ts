'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type BrandType = 'CHARGER' | 'BATTERY' | 'SOLAR' | 'BOTH';

export interface Brand {
    id: string;
    name: string;
    type: BrandType | null; // Legacy
    types: string[]; // New
    isActive: boolean;
    showInPreferences: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function getBrands() {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { name: 'asc' }
        });
        return brands as unknown as Brand[];
    } catch (error) {
        console.error("Error fetching brands:", error);
        return [];
    }
}

export async function getActiveBrands(requestType: 'CHARGER' | 'BATTERY' | 'SOLAR') {
    try {
        const brands = await prisma.brand.findMany({
            where: {
                isActive: true,
                showInPreferences: true,
                OR: [
                    { types: { has: requestType } },
                    { type: requestType },
                    { type: 'BOTH' }
                ]
            },
            orderBy: { name: 'asc' }
        });
        return brands as unknown as Brand[];
    } catch (error) {
        console.error("Error fetching active brands:", error);
        return [];
    }
}

export async function createBrand(name: string, types: string[], showInPreferences: boolean = true) {
    try {
        // For legacy compatibility, set 'type' to the first type or 'BOTH' if multiple
        let legacyType: BrandType = 'BOTH';
        if (types.length === 1) {
            legacyType = types[0] as BrandType;
        }

        await prisma.brand.create({
            data: {
                name,
                types,
                showInPreferences,
                type: legacyType,
                isActive: true
            }
        });
        revalidatePath('/admin/brands');
        return { success: true };
    } catch (error) {
        console.error("Error creating brand:", error);
        return { success: false, error: "Fehler beim Erstellen der Marke" };
    }
}

export async function updateBrand(id: string, data: Partial<Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>>) {
    try {
        await prisma.brand.update({
            where: { id },
            data: {
                ...data,
                // Ensure legacy type is updated if types changes (optional sync)
                ...(data.types ? {
                    type: data.types.length === 1 ? (data.types[0] as BrandType) : 'BOTH'
                } : {})
            }
        });
        revalidatePath('/admin/brands');
        return { success: true };
    } catch (error) {
        console.error("Error updating brand:", error);
        return { success: false, error: "Fehler beim Aktualisieren der Marke" };
    }
}

export async function deleteBrand(id: string) {
    try {
        await prisma.brand.delete({
            where: { id }
        });
        revalidatePath('/admin/brands');
        return { success: true };
    } catch (error) {
        console.error("Error deleting brand:", error);
        return { success: false, error: "Fehler beim Löschen der Marke" };
    }
}

// ==========================================
// Brand Filter Categories (Kategorien-Zuordnung für Wizard)
// ==========================================

export interface BrandFilterCategory {
    id: string;
    key: string;
    label: string;
    categorySlugs: string[];
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

// Default filter categories with initial mappings
const DEFAULT_FILTER_CATEGORIES = [
    {
        key: 'CHARGER',
        label: 'Ladeelektronik (Ladegeräte, Booster, etc.)',
        categorySlugs: ['wechselrichter', 'solar-laderegler', 'ladebooster', 'batterieladegeraete'],
        sortOrder: 0
    },
    {
        key: 'BATTERY',
        label: 'Batterien',
        categorySlugs: ['batterien'],
        sortOrder: 1
    },
    {
        key: 'SOLAR',
        label: 'Solarmodule',
        categorySlugs: ['solarmodule', 'solar-laderegler'],
        sortOrder: 2
    }
];

export async function getBrandFilterCategories() {
    try {
        let categories = await prisma.brandFilterCategory.findMany({
            orderBy: { sortOrder: 'asc' }
        });

        // Initialize defaults if empty
        if (categories.length === 0) {
            await initializeDefaultFilterCategories();
            categories = await prisma.brandFilterCategory.findMany({
                orderBy: { sortOrder: 'asc' }
            });
        }

        return categories as unknown as BrandFilterCategory[];
    } catch (error) {
        console.error("Error fetching brand filter categories:", error);
        return [];
    }
}

export async function initializeDefaultFilterCategories() {
    try {
        for (const cat of DEFAULT_FILTER_CATEGORIES) {
            await prisma.brandFilterCategory.upsert({
                where: { key: cat.key },
                update: {},
                create: cat
            });
        }
        return { success: true };
    } catch (error) {
        console.error("Error initializing default filter categories:", error);
        return { success: false, error: "Fehler beim Initialisieren" };
    }
}

export async function updateBrandFilterCategory(key: string, categorySlugs: string[]) {
    try {
        await prisma.brandFilterCategory.update({
            where: { key },
            data: { categorySlugs }
        });
        revalidatePath('/admin/brands');
        return { success: true };
    } catch (error) {
        console.error("Error updating brand filter category:", error);
        return { success: false, error: "Fehler beim Aktualisieren" };
    }
}

// Get all product categories for the mapping UI
export async function getProductCategories() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { sortOrder: 'asc' }
        });
        return categories.map(c => ({ slug: c.slug, name: c.name }));
    } catch (error) {
        console.error("Error fetching product categories:", error);
        return [];
    }
}

/**
 * Get brands that:
 * 1. Are active & showInPreferences = true
 * 2. Have at least one product in the mapped categories for the given filter key
 */
export async function getActiveBrandsWithProducts(filterKey: 'CHARGER' | 'BATTERY' | 'SOLAR') {
    try {
        // 1. Get the filter category mapping
        const filterCategory = await prisma.brandFilterCategory.findUnique({
            where: { key: filterKey }
        });

        if (!filterCategory || filterCategory.categorySlugs.length === 0) {
            // Fallback to legacy behavior if no mapping
            return getActiveBrands(filterKey);
        }

        // 2. Find brands with products in the mapped categories
        const brands = await prisma.brand.findMany({
            where: {
                isActive: true,
                showInPreferences: true,
                products: {
                    some: {
                        isActive: true,
                        category: {
                            slug: { in: filterCategory.categorySlugs }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        return brands as unknown as Brand[];
    } catch (error) {
        console.error("Error fetching active brands with products:", error);
        return [];
    }
}
