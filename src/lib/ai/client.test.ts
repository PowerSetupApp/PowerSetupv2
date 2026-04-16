import { afterEach, describe, expect, it, vi } from "vitest";

describe("callAI", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns deterministic mock when USE_MOCK_AI=true", async () => {
    vi.stubEnv("USE_MOCK_AI", "true");
    const { callAI } = await import("./client");
    const res = await callAI({
      userPrompt: "ignored in mock",
      responseMimeType: "application/json",
    });
    expect(res.provider).toBe("mock");
    expect(res.model).toBe("mock-model");
    expect(res.text).toContain("{");
    expect(res.inputTokens).toBeGreaterThanOrEqual(0);
    expect(res.outputTokens).toBeGreaterThanOrEqual(0);
  });
});
