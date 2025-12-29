"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { getAISettings, getAvailableGeminiModels, getAvailableOpenAIModels, updateAISettings, type AIModel } from "@/app/actions/settings";

const PLACEHOLDERS = [
    "{{PROMPT_FORMAT}}",  // Das formatierte Anfrage-Format
    "{{PRODUCT_CONTEXT}}", // Die Liste der Produkte mit Specs
];

export function AISettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetchingModels, setFetchingModels] = useState(false);

    // Settings State
    const [provider, setProvider] = useState<"google" | "openai">("google");
    const [geminiKey, setGeminiKey] = useState("");
    const [openaiKey, setOpenaiKey] = useState("");
    const [selectedModel, setSelectedModel] = useState("");
    const [userPrompt, setUserPrompt] = useState("");

    // Available Models
    const [models, setModels] = useState<AIModel[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const settings = await getAISettings();
            setProvider(settings.provider);
            setGeminiKey(settings.geminiApiKey);
            setOpenaiKey(settings.openaiApiKey);
            setSelectedModel(settings.model);
            setUserPrompt(settings.userPromptTemplate);

            // Fetch initial models based on loaded settings
            await fetchModels(settings.provider, settings.geminiApiKey, settings.openaiApiKey);
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchModels = async (currentProvider: "google" | "openai", gKey: string, oKey: string) => {
        setFetchingModels(true);
        try {
            let fetched: AIModel[] = [];
            if (currentProvider === "google") {
                fetched = await getAvailableGeminiModels(gKey);
            } else {
                fetched = await getAvailableOpenAIModels(oKey);
            }
            setModels(fetched);
        } catch (e) {
            console.error("Failed to fetch models", e);
        } finally {
            setFetchingModels(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Effect: Refetch models if Provider changes (only if we have a key)
    useEffect(() => {
        if (!loading) {
            fetchModels(provider, geminiKey, openaiKey);
        }
    }, [provider]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateAISettings(provider, selectedModel, geminiKey, openaiKey, userPrompt);
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setSaving(false);
        }
    };

    const insertPlaceholder = (ph: string) => {
        setUserPrompt((prev) => prev + ph);
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* 1. Provider & API Keys */}
            <Card>
                <CardHeader>
                    <CardTitle>KI-Provider & API-Keys</CardTitle>
                    <CardDescription>Wähle deinen Anbieter und hinterlege die API-Schlüssel.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Label className={`cursor-pointer border p-4 rounded-lg flex items-center gap-2 ${provider === "google" ? "bg-green-50 border-green-500" : "bg-white"}`}>
                            <input
                                type="radio"
                                name="provider"
                                value="google"
                                checked={provider === "google"}
                                onChange={() => setProvider("google")}
                                className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <span className="font-semibold">Google Gemini</span>
                        </Label>
                        <Label className={`cursor-pointer border p-4 rounded-lg flex items-center gap-2 ${provider === "openai" ? "bg-blue-50 border-blue-500" : "bg-white"}`}>
                            <input
                                type="radio"
                                name="provider"
                                value="openai"
                                checked={provider === "openai"}
                                onChange={() => setProvider("openai")}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-semibold">OpenAI</span>
                        </Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Google GenAI Key (Gemini)</Label>
                            <input
                                type="password"
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="AIzaSy..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>OpenAI API Key</Label>
                            <input
                                type="password"
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="sk-..."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Model Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Modell-Auswahl ({provider === "google" ? "Google" : "OpenAI"})</CardTitle>
                    <CardDescription>Wähle das Modell für die Berechnungen.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4 items-center">
                    <div className="flex-1 max-w-sm">
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger>
                                <SelectValue placeholder={fetchingModels ? "Lade Modelle..." : "Modell wählen"} />
                            </SelectTrigger>
                            <SelectContent>
                                {models.map((m) => (
                                    <SelectItem key={m.id} value={m.name}>
                                        {m.displayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchModels(provider, geminiKey, openaiKey)}
                        title="Modelle aktualisieren"
                        disabled={fetchingModels}
                    >
                        {fetchingModels ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                </CardContent>
            </Card>

            {/* 3. Prompt Template */}
            <Card>
                <CardHeader>
                    <CardTitle>Prompt Template</CardTitle>
                    <CardDescription>Konfiguriere das Verhalten der KI. Nutze die Platzhalter unten.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>KI-Prompt</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {PLACEHOLDERS.map((ph) => (
                                <button
                                    key={ph}
                                    onClick={() => insertPlaceholder(ph)}
                                    className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border font-mono"
                                    type="button"
                                >
                                    {ph}
                                </button>
                            ))}
                        </div>
                        <Textarea
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            rows={12}
                            className="font-mono text-sm"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Speichern
                </Button>
            </div>
        </div>
    );
}
