import type { AICompletionRequest, AICompletionResult } from "./types";
import { AIInvocationError } from "./types";

import { DEFAULT_GEMINI_REST_MODEL } from "./resolve-chat-models";

const REQUEST_TIMEOUT_MS = 30_000;

export async function completeWithGemini(
  request: AICompletionRequest,
  apiKey: string,
  restModelId: string = DEFAULT_GEMINI_REST_MODEL,
): Promise<AICompletionResult> {
  const key = apiKey.trim();
  if (!key) {
    throw new AIInvocationError("Gemini-API-Schlüssel fehlt (Admin „KI & Modelle“ oder GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY)");
  }

  const modelId = restModelId.trim() || DEFAULT_GEMINI_REST_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`;

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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      // API-Key gehört in den Header, nicht in die URL (Leak in Logs/Referrer).
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new AIInvocationError(`Gemini Timeout nach ${REQUEST_TIMEOUT_MS}ms`, e);
    }
    throw new AIInvocationError("Gemini Netzwerk-Fehler", e);
  } finally {
    clearTimeout(timer);
  }

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
    model: modelId,
    inputTokens: json.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: json.usageMetadata?.candidatesTokenCount ?? 0,
  };
}
