import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import SchematicSelectionForm from "@/components/schematic/schematic-selection-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SchematicSelectionPageProps {
    params: Promise<{ id: string }>;
}

export default async function SchematicSelectionPage({ params }: SchematicSelectionPageProps) {
    const { id } = await params;

    // Fetch result
    const result = await prisma.result.findUnique({
        where: { id },
    });

    if (!result) {
        notFound();
    }

    // Fetch all active products for the selection list
    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: {
            category: true
        },
        orderBy: { category: { sortOrder: 'asc' } }
    });

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/result/${id}`}>
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Komponenten auswählen
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-600 dark:text-gray-300">
                        Bevor wir deinen individuellen Schaltplan erstellen, überprüfe bitte die ausgewählten Komponenten.
                        Du kannst Empfehlungen ändern oder Alternativen wählen.
                    </p>
                </div>

                <SchematicSelectionForm
                    resultId={id}
                    initialRecommendations={result.recommendations}
                    products={products}
                />
            </div>
        </main>
    );
}
