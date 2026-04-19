
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function ConsumerCategoriesPage() {
    const categories = await prisma.consumerCategory.findMany({
        include: {
            _count: {
                select: { devices: true },
            },
        },
        orderBy: {
            sortOrder: "asc",
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Verbraucher-Kategorien</h1>
                    <p className="text-muted-foreground">
                        Kategorien für den "Verbraucher"-Schritt im Wizard
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/consumer-categories/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Neue Kategorie
                    </Link>
                </Button>
            </div>

            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-6 py-4 font-medium">Icon</th>
                            <th className="text-left px-6 py-4 font-medium">Name</th>
                            <th className="text-left px-6 py-4 font-medium">Geräte</th>
                            <th className="text-left px-6 py-4 font-medium">Sortierung</th>
                            <th className="text-right px-6 py-4 font-medium">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    Keine Kategorien vorhanden.
                                </td>
                            </tr>
                        ) : (
                            categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-muted/30">
                                    <td className="px-6 py-4 text-2xl">{cat.icon}</td>
                                    <td className="px-6 py-4 font-medium">
                                        {cat.name}
                                        <div className="text-xs text-muted-foreground font-normal">
                                            {cat.slug}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                            {cat._count.devices} Geräte
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {cat.sortOrder}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/consumer-categories/${cat.id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
