import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertMock = vi.fn();

vi.mock("@/lib/db/client", () => ({
  getPrisma: () => ({
    systemSetting: { findUnique: vi.fn().mockResolvedValue({ value: "sk-test" }) },
    modelPricing: { upsert: upsertMock },
  }),
}));

describe("fetchAndSaveModelPricing", () => {
  beforeEach(() => {
    upsertMock.mockReset();
    upsertMock.mockResolvedValue({});
  });

  it("runs upserts via Promise.allSettled without $transaction", async () => {
    const { fetchAndSaveModelPricing } = await import("./admin-settings-pricing");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: Array.from({ length: 20 }, (_, i) => ({ id: `gpt-${i}` })) }),
    }) as never;

    await fetchAndSaveModelPricing("openai");

    expect(upsertMock).toHaveBeenCalledTimes(20);
  });
});
