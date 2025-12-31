"use server";

import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
// import { DEFAULT_USER_PROMPT_TEMPLATE } from "@/lib/ai-prompts"; // Removed

// ==========================================
// Types
// ==========================================

export interface AIModel {
    id: string; // Unified ID (e.g., "gpt-4-turbo" or "models/gemini-1.5-pro")
    name: string;
    displayName: string;
    provider: "google" | "openai";
}

export interface AISettings {
    provider: "google" | "openai";
    model: string;
    imageModel: string; // New: Image Generation Model
    geminiApiKey: string;
    openaiApiKey: string;
    systemPrompt: string;
    userPromptTemplate: string;
    imagePromptTemplate: string; // New: Image Prompt
    specsOptimizationPrompt: string;
}

// ==========================================
// Actions
// ==========================================

/**
 * Holt die verfügbaren Gemini-Modelle von der API
 */
export async function getAvailableGeminiModels(apiKey?: string): Promise<AIModel[]> {
    const key = apiKey || process.env.GEMINI_API_KEY;

    const defaultModels: AIModel[] = [
        { id: "gemini-2.0-flash-exp", name: "models/gemini-2.0-flash-exp", displayName: "Gemini 2.0 Flash (Exp)", provider: "google" },
        { id: "gemini-1.5-flash", name: "models/gemini-1.5-flash", displayName: "Gemini 1.5 Flash", provider: "google" },
        { id: "gemini-1.5-pro", name: "models/gemini-1.5-pro", displayName: "Gemini 1.5 Pro", provider: "google" },
    ];

    if (!key) return defaultModels;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (response.ok) {
            const data = await response.json();
            if (data.models) {
                return data.models.map((m: any) => ({
                    id: m.name.replace("models/", ""), // Simplify ID for UI if needed, but keeping full name is safer for API
                    name: m.name,
                    displayName: m.displayName,
                    provider: "google"
                })).filter((m: any) => m.name.includes("gemini"));
            }
        }
    } catch (error) {
        console.warn("Failed to fetch Google models, using defaults.", error);
    }
    return defaultModels;
}

/**
 * Holt die verfügbaren Gemini-Image-Modelle
 * Currently hardcoded as listing them via API is tricky or requires Vertex AI.
 */
export async function getAvailableGeminiImageModels(apiKey?: string): Promise<AIModel[]> {
    // Placeholder defaults
    return [
        { id: "imagen-3.0-generate-001", name: "imagen-3.0-generate-001", displayName: "Imagen 3 (Vertex/Studio)", provider: "google" },
    ];
}


/**
 * Holt die verfügbaren OpenAI-Modelle
 */
export async function getAvailableOpenAIModels(apiKey: string): Promise<AIModel[]> {
    const defaultModels: AIModel[] = [
        { id: "gpt-4o", name: "gpt-4o", displayName: "GPT-4o", provider: "openai" },
        { id: "gpt-4-turbo", name: "gpt-4-turbo", displayName: "GPT-4 Turbo", provider: "openai" },
        { id: "gpt-3.5-turbo", name: "gpt-3.5-turbo", displayName: "GPT-3.5 Turbo", provider: "openai" },
    ];

    if (!apiKey) return defaultModels;

    try {
        const openai = new OpenAI({ apiKey });
        const list = await openai.models.list();

        // Filter for chat models usually
        return list.data
            .filter(m => m.id.includes("gpt"))
            .map(m => ({
                id: m.id,
                name: m.id,
                displayName: m.id.toUpperCase(),
                provider: "openai" as const
            }))
            .sort((a, b) => b.name.localeCompare(a.name)); // Newest first (rough approx)

    } catch (error) {
        console.warn("Failed to fetch OpenAI models, using defaults.", error);
        return defaultModels;
    }
}

/**
 * Holt die verfügbaren OpenAI-Bilder-Modelle
 */
export async function getAvailableOpenAIImageModels(apiKey: string): Promise<AIModel[]> {
    const defaultModels: AIModel[] = [
        { id: "dall-e-3", name: "dall-e-3", displayName: "DALL·E 3", provider: "openai" },
        { id: "dall-e-2", name: "dall-e-2", displayName: "DALL·E 2", provider: "openai" },
    ];

    if (!apiKey) return defaultModels;

    try {
        const openai = new OpenAI({ apiKey });
        const list = await openai.models.list();

        const fetched = list.data
            .filter(m => m.id.includes("dall-e"))
            .map(m => ({
                id: m.id,
                name: m.id,
                displayName: m.id.toUpperCase(), // e.g. DALL-E-3
                provider: "openai" as const
            }))
            .sort((a, b) => b.name.localeCompare(a.name));

        if (fetched.length > 0) return fetched;
        return defaultModels;

    } catch (error) {
        console.warn("Failed to fetch OpenAI image models, using defaults.", error);
        return defaultModels;
    }
}


/**
 * Holt die aktuellen KI-Einstellungen (Modell + Prompt + Keys)
 */
export async function getAISettings(): Promise<AISettings> {
    const defaults: AISettings = {
        provider: "google",
        model: "models/gemini-2.0-flash-exp",
        imageModel: "dall-e-3", // Default image model
        geminiApiKey: process.env.GEMINI_API_KEY || "", // Fallback to env
        openaiApiKey: process.env.OPENAI_API_KEY || "",
        systemPrompt: "",
        userPromptTemplate: "",
        imagePromptTemplate: "", // Default empty
        specsOptimizationPrompt: "Optimiere den folgenden Text für KI-Verarbeitung. Reduziere auf die wesentlichen technischen Daten. Ausgabe als kompakte Zeilen ohne Markdown.\n\nText:\n{{INPUT}}",
    };

    try {
        // Check if prisma.systemSetting is available
        if (!prisma.systemSetting) return defaults;

        // Fetch all relevant settings in parallel or bulk
        const [provider, model, imageModel, geminiKey, openaiKey, imagePrompt, specsPrompt] = await Promise.all([
            prisma.systemSetting.findUnique({ where: { key: "ai_provider" } }),
            prisma.systemSetting.findUnique({ where: { key: "ai_model" } }),
            prisma.systemSetting.findUnique({ where: { key: "ai_image_model" } }),
            prisma.systemSetting.findUnique({ where: { key: "gemini_api_key" } }),
            prisma.systemSetting.findUnique({ where: { key: "openai_api_key" } }),
            prisma.systemSetting.findUnique({ where: { key: "ai_image_prompt_template" } }),
            prisma.systemSetting.findUnique({ where: { key: "ai_specs_optimization_prompt" } }),
        ]);

        const activePrompt = await prisma.promptVersion.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });

        return {
            provider: (provider?.value as "google" | "openai") || defaults.provider,
            model: model?.value || defaults.model,
            imageModel: imageModel?.value || defaults.imageModel,
            geminiApiKey: geminiKey?.value || defaults.geminiApiKey,
            openaiApiKey: openaiKey?.value || defaults.openaiApiKey,
            systemPrompt: activePrompt?.systemPrompt || defaults.systemPrompt,
            userPromptTemplate: activePrompt?.userPromptTemplate || defaults.userPromptTemplate,
            imagePromptTemplate: imagePrompt?.value || defaults.imagePromptTemplate,
            specsOptimizationPrompt: specsPrompt?.value || defaults.specsOptimizationPrompt,
        };
    } catch (error) {
        console.warn("Failed to fetch AI settings:", error);
        return defaults;
    }
}

/**
 * Speichert KI-Einstellungen
 */
export async function updateAISettings(
    provider: "google" | "openai",
    model: string,
    imageModel: string,
    geminiApiKey: string,
    openaiApiKey: string,
    userPromptTemplate: string,
    imagePromptTemplate: string,
    specsOptimizationPrompt: string
) {
    // 1. Update Settings
    await prisma.systemSetting.upsert({ where: { key: "ai_provider" }, update: { value: provider }, create: { key: "ai_provider", value: provider } });
    await prisma.systemSetting.upsert({ where: { key: "ai_model" }, update: { value: model }, create: { key: "ai_model", value: model } });
    await prisma.systemSetting.upsert({ where: { key: "ai_image_model" }, update: { value: imageModel }, create: { key: "ai_image_model", value: imageModel } });
    await prisma.systemSetting.upsert({ where: { key: "gemini_api_key" }, update: { value: geminiApiKey }, create: { key: "gemini_api_key", value: geminiApiKey } });
    await prisma.systemSetting.upsert({ where: { key: "openai_api_key" }, update: { value: openaiApiKey }, create: { key: "openai_api_key", value: openaiApiKey } });
    await prisma.systemSetting.upsert({ where: { key: "ai_image_prompt_template" }, update: { value: imagePromptTemplate }, create: { key: "ai_image_prompt_template", value: imagePromptTemplate } });
    await prisma.systemSetting.upsert({ where: { key: "ai_specs_optimization_prompt" }, update: { value: specsOptimizationPrompt }, create: { key: "ai_specs_optimization_prompt", value: specsOptimizationPrompt } });

    // 2. Update Prompt
    // Disable old active prompts
    await prisma.promptVersion.updateMany({
        where: { isActive: true },
        data: { isActive: false },
    });

    const lastVersion = await prisma.promptVersion.findFirst({ orderBy: { version: "desc" } });
    const nextVersion = (lastVersion?.version || 0) + 1;

    await prisma.promptVersion.create({
        data: {
            version: nextVersion,
            systemPrompt: "", // Deprecated/Empty
            userPromptTemplate,
            isActive: true,
        },
    });

    revalidatePath("/admin/settings");
    return { success: true };
}

// ==========================================
// Model Pricing Actions
// ==========================================

export interface ModelPricingData {
    id: string;
    modelId: string;
    displayName: string | null;
    provider: string;
    inputPrice: number;
    outputPrice: number;
    updatedAt: Date;
}

/**
 * Holt alle gespeicherten Modell-Preise
 */
export async function getModelPricing(): Promise<ModelPricingData[]> {
    const pricing = await prisma.modelPricing.findMany({
        orderBy: [
            { provider: 'asc' },
            { modelId: 'asc' }
        ]
    });
    return pricing;
}

/**
 * Aktualisiert den Preis für ein einzelnes Modell
 */
export async function updateModelPricing(
    modelId: string,
    inputPrice: number,
    outputPrice: number
): Promise<{ success: boolean }> {
    await prisma.modelPricing.update({
        where: { modelId },
        data: { inputPrice, outputPrice }
    });
    revalidatePath("/admin/settings");
    return { success: true };
}

/**
 * Holt Modelle vom Provider und erstellt Preiseinträge mit bekannten Standardpreisen
 */
export async function fetchAndSaveModelPricing(provider: "openai" | "google"): Promise<{ success: boolean; count: number }> {
    try {
        // Known pricing defaults (USD per 1M tokens) - manually maintained
        const KNOWN_PRICING: Record<string, { input: number; output: number }> = {
            // GPT-4o family
            "gpt-4o": { input: 2.50, output: 10.00 },
            "gpt-4o-mini": { input: 0.15, output: 0.60 },
            "gpt-4o-2024-08-06": { input: 2.50, output: 10.00 },
            "gpt-4o-2024-05-13": { input: 5.00, output: 15.00 },
            // GPT-4 family
            "gpt-4-turbo": { input: 10.00, output: 30.00 },
            "gpt-4": { input: 30.00, output: 60.00 },
            "gpt-4-32k": { input: 60.00, output: 120.00 },
            // GPT-3.5 family
            "gpt-3.5-turbo": { input: 0.50, output: 1.50 },
            "gpt-3.5-turbo-0125": { input: 0.50, output: 1.50 },
            // GPT-5 family (from user screenshot)
            "gpt-5.1": { input: 1.25, output: 10.00 },
            "gpt-5.2": { input: 1.75, output: 14.00 },
            "gpt-5": { input: 1.25, output: 10.00 },
            "gpt-5-mini": { input: 0.25, output: 2.00 },
            // Gemini family
            "gemini-2.0-flash-exp": { input: 0, output: 0 },
            "gemini-1.5-pro": { input: 3.50, output: 10.50 },
            "gemini-1.5-flash": { input: 0.075, output: 0.30 },
        };

        let models: string[] = [];

        if (provider === "openai") {
            // Get API key from settings
            const apiKeySetting = await prisma.systemSetting.findUnique({
                where: { key: "openai_api_key" }
            });

            if (apiKeySetting?.value) {
                const openai = new OpenAI({ apiKey: apiKeySetting.value });
                const list = await openai.models.list();
                models = list.data
                    .filter(m => m.id.includes("gpt"))
                    .map(m => m.id);
            }
        } else {
            // For Google, use hardcoded list since API listing is limited
            models = ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"];
        }

        let count = 0;
        for (const modelId of models) {
            const pricing = KNOWN_PRICING[modelId] || { input: 0, output: 0 };

            await prisma.modelPricing.upsert({
                where: { modelId },
                create: {
                    modelId,
                    displayName: modelId.toUpperCase(),
                    provider,
                    inputPrice: pricing.input,
                    outputPrice: pricing.output
                },
                update: {
                    // Only update if prices are currently 0 (don't overwrite manual edits)
                    ...(pricing.input > 0 ? { inputPrice: pricing.input } : {}),
                    ...(pricing.output > 0 ? { outputPrice: pricing.output } : {})
                }
            });
            count++;
        }

        revalidatePath("/admin/settings");
        return { success: true, count };

    } catch (error) {
        console.error("Failed to fetch models:", error);
        return { success: false, count: 0 };
    }
}

/**
 * Erstellt leere Preiseinträge für eine Liste von Modellen (falls nicht vorhanden)
 */
export async function ensureModelPricingExists(
    models: { id: string; displayName?: string; provider: "openai" | "google" }[]
): Promise<void> {
    for (const model of models) {
        await prisma.modelPricing.upsert({
            where: { modelId: model.id },
            create: {
                modelId: model.id,
                displayName: model.displayName || model.id,
                provider: model.provider,
                inputPrice: 0,
                outputPrice: 0
            },
            update: {} // Don't overwrite existing prices
        });
    }
}
