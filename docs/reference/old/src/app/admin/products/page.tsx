import { prisma } from "@/lib/db";
import { ProductFilter } from "./product-filter";
import { ProductsTable } from "@/components/admin/products/products-table";

interface ProductsPageProps {
    searchParams: Promise<{
        categoryId?: string;
        sort?: string;
        order?: string;
        search?: string;
    }>;
}

export const dynamic = 'force-dynamic';

export default async function ProductsPage(props: ProductsPageProps) {
    const searchParams = await props.searchParams;
    const { categoryId, sort, order, search } = searchParams;

    const validSortColumns = [
        "name",
        "category",
        "price",
        "isActive",
        "updatedAt",
    ];
    const orderByField =
        sort && validSortColumns.includes(sort) ? sort : "updatedAt";
    const orderByDirection = order === "asc" ? "asc" : "desc";

    const orderBy =
        orderByField === "category"
            ? { category: { name: orderByDirection } }
            : { [orderByField]: orderByDirection };

    const where: any = {};

    if (categoryId) {
        where.categoryId = categoryId;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { asin: { contains: search, mode: 'insensitive' } },
        ];
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search)) {
            where.OR.push({ id: search });
        }
    }

    const products = await prisma.product.findMany({
        where,
        include: {
            category: true,
        },
        orderBy: orderBy as any,
    });

    const categories = await prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
    });

    const { getGeneralSettings } = await import("@/app/actions/general-settings");
    const settings = await getGeneralSettings();

    // Map products to ensure strict type compatibility for client component
    const mappedProducts = products.map(p => ({
        ...p,
        affiliateUrl: p.affiliateUrl || ""
    }));

    // Fetch all category filters to know which fields are required per category
    const allCategoryFilters = await prisma.categoryFilter.findMany();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Produkte</h1>
                    <p className="text-muted-foreground">
                        {products.length} Produkte insgesamt
                    </p>
                </div>
            </div>

            <div className="flex justify-start">
                <ProductFilter categories={categories} />
            </div>

            {/* Client Logic Table */}
            <ProductsTable
                initialProducts={mappedProducts}
                categories={categories}
                allCategoryFilters={allCategoryFilters}
                partnerTag={settings?.amazonPartnerTag}
            />
        </div>
    );
}
