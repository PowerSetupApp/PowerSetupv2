import { prisma } from "@/lib/db";
import Link from "next/link";
import { Package, FolderTree, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
    // Fetch statistics
    const [productCount, categoryCount, resultCount] = await Promise.all([
        prisma.product.count(),
        prisma.category.count(),
        prisma.result.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
            },
        }),
    ]);

    const activeProductCount = await prisma.product.count({
        where: { isActive: true },
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Übersicht und Schnellaktionen</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card rounded-xl border p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Produkte</p>
                            <p className="text-2xl font-bold">{productCount}</p>
                            <p className="text-xs text-muted-foreground">{activeProductCount} aktiv</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-xl border p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <FolderTree className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Kategorien</p>
                            <p className="text-2xl font-bold">{categoryCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-xl border p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Results (7 Tage)</p>
                            <p className="text-2xl font-bold">{resultCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl border p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Schnellaktionen</h2>
                <div className="flex flex-wrap gap-4">
                    <Button asChild>
                        <Link href="/admin/products/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Neues Produkt
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin/categories">
                            <Plus className="h-4 w-4 mr-2" />
                            Neue Kategorie
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
