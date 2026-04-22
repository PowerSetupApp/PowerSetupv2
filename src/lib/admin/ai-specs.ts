import { callAI } from "@/lib/ai/client";
import { getAISettings } from "@/lib/db/queries/admin-settings-ai";

export type OptimizeSpecsResult = {
  text: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

function renderPrompt(template: string, input: string, categoryName: string | null): string {
  const withInput = template.includes("{{INPUT}}")
    ? template.replace("{{INPUT}}", input)
    : `${template}\n\nText:\n${input}`;
  if (categoryName && withInput.includes("{{CATEGORY}}")) {
    return withInput.replace("{{CATEGORY}}", categoryName);
  }
  if (categoryName) {
    return `${withInput}\n\nKategorie: ${categoryName}`;
  }
  return withInput;
}

export async function optimizeSpecsText(input: string, categoryName: string | null): Promise<OptimizeSpecsResult> {
  const settings = await getAISettings();
  const prompt = renderPrompt(settings.specsOptimizationPrompt, input, categoryName);
  const sys = settings.systemPrompt.trim();
  const completion = await callAI(
    {
      ...(sys ? { systemInstruction: sys } : {}),
      userPrompt: prompt,
      responseMimeType: "text/plain",
    },
    settings,
  );
  return {
    text: completion.text.trim(),
    provider: completion.provider,
    model: completion.model,
    inputTokens: completion.inputTokens,
    outputTokens: completion.outputTokens,
  };
}
