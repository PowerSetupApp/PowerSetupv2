import { getPrisma } from "@/lib/db/client";

export type AiProvider = "google" | "openai";

export type AISettingsDTO = {
  provider: AiProvider;
  model: string;
  imageModel: string;
  geminiApiKey: string;
  openaiApiKey: string;
  systemPrompt: string;
  userPromptTemplate: string;
  imagePromptTemplate: string;
  specsOptimizationPrompt: string;
};

const DEFAULT_SPECS_PROMPT =
  "Optimiere den folgenden Text für KI-Verarbeitung. Reduziere auf die wesentlichen technischen Daten. Ausgabe als kompakte Zeilen ohne Markdown.\n\nText:\n{{INPUT}}";

export async function getAISettings(): Promise<AISettingsDTO> {
  const prisma = getPrisma();
  const defaults: AISettingsDTO = {
    provider: "google",
    model: "models/gemini-2.0-flash-exp",
    imageModel: "dall-e-3",
    geminiApiKey: process.env.GEMINI_API_KEY ?? "",
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    systemPrompt: "",
    userPromptTemplate: "",
    imagePromptTemplate: "",
    specsOptimizationPrompt: DEFAULT_SPECS_PROMPT,
  };

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
    provider: (provider?.value as AiProvider) || defaults.provider,
    model: model?.value || defaults.model,
    imageModel: imageModel?.value || defaults.imageModel,
    geminiApiKey: geminiKey?.value || defaults.geminiApiKey,
    openaiApiKey: openaiKey?.value || defaults.openaiApiKey,
    systemPrompt: activePrompt?.systemPrompt || defaults.systemPrompt,
    userPromptTemplate: activePrompt?.userPromptTemplate || defaults.userPromptTemplate,
    imagePromptTemplate: imagePrompt?.value || defaults.imagePromptTemplate,
    specsOptimizationPrompt: specsPrompt?.value || defaults.specsOptimizationPrompt,
  };
}

export async function updateAISettings(input: {
  provider: AiProvider;
  model: string;
  imageModel: string;
  geminiApiKey: string;
  openaiApiKey: string;
  userPromptTemplate: string;
  imagePromptTemplate: string;
  specsOptimizationPrompt: string;
}): Promise<void> {
  const prisma = getPrisma();
  const settings: [string, string][] = [
    ["ai_provider", input.provider],
    ["ai_model", input.model],
    ["ai_image_model", input.imageModel],
    ["gemini_api_key", input.geminiApiKey],
    ["openai_api_key", input.openaiApiKey],
    ["ai_image_prompt_template", input.imagePromptTemplate],
    ["ai_specs_optimization_prompt", input.specsOptimizationPrompt],
  ];

  // Alles-oder-nichts: schützt gegen inkonsistente Zustände (Alt-Bug:
  // manche Keys gespeichert, Prompt-Version aber nicht).
  await prisma.$transaction(async (tx) => {
    for (const [key, value] of settings) {
      await tx.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    await tx.promptVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
    const last = await tx.promptVersion.findFirst({ orderBy: { version: "desc" } });
    const nextVersion = (last?.version ?? 0) + 1;
    await tx.promptVersion.create({
      data: {
        version: nextVersion,
        systemPrompt: "",
        userPromptTemplate: input.userPromptTemplate,
        isActive: true,
      },
    });
  });
}

export type AIModelOption = { id: string; name: string; displayName: string; provider: AiProvider };

export async function listGeminiTextModels(apiKey?: string): Promise<AIModelOption[]> {
  const fallback: AIModelOption[] = [
    { id: "gemini-2.0-flash-exp", name: "models/gemini-2.0-flash-exp", displayName: "Gemini 2.0 Flash (Exp)", provider: "google" },
    { id: "gemini-1.5-flash", name: "models/gemini-1.5-flash", displayName: "Gemini 1.5 Flash", provider: "google" },
    { id: "gemini-1.5-pro", name: "models/gemini-1.5-pro", displayName: "Gemini 1.5 Pro", provider: "google" },
  ];
  const key = apiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!key) return fallback;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
    if (!res.ok) return fallback;
    const data = (await res.json()) as { models?: { name: string; displayName?: string }[] };
    if (!data.models) return fallback;
    return data.models
      .filter((m) => m.name.includes("gemini"))
      .map((m) => ({
        id: m.name.replace(/^models\//, ""),
        name: m.name,
        displayName: m.displayName ?? m.name,
        provider: "google" as const,
      }));
  } catch {
    return fallback;
  }
}

export async function listGeminiImageModels(): Promise<AIModelOption[]> {
  return [
    { id: "imagen-3.0-generate-001", name: "imagen-3.0-generate-001", displayName: "Imagen 3 (Vertex/Studio)", provider: "google" },
  ];
}

export async function listOpenAITextModels(apiKey: string): Promise<AIModelOption[]> {
  const fallback: AIModelOption[] = [
    { id: "gpt-4o", name: "gpt-4o", displayName: "GPT-4o", provider: "openai" },
    { id: "gpt-4-turbo", name: "gpt-4-turbo", displayName: "GPT-4 Turbo", provider: "openai" },
    { id: "gpt-3.5-turbo", name: "gpt-3.5-turbo", displayName: "GPT-3.5 Turbo", provider: "openai" },
  ];
  if (!apiKey.trim()) return fallback;
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { data?: { id: string }[] };
    const list = data.data?.filter((m) => m.id.includes("gpt")) ?? [];
    if (list.length === 0) return fallback;
    return list
      .map((m) => ({
        id: m.id,
        name: m.id,
        displayName: m.id.toUpperCase(),
        provider: "openai" as const,
      }))
      .sort((a, b) => b.name.localeCompare(a.name));
  } catch {
    return fallback;
  }
}

export async function listOpenAIImageModels(apiKey: string): Promise<AIModelOption[]> {
  const fallback: AIModelOption[] = [
    { id: "dall-e-3", name: "dall-e-3", displayName: "DALL·E 3", provider: "openai" },
    { id: "dall-e-2", name: "dall-e-2", displayName: "DALL·E 2", provider: "openai" },
  ];
  if (!apiKey.trim()) return fallback;
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { data?: { id: string }[] };
    const list = data.data?.filter((m) => m.id.includes("dall-e")) ?? [];
    if (list.length === 0) return fallback;
    return list
      .map((m) => ({
        id: m.id,
        name: m.id,
        displayName: m.id.toUpperCase(),
        provider: "openai" as const,
      }))
      .sort((a, b) => b.name.localeCompare(a.name));
  } catch {
    return fallback;
  }
}
