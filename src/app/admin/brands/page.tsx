import { getBrands, getBrandFilterCategories, getProductCategories } from "@/app/actions/brands";
import { BrandList } from "@/components/admin/brands/brand-list";
import { AddBrandDialog } from "@/components/admin/brands/add-brand-dialog";
import { BrandCategoryMapping } from "@/components/admin/brands/brand-category-mapping";

export const dynamic = 'force-dynamic';

export default async function AdminBrandsPage() {
    // Fetch all data in parallel
    const [brands, filterCategories, productCategories] = await Promise.all([
        getBrands(),
        getBrandFilterCategories(),
        getProductCategories()
    ]);

    return (
        <div className="container mx-auto max-w-5xl space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marken Verwaltung</h1>
                    <p className="text-muted-foreground">
                        Definiere bevorzugte Marken für Ladeelektronik und Batterien.
                    </p>
                </div>
                <AddBrandDialog />
            </div>

            <BrandList initialBrands={brands} />

            <BrandCategoryMapping
                initialFilterCategories={filterCategories}
                initialProductCategories={productCategories}
            />
        </div>
    );
}
