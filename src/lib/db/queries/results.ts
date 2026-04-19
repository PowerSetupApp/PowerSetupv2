import type { Prisma, GenerationStatus, SchematicVariant } from "@/generated/prisma/client";

import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";
import { getPrisma } from "@/lib/db/client";
import { addResultRetention } from "@/lib/results/result-helpers";

export type StoredRecommendationPayload = {
  prefilter: unknown;
  ai?: {
    selections: unknown;
    model: string;
    inputTokens: number;
    outputTokens: number;
  };
};

export async function createResultFromFormData(formData: AlgorithmInput): Promise<{ id: string }> {
  const prisma = getPrisma();
  const row = await prisma.result.create({
    data: {
      formData: formData as unknown as Prisma.InputJsonValue,
      expiresAt: addResultRetention(),
    },
  });
  return { id: row.id };
}

export type ResultRowForPage = {
  id: string;
  formData: unknown;
  calculations: unknown;
  recommendations: unknown;
  expiresAt: Date;
  schematicPdfUrl: string | null;
  schematicVariant: SchematicVariant;
  creditBalance: number;
  generationStatus: GenerationStatus;
  generationError: string | null;
};

export async function getResultByIdForPublic(id: string): Promise<ResultRowForPage | null> {
  const prisma = getPrisma();
  const row = await prisma.result.findUnique({
    where: { id },
    select: {
      id: true,
      formData: true,
      calculations: true,
      recommendations: true,
      expiresAt: true,
      schematicPdfUrl: true,
      schematicVariant: true,
      generationStatus: true,
      generationError: true,
      creditBalance: { select: { balance: true } },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    formData: row.formData,
    calculations: row.calculations,
    recommendations: row.recommendations,
    expiresAt: row.expiresAt,
    schematicPdfUrl: row.schematicPdfUrl,
    schematicVariant: row.schematicVariant,
    creditBalance: row.creditBalance?.balance ?? 0,
    generationStatus: row.generationStatus,
    generationError: row.generationError,
  };
}

/**
 * Stale-Threshold für `pending` — nach diesem Zeitraum darf ein neuer Request
 * die Reservierung übernehmen. Verhindert „für immer pending" bei Server-
 * Abstürzen, ohne normale Läufe (AI-Pipeline: &lt; 30s) zu unterbrechen.
 */
export const GENERATION_PENDING_STALE_MS = 5 * 60 * 1000;

export type ClaimOutcome =
  | { claimed: true }
  | { claimed: false; status: GenerationStatus; expired: boolean };

/**
 * Atomarer Lock-Übergang `idle|failed|stale-pending → pending`.
 * Bei `claimed: true` übernimmt der Aufrufer die Berechnung exklusiv.
 */
export async function tryClaimGenerationSlot(
  id: string,
  now: Date = new Date(),
): Promise<ClaimOutcome> {
  const prisma = getPrisma();
  const staleThreshold = new Date(now.getTime() - GENERATION_PENDING_STALE_MS);

  const { count } = await prisma.result.updateMany({
    where: {
      id,
      OR: [
        { generationStatus: { in: ["idle", "failed"] } },
        { generationStatus: "pending", generationStartedAt: { lt: staleThreshold } },
      ],
    },
    data: {
      generationStatus: "pending",
      generationStartedAt: now,
      generationError: null,
    },
  });

  if (count === 1) return { claimed: true };

  const row = await prisma.result.findUnique({
    where: { id },
    select: { generationStatus: true, expiresAt: true },
  });
  if (!row) return { claimed: false, status: "idle", expired: false };
  return {
    claimed: false,
    status: row.generationStatus,
    expired: row.expiresAt.getTime() <= now.getTime(),
  };
}

export async function markGenerationFailed(id: string, message: string): Promise<void> {
  const prisma = getPrisma();
  await prisma.result.update({
    where: { id },
    data: {
      generationStatus: "failed",
      generationError: message.slice(0, 500),
    },
  });
}

export async function updateResultAfterGeneration(params: {
  id: string;
  calculations: AlgorithmOutput;
  recommendations: StoredRecommendationPayload;
  aiModel: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
}): Promise<void> {
  const prisma = getPrisma();
  await prisma.result.update({
    where: { id: params.id },
    data: {
      calculations: params.calculations as unknown as Prisma.InputJsonValue,
      recommendations: params.recommendations as unknown as Prisma.InputJsonValue,
      aiModel: params.aiModel,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      generationStatus: "succeeded",
      generationError: null,
    },
  });
}
