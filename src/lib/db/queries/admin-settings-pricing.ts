import { getPrisma } from "@/lib/db/client";
import { readFromDatabase } from "@/lib/db/prisma-errors";
import { KNOWN_MODEL_PRICING_USD_PER_1M } from "@/lib/db/queries/admin-known-model-pricing";
import { decimalToNumberOrZero } from "@/lib/money";

export type ModelPricingRow = {
  id: string;
  modelId: string;
  displayName: string | null;
  provider: string;
  inputPrice: number;
  outputPrice: number;
  updatedAt: Date;
};

export async function listModelPricing(): Promise<ModelPricingRow[]> {
  const result = await readFromDatabase(async () => {
    const rows = await getPrisma().modelPricing.findMany({
      orderBy: [{ provider: "asc" }, { modelId: "asc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      modelId: r.modelId,
      displayName: r.displayName,
      provider: r.provider,
      inputPrice: decimalToNumberOrZero(r.inputPrice),
      outputPrice: decimalToNumberOrZero(r.outputPrice),
      updatedAt: r.updatedAt,
    }));
  });
  if (!result.ok) return [];
  return result.data;
}

export async function updateModelPricingRow(
  modelId: string,
  inputPrice: number,
  outputPrice: number,
): Promise<void> {
  await getPrisma().modelPricing.update({
    where: { modelId },
    data: { inputPrice, outputPrice },
  });
}

export async function fetchAndSaveModelPricing(
  provider: "openai" | "google",
): Promise<{ count: number }> {
  const prisma = getPrisma();
  let modelIds: string[] = [];

  if (provider === "openai") {
    const key = await prisma.systemSetting.findUnique({ where: { key: "openai_api_key" } });
    if (key?.value) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      try {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${key.value}` },
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as { data?: { id: string }[] };
          modelIds = (data.data ?? []).filter((m) => m.id.includes("gpt")).map((m) => m.id);
        }
      } catch {
        // Netzwerkfehler → ohne Liste abbrechen, keine destructive Änderung.
        modelIds = [];
      } finally {
        clearTimeout(timer);
      }
    }
  } else {
    modelIds = ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"];
  }

  if (modelIds.length === 0) return { count: 0 };

  // Atomar: alle Upserts oder keinen — vermeidet halbfertigen Stand.
  const ops = modelIds.map((modelId) => {
    const p = KNOWN_MODEL_PRICING_USD_PER_1M[modelId] ?? { input: 0, output: 0 };
    return prisma.modelPricing.upsert({
      where: { modelId },
      create: {
        modelId,
        displayName: modelId.toUpperCase(),
        provider,
        inputPrice: p.input,
        outputPrice: p.output,
      },
      update: {
        ...(p.input > 0 ? { inputPrice: p.input } : {}),
        ...(p.output > 0 ? { outputPrice: p.output } : {}),
      },
    });
  });
  await prisma.$transaction(ops);
  return { count: modelIds.length };
}
