import { completeWithGemini } from "./gemini";
import { completeWithOpenAI } from "./openai";
import type { AICompletionRequest, AICompletionResult } from "./types";
import { AIInvocationError } from "./types";

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
    text: JSON.stringify({ ok: true, note: "USE_MOCK_AI" }),
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

/**
 * Zentraler KI-Einstieg: Mock (CI), sonst Gemini mit Retries, dann OpenAI mit Retries.
 * Keine Netzwerke in Tests: `USE_MOCK_AI=true`.
 */
export async function callAI(request: AICompletionRequest): Promise<AICompletionResult> {
  if (process.env.USE_MOCK_AI === "true") {
    return mockCompletion();
  }

  const hasGemini =
    Boolean(process.env.GEMINI_API_KEY) || Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  const hasOpenai = Boolean(process.env.OPENAI_API_KEY);

  if (!hasGemini && !hasOpenai) {
    throw new AIInvocationError("Weder GEMINI_API_KEY noch OPENAI_API_KEY gesetzt (und USE_MOCK_AI nicht true)");
  }

  if (hasGemini) {
    try {
      return await withRetries("Gemini", () => completeWithGemini(request));
    } catch (e) {
      if (!hasOpenai) throw e;
    }
  }

  return await withRetries("OpenAI", () => completeWithOpenAI(request));
}
