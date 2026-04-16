export type AIProvider = "gemini" | "openai" | "mock";

export type AIResponseMimeType = "application/json" | "text/plain";

export interface AICompletionRequest {
  /** Optional System-Anweisung (Gemini: systemInstruction; OpenAI: system message). */
  systemInstruction?: string;
  userPrompt: string;
  responseMimeType?: AIResponseMimeType;
}

export interface AICompletionResult {
  text: string;
  provider: AIProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export class AIInvocationError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIInvocationError";
  }
}
