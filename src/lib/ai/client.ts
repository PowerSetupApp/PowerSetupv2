import { getAISettings, type AISettingsDTO } from "@/lib/db/queries/admin-settings-ai";

import { completeWithGemini } from "./gemini";
import { completeWithOpenAI } from "./openai";
import { resolveGeminiRestModelId, resolveOpenAIChatModel } from "./resolve-chat-models";
import type { AICompletionRequest, AICompletionResult } from "./types";
import { AIInvocationError } from "./types";

type ChatBackend = "gemini" | "openai";

const MAX_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function backoffMs(attempt: number): number {
  return Math.min(2000, 200 * 2 ** attempt);
}

function mockCompletion(): AICompletionResult {
  return {
    text: JSON.stringify({ selections: [] }),
    provider: "mock",
    model: "mock-model",
    inputTokens: 0,
    outputTokens: 0,
  };
}

async function withRetries(
  label: string,
  fn: () => Promise<AICompletionResult>,
): Promise<AICompletionResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(backoffMs(attempt));
      }
    }
  }
  throw new AIInvocationError(`${label} nach ${MAX_ATTEMPTS} Versuchen fehlgeschlagen`, lastError);
}

function isMockAi(): boolean {
  const v = process.env.USE_MOCK_AI?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function chatBackendsOrder(
  provider: "google" | "openai",
  hasGemini: boolean,
  hasOpenai: boolean,
): ChatBackend[] {
  const preferOpenAi = provider === "openai";
  const geminiFirst: ChatBackend[] = [];
  if (hasGemini) geminiFirst.push("gemini");
  if (hasOpenai) geminiFirst.push("openai");

  const openaiFirst: ChatBackend[] = [];
  if (hasOpenai) openaiFirst.push("openai");
  if (hasGemini) openaiFirst.push("gemini");

  if (preferOpenAi) {
    return openaiFirst.length > 0 ? openaiFirst : geminiFirst;
  }
  return geminiFirst.length > 0 ? geminiFirst : openaiFirst;
}

/**
 * Zentraler KI-Einstieg: Mock (CI), sonst Provider aus Admin (Google/OpenAI),
 * Chat-Modell aus Admin, Fallback auf den jeweils anderen Schlüssel.
 * Keine Netzwerke in Tests: `USE_MOCK_AI=true` (auch `1`/`yes`).
 */
/**
 * @param cachedSettings Wenn gesetzt (z. B. bereits von `getAISettings()`), entfällt ein zweiter DB-Roundtrip.
 */
export async function callAI(request: AICompletionRequest, cachedSettings?: AISettingsDTO): Promise<AICompletionResult> {
  if (isMockAi()) {
    return mockCompletion();
  }

  const settings = cachedSettings ?? (await getAISettings());
  /** Reihenfolge: zuerst Werte aus Admin-DB (`getAISettings`, inkl. Fallback auf GEMINI_API_KEY in der Query), dann gängige Env-Variablen. */
  const geminiKey =
    settings.geminiApiKey.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    "";
  const openaiKey = settings.openaiApiKey.trim();

  const hasGemini = Boolean(geminiKey);
  const hasOpenai = Boolean(openaiKey);

  if (!hasGemini && !hasOpenai) {
    throw new AIInvocationError(
      "Kein API-Schlüssel: in den Admin-Einstellungen unter „KI & Modelle“ hinterlegen oder GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY / OPENAI_API_KEY in der Umgebung setzen (für Tests: USE_MOCK_AI=true).",
    );
  }

  const geminiModelConfigured = settings.provider === "google" ? settings.model : "";
  const openaiModelConfigured = settings.provider === "openai" ? settings.model : "";
  const geminiModelId = resolveGeminiRestModelId(geminiModelConfigured);
  const openaiModelId = resolveOpenAIChatModel(openaiModelConfigured);

  const order = chatBackendsOrder(settings.provider, hasGemini, hasOpenai);
  let lastError: unknown;

  for (const backend of order) {
    try {
      if (backend === "gemini") {
        return await withRetries("Gemini", () =>
          completeWithGemini(request, geminiKey, geminiModelId),
        );
      }
      return await withRetries("OpenAI", () =>
        completeWithOpenAI(request, openaiKey, openaiModelId),
      );
    } catch (e) {
      lastError = e;
    }
  }

  throw new AIInvocationError("Alle konfigurierten KI-Provider sind nach mehreren Versuchen fehlgeschlagen", lastError);
}
