/** USD je 1M Tokens — manuell gepflegt, Fallback beim Provider-Sync. */
export const KNOWN_MODEL_PRICING_USD_PER_1M: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o-2024-08-06": { input: 2.5, output: 10 },
  "gpt-4o-2024-05-13": { input: 5, output: 15 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4": { input: 30, output: 60 },
  "gpt-4-32k": { input: 60, output: 120 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "gpt-3.5-turbo-0125": { input: 0.5, output: 1.5 },
  "gpt-5.1": { input: 1.25, output: 10 },
  "gpt-5.2": { input: 1.75, output: 14 },
  "gpt-5": { input: 1.25, output: 10 },
  "gpt-5-mini": { input: 0.25, output: 2 },
  "gemini-2.0-flash-exp": { input: 0, output: 0 },
  "gemini-1.5-pro": { input: 3.5, output: 10.5 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
};
