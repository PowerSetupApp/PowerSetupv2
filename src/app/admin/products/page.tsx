import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductFilter } from "./product-filter";
import { SortableHeader } from "./sortable-header";
import { ProductActions } from "@/components/admin/product-actions";
import { ImportProductDialog } from "@/components/admin/products/import-product-dialog";

interface ProductsPageProps {
    searchParams: Promise<{
        categoryId?: string;
        sort?: string;
        order?: string;
    }>;
}

export const dynamic = 'force-dynamic';

export default async function ProductsPage(props: ProductsPageProps) {
    const searchParams = await props.searchParams;
    const { categoryId, sort, order } = searchParams;

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

    const products = await prisma.product.findMany({
        where: {
            ...(categoryId ? { categoryId } : {}),
        },
        include: {
            category: true,
        },
        orderBy: orderBy as any, // dynamic sort object
    });

    const categories = await prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
    });

    const { getGeneralSettings } = await import("@/app/actions/general-settings");
    const settings = await getGeneralSettings();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Produkte</h1>
                    <p className="text-muted-foreground">
                        {products.length} Produkte insgesamt
                    </p>
                </div>
                <ImportProductDialog />
            </div>

            <div className="flex justify-start">
                <ProductFilter categories={categories} />
            </div>

            {/* Products Table */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-6 py-4 font-medium">
                                <SortableHeader column="name" title="Produkt" />
                            </th>
                            <th className="text-left px-6 py-4 font-medium">
                                <SortableHeader column="category" title="Kategorie" />
                            </th>
                            <th className="text-left px-6 py-4 font-medium">
                                <SortableHeader column="price" title="Preis" />
                            </th>
                            <th className="text-left px-6 py-4 font-medium">
                                <SortableHeader column="updatedAt" title="Zuletzt Aktualisiert" />
                            </th>
                            <th className="text-left px-6 py-4 font-medium">
                                <SortableHeader column="isActive" title="Status" />
                            </th>
                            <th className="text-right px-6 py-4 font-medium">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {products.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-12 text-center text-muted-foreground"
                                >
                                    Noch keine Produkte vorhanden.
                                    <br />
                                    <Link
                                        href="/admin/products/new"
                                        className="text-primary hover:underline"
                                    >
                                        Erstes Produkt erstellen
                                    </Link>
                                </td>
                            </tr>
                        )}
                        {products.map((product) => (
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
                                            <p className="font-medium">{product.name}</p>
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
                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                    {new Date(product.updatedAt).toLocaleDateString("de-DE", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })}
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
                                                        href={product.affiliateUrl} // Pure link for table, or use helper with tag if needed
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
                                                partnerTag={settings?.amazonPartnerTag}
                                            />
                                        </div>
                                        {/* Mobile view could just use the dropdown */}
                                        <div className="md:hidden">
                                            <ProductActions
                                                product={product}
                                                variant="dropdown"
                                                partnerTag={settings?.amazonPartnerTag}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
