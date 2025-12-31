import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Sparkles, FileText, Box } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatFormDataForAI, formatProductsForAI, type AIProductContext } from "@/lib/format-for-ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerateButton } from "@/components/schematic/generate-button";

interface SchematicGeneratePageProps {
    params: Promise<{ id: string }>;
}

export default async function SchematicGeneratePage({ params }: SchematicGeneratePageProps) {
    const { id } = await params;

    // Fetch result
    const result = await prisma.result.findUnique({
        where: { id },
    });

    if (!result) {
        notFound();
    }

    // Get selected products from schematicData
    const schematicData = result.schematicData as any;
    const selectedIds = schematicData?.userSelection as string[];

    if (!selectedIds || selectedIds.length === 0) {
        // Fallback or redirect if no selection found
        redirect(`/result/${id}/schematic/selection`);
    }

    const products = await prisma.product.findMany({
        where: { id: { in: selectedIds } },
        include: { category: true }
    });

    // Format Data for Display (matching AI input format)
    let formattedFormData = "";
    try {
        formattedFormData = formatFormDataForAI(result.formData as any);
    } catch (e) {
        formattedFormData = "Fehler beim Formatieren der Formulardaten.";
    }

    let formattedProducts = "";
    try {
        const contextItems: AIProductContext[] = products.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category ? { name: p.category.name, slug: p.category.slug } : { name: 'Unbekannt', slug: 'unknown' },
            price: p.price,
            specs: p.specs,
            imageUrl: p.imageUrl
        }));
        formattedProducts = formatProductsForAI(contextItems);
    } catch (e) {
        formattedProducts = "Fehler beim Formatieren der Produkte.";
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/result/${id}/schematic/selection`}>
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Überprüfung & Generierung
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Zusammenfassung</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Hier siehst du die genauen Daten, die an die KI übermittelt werden.
                        Bitte überprüfe, ob alles korrekt ist.
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* User Data Section */}
                    <Card>
                        <CardHeader className="bg-blue-50/50 dark:bg-blue-900/20">
                            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                <FileText className="w-5 h-5" />
                                Deine Anforderungen (Formular-Daten)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <pre className="p-6 overflow-x-auto text-sm font-mono whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
                                {formattedFormData}
                            </pre>
                        </CardContent>
                    </Card>

                    {/* Selected Products Section */}
                    <Card>
                        <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/20">
                            <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                <Box className="w-5 h-5" />
                                Ausgewählte Komponenten (Produkt-Kontext)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <pre className="p-6 overflow-x-auto text-sm font-mono whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
                                {formattedProducts}
                            </pre>
                        </CardContent>
                    </Card>
                </div>

                {/* Final CTA */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50">
                    <div className="container mx-auto max-w-4xl flex justify-end">
                        <GenerateButton resultId={id} />
                    </div>
                </div>
                <div className="h-24"></div>
            </div>
        </main>
    );
}
