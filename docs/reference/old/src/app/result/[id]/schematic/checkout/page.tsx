import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface CheckoutPageProps {
    params: Promise<{ id: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
    const { id } = await params;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-2xl border-indigo-100 dark:border-indigo-900">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-2">
                        <CreditCard className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        Schaltplan freischalten
                    </CardTitle>
                    <CardDescription className="text-base text-gray-500 dark:text-gray-400">
                        Erhalte deinen professionellen, maßgeschneiderten Schaltplan für dein Setup.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Individueller Plan basierend auf deinen Komponenten</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Berechnung aller Kabelquerschnitte & Sicherungen</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Schritt-für-Schritt Verkabelungshinweise</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">PDF-Download & Druckversion</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Sichere Bezahlung via PayPal (Demo)</span>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button
                        asChild
                        size="lg"
                        className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold py-6 text-lg shadow-lg shadow-blue-500/20"
                    >
                        <Link href={`/result/${id}/schematic/selection`}>
                            Jetzt 29,90€ bezahlen
                        </Link>
                    </Button>
                    <p className="text-xs text-center text-gray-400">
                        Einmalige Zahlung. Kein Abo.
                    </p>
                </CardFooter>
            </Card>
        </main>
    );
}
