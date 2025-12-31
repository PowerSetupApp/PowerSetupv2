import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

interface SchematicViewPageProps {
    params: Promise<{ id: string }>;
}

export default async function SchematicViewPage({ params }: SchematicViewPageProps) {
    const { id } = await params;

    const result = await prisma.result.findUnique({
        where: { id },
    });

    if (!result || !result.pdfUrl) {
        // If result exists but no PDF/Image, maybe redirect back to generation?
        // But for now, 404
        return notFound();
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 print:hidden">
                <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                            Dein Schaltplan
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer" download="schaltplan.jpg">
                                <Download className="mr-2 w-4 h-4" />
                                Download JPG
                            </a>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto max-w-7xl px-4 py-8">
                <div className="bg-white dark:bg-black rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                    <div className="relative aspect-[16/9] w-full bg-gray-100 dark:bg-gray-900">
                        <Image
                            src={result.pdfUrl}
                            alt="Generierter Schaltplan"
                            fill
                            className="object-contain"
                            priority
                            unoptimized // For external URLs if not configured in next.config
                        />
                    </div>
                </div>

                <div className="mt-8 max-w-3xl mx-auto text-center space-y-4 print:hidden">
                    <p className="text-gray-500">
                        Hinweis: Dies ist ein KI-generierter Plan basierend auf deinen Angaben.
                        Bitte lasse die Installation von einem Fachmann prüfen.
                    </p>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
                        ⚠️ Die Download-Links sind 90 Tage gültig. Bitte speichere die Datei lokal ab.
                    </div>
                </div>
            </div>
        </main>
    );
}
