"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, ExternalLink, Loader2 } from "lucide-react";
import { getResults } from "@/app/actions/results";
import { getModelPricing, type ModelPricingData } from "@/app/actions/settings";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ResultData {
    id: string;
    createdAt: Date;
    aiModel: string | null;
    inputTokens: number | null;
    outputTokens: number | null;
    formData: any;
}

export default function ResultsPage() {
    const [results, setResults] = useState<ResultData[]>([]);
    const [pricing, setPricing] = useState<ModelPricingData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [resultsData, pricingData] = await Promise.all([
                getResults(),
                getModelPricing()
            ]);
            setResults(resultsData);
            setPricing(pricingData);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };

    const findPricing = (modelId: string | null): { input: number; output: number } => {
        if (!modelId) return { input: 0, output: 0 };

        // Exact match first
        const exact = pricing.find(p => p.modelId === modelId);
        if (exact) return { input: exact.inputPrice, output: exact.outputPrice };

        // Fuzzy match (model name contains)
        const modelLower = modelId.toLowerCase();
        const fuzzy = pricing.find(p => modelLower.includes(p.modelId.toLowerCase()) || p.modelId.toLowerCase().includes(modelLower));
        if (fuzzy) return { input: fuzzy.inputPrice, output: fuzzy.outputPrice };

        return { input: 0, output: 0 };
    };

    const calculateCostInCents = (model: string | null, input: number | null, output: number | null) => {
        if (!model || !input || !output) return 0;

        const price = findPricing(model);
        // Cost in USD
        const costUSD = (input / 1_000_000 * price.input) + (output / 1_000_000 * price.output);
        // Convert to Cent (USD -> EUR -> Cent)
        return costUSD * 0.95 * 100;
    };

    const calculatePricingDetail = (model: string | null, type: 'input' | 'output') => {
        if (!model) return "-";
        const price = findPricing(model);
        return `$${price[type].toFixed(2)}`;
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ergebnisse & Kosten</h1>
                    <p className="text-muted-foreground">Übersicht aller generierten Ergebnisse und API-Kosten.</p>
                </div>
                <Button onClick={loadData} variant="outline" size="sm">
                    Aktualisieren
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Generierte Ergebnisse (letzte 90 Tage)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Datum</TableHead>
                                <TableHead>KI-Modell</TableHead>
                                <TableHead className="text-right">Tokens (In/Out)</TableHead>
                                <TableHead className="text-right">Kosten (ca.)</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((result) => {
                                const costCent = calculateCostInCents(result.aiModel, result.inputTokens, result.outputTokens);
                                const hasUsage = result.inputTokens && result.inputTokens > 0;

                                return (
                                    <TableRow key={result.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{format(new Date(result.createdAt), "dd.MM.yyyy", { locale: de })}</span>
                                                <span className="text-xs text-muted-foreground">{format(new Date(result.createdAt), "HH:mm", { locale: de })} Uhr</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {result.aiModel ? (
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {result.aiModel}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs">
                                            {result.inputTokens ? (
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground">In: {result.inputTokens.toLocaleString()}</span>
                                                    <span>Out: {result.outputTokens?.toLocaleString()}</span>
                                                </div>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {hasUsage ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Badge variant={costCent < 0.01 && costCent > 0 ? "secondary" : (costCent === 0 ? "outline" : "default")}>
                                                        {costCent.toFixed(2).replace('.', ',')} Ct
                                                    </Badge>
                                                    <TooltipProvider>
                                                        <Tooltip delayDuration={0}>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                                                    <Info className="h-4 w-4" />
                                                                    <span className="sr-only">Details</span>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="left">
                                                                <div className="text-xs space-y-1">
                                                                    <p className="font-semibold">Preise pro 1 Mio. Tokens:</p>
                                                                    <p>Input: {calculatePricingDetail(result.aiModel, 'input')}</p>
                                                                    <p>Output: {calculatePricingDetail(result.aiModel, 'output')}</p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button size="icon" variant="ghost" asChild>
                                                <Link href={`/result/${result.id}`} target="_blank">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
