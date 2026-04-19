import type { AICompletionRequest, AICompletionResult } from "./types";
import { AIInvocationError } from "./types";

const OPENAI_MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 30_000;

export async function completeWithOpenAI(request: AICompletionRequest): Promise<AICompletionResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new AIInvocationError("OPENAI_API_KEY fehlt");
  }

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (request.systemInstruction?.trim()) {
    messages.push({ role: "system", content: request.systemInstruction.trim() });
  }
  messages.push({ role: "user", content: request.userPrompt });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.2,
        ...(request.responseMimeType === "application/json"
          ? { response_format: { type: "json_object" as const } }
          : {}),
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new AIInvocationError(`OpenAI Timeout nach ${REQUEST_TIMEOUT_MS}ms`, e);
    }
    throw new AIInvocationError("OpenAI Netzwerk-Fehler", e);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new AIInvocationError(`OpenAI HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const text = json.choices?.[0]?.message?.content;
  if (text == null || text === "") {
    throw new AIInvocationError("OpenAI-Antwort ohne Text");
  }

  return {
    text,
    provider: "openai",
    model: OPENAI_MODEL,
    inputTokens: json.usage?.prompt_tokens ?? 0,
    outputTokens: json.usage?.completion_tokens ?? 0,
  };
}
