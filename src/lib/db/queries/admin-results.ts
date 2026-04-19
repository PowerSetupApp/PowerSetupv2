import { getPrisma } from "@/lib/db/client";
import { readFromDatabase, type DbReadResult } from "@/lib/db/prisma-errors";
import { decimalToNumber } from "@/lib/money";

export type AdminResultRow = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  generationStatus: string;
  aiModel: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costCents: number | null;
};

export type AiPricing = { inputPrice: number; outputPrice: number };

/**
 * Bruttokosten-Schätzung in Cent für einen Result basierend auf Token-Zählern
 * und ModelPricing (USD pro Token). Wenn Pricing fehlt oder Tokens `null` sind,
 * geben wir `null` zurück, damit die UI "—" darstellen kann.
 */
export function estimateAiCostCents(
  inputTokens: number | null,
  outputTokens: number | null,
  pricing: AiPricing | null,
): number | null {
  if (pricing === null) return null;
  if (inputTokens === null && outputTokens === null) return null;
  const inTokens = inputTokens ?? 0;
  const outTokens = outputTokens ?? 0;
  const usd = inTokens * pricing.inputPrice + outTokens * pricing.outputPrice;
  return Math.round(usd * 100);
}

const ADMIN_RESULTS_WINDOW_DAYS = 90;

export async function listAdminResultsLast90Days(): Promise<DbReadResult<AdminResultRow[]>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const since = new Date(Date.now() - ADMIN_RESULTS_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const results = await prisma.result.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        generationStatus: true,
        aiModel: true,
        inputTokens: true,
        outputTokens: true,
      },
    });

    const modelIds = Array.from(new Set(results.map((r) => r.aiModel).filter((m): m is string => Boolean(m))));
    const pricings =
      modelIds.length === 0
        ? []
        : await prisma.modelPricing.findMany({
            where: { modelId: { in: modelIds } },
            select: { modelId: true, inputPrice: true, outputPrice: true },
          });
    const pricingByModel = new Map<string, AiPricing>(
      pricings.map((p) => [
        p.modelId,
        { inputPrice: decimalToNumber(p.inputPrice) ?? 0, outputPrice: decimalToNumber(p.outputPrice) ?? 0 },
      ]),
    );

    return results.map((r) => {
      const pricing = r.aiModel ? pricingByModel.get(r.aiModel) ?? null : null;
      return {
        id: r.id,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        generationStatus: r.generationStatus,
        aiModel: r.aiModel,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        costCents: estimateAiCostCents(r.inputTokens, r.outputTokens, pricing),
      };
    });
  });
}
