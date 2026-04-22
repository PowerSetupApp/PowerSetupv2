/** Gemini REST-Pfadsegment (ohne `models/`-Präfix), z. B. `gemini-2.0-flash`. */
export const DEFAULT_GEMINI_REST_MODEL = "gemini-2.0-flash";

export const DEFAULT_OPENAI_CHAT_MODEL = "gpt-4o-mini";

/**
 * Admin speichert oft `models/gemini-…` (Listen-API); REST-URL ist `…/models/gemini-…:generateContent`.
 */
export function resolveGeminiRestModelId(configured: string | undefined): string {
  const t = (configured ?? "").trim();
  if (!t) return DEFAULT_GEMINI_REST_MODEL;
  return t.replace(/^models\//, "");
}

export function resolveOpenAIChatModel(configured: string | undefined): string {
  const t = (configured ?? "").trim();
  return t || DEFAULT_OPENAI_CHAT_MODEL;
}
