import type { AICompletionRequest, AICompletionResult } from "./types";
import { AIInvocationError } from "./types";

const GEMINI_MODEL = "gemini-2.0-flash";

function geminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

export async function completeWithGemini(request: AICompletionRequest): Promise<AICompletionResult> {
  const key = geminiApiKey();
  if (!key) {
    throw new AIInvocationError("GEMINI_API_KEY (oder GOOGLE_GENERATIVE_AI_API_KEY) fehlt");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: request.userPrompt }] }],
    generationConfig: {
      temperature: 0.2,
      ...(request.responseMimeType === "application/json"
        ? { responseMimeType: "application/json" as const }
        : {}),
    },
  };

  if (request.systemInstruction?.trim()) {
    body.systemInstruction = { parts: [{ text: request.systemInstruction.trim() }] };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new AIInvocationError(`Gemini HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text == null || text === "") {
    throw new AIInvocationError("Gemini-Antwort ohne Text");
  }

  return {
    text,
    provider: "gemini",
    model: GEMINI_MODEL,
    inputTokens: json.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: json.usageMetadata?.candidatesTokenCount ?? 0,
  };
}
