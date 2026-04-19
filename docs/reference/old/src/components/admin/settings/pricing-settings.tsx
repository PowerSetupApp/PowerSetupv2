"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Save, DollarSign } from "lucide-react";
import { getModelPricing, updateModelPricing, fetchAndSaveModelPricing, type ModelPricingData } from "@/app/actions/settings";

export function PricingSettings() {
    const [pricing, setPricing] = useState<ModelPricingData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [fetching, setFetching] = useState<"openai" | "google" | null>(null);
    const [editedPrices, setEditedPrices] = useState<Record<string, { input: string; output: string }>>({});

    useEffect(() => {
        loadPricing();
    }, []);

    const loadPricing = async () => {
        setLoading(true);
        try {
            const data = await getModelPricing();
            setPricing(data);
            // Initialize edit state
            const edits: Record<string, { input: string; output: string }> = {};
            data.forEach(p => {
                edits[p.modelId] = {
                    input: p.inputPrice.toString(),
                    output: p.outputPrice.toString()
                };
            });
            setEditedPrices(edits);
        } catch (error) {
            console.error("Failed to load pricing:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchPricing = async (provider: "openai" | "google") => {
        setFetching(provider);
        try {
            const result = await fetchAndSaveModelPricing(provider);
            if (result.success) {
                await loadPricing();
                alert(`${result.count} Modellpreise aktualisiert!`);
            } else {
                alert("Fehler beim Laden der Preise. Bitte manuell eingeben.");
            }
        } catch (error) {
            console.error("Failed to fetch pricing:", error);
            alert("Fehler beim Laden der Preise.");
        } finally {
            setFetching(null);
        }
    };

    const handleSave = async (modelId: string) => {
        const edited = editedPrices[modelId];
        if (!edited) return;

        setSaving(modelId);
        try {
            await updateModelPricing(
                modelId,
                parseFloat(edited.input) || 0,
                parseFloat(edited.output) || 0
            );
            await loadPricing();
        } catch (error) {
            console.error("Failed to save pricing:", error);
            alert("Fehler beim Speichern.");
        } finally {
            setSaving(null);
        }
    };

    const handleInputChange = (modelId: string, field: "input" | "output", value: string) => {
        setEditedPrices(prev => ({
            ...prev,
            [modelId]: {
                ...prev[modelId],
                [field]: value
            }
        }));
    };

    const hasChanges = (modelId: string) => {
        const original = pricing.find(p => p.modelId === modelId);
        const edited = editedPrices[modelId];
        if (!original || !edited) return false;
        return original.inputPrice.toString() !== edited.input ||
            original.outputPrice.toString() !== edited.output;
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Group by provider
    const openaiModels = pricing.filter(p => p.provider === "openai");
    const googleModels = pricing.filter(p => p.provider === "google");

    return (
        <div className="space-y-6">
            {/* OpenAI Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            OpenAI Modellpreise
                        </CardTitle>
                        <CardDescription>
                            Preise in USD pro 1 Million Tokens
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFetchPricing("openai")}
                        disabled={fetching !== null}
                    >
                        {fetching === "openai" ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Preise aktualisieren
                    </Button>
                </CardHeader>
                <CardContent>
                    {openaiModels.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            Keine OpenAI-Modelle gefunden. Klicke auf "Preise aktualisieren" um Modelle zu laden.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Modell</TableHead>
                                    <TableHead className="w-[150px]">Input ($/1M)</TableHead>
                                    <TableHead className="w-[150px]">Output ($/1M)</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {openaiModels.map((model) => (
                                    <TableRow key={model.modelId}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{model.displayName || model.modelId}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{model.modelId}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editedPrices[model.modelId]?.input ?? ""}
                                                onChange={(e) => handleInputChange(model.modelId, "input", e.target.value)}
                                                className="w-full"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editedPrices[model.modelId]?.output ?? ""}
                                                onChange={(e) => handleInputChange(model.modelId, "output", e.target.value)}
                                                className="w-full"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant={hasChanges(model.modelId) ? "default" : "ghost"}
                                                onClick={() => handleSave(model.modelId)}
                                                disabled={saving === model.modelId || !hasChanges(model.modelId)}
                                            >
                                                {saving === model.modelId ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Google Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Google Gemini Modellpreise
                        </CardTitle>
                        <CardDescription>
                            Preise in USD pro 1 Million Tokens
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFetchPricing("google")}
                        disabled={fetching !== null}
                    >
                        {fetching === "google" ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Preise aktualisieren
                    </Button>
                </CardHeader>
                <CardContent>
                    {googleModels.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            Keine Google-Modelle gefunden. Klicke auf "Preise aktualisieren" um Modelle zu laden.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Modell</TableHead>
                                    <TableHead className="w-[150px]">Input ($/1M)</TableHead>
                                    <TableHead className="w-[150px]">Output ($/1M)</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {googleModels.map((model) => (
                                    <TableRow key={model.modelId}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{model.displayName || model.modelId}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{model.modelId}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editedPrices[model.modelId]?.input ?? ""}
                                                onChange={(e) => handleInputChange(model.modelId, "input", e.target.value)}
                                                className="w-full"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editedPrices[model.modelId]?.output ?? ""}
                                                onChange={(e) => handleInputChange(model.modelId, "output", e.target.value)}
                                                className="w-full"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant={hasChanges(model.modelId) ? "default" : "ghost"}
                                                onClick={() => handleSave(model.modelId)}
                                                disabled={saving === model.modelId || !hasChanges(model.modelId)}
                                            >
                                                {saving === model.modelId ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
