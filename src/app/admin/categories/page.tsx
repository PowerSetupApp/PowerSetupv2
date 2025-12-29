import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CategoriesPage() {
    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: { products: true },
            },
        },
        orderBy: { sortOrder: "asc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Kategorien</h1>
                    <p className="text-muted-foreground">
                        {categories.length} Kategorien
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/categories/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Neue Kategorie
                    </Link>
                </Button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.length === 0 ? (
                    <div className="col-span-full bg-card rounded-xl border p-12 text-center text-muted-foreground">
                        Noch keine Kategorien vorhanden.
                        <br />
                        <Link href="/admin/categories/new" className="text-primary hover:underline">
                            Erste Kategorie erstellen
                        </Link>
                    </div>
                ) : (
                    categories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-card rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        {category.icon && (
                                            <span className="text-2xl">{category.icon}</span>
                                        )}
                                        <h3 className="font-semibold">{category.name}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Slug: <code className="bg-muted px-1 rounded">{category.slug}</code>
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {category._count.products} Produkte
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/admin/categories/${category.id}`}>
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
