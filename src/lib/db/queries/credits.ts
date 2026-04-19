import { Prisma } from "@/generated/prisma/client";

import { getPrisma } from "@/lib/db/client";

export class InsufficientCreditsError extends Error {
  constructor(message = "Nicht genug Credits.") {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

export async function getCreditBalance(resultId: string): Promise<number> {
  const prisma = getPrisma();
  const row = await prisma.creditBalance.findUnique({
    where: { resultId },
    select: { balance: true },
  });
  return row?.balance ?? 0;
}

/**
 * Idempotent: gleiche `paypalOrderId` wird nicht doppelt gutgeschrieben.
 */
export async function grantCreditsFromPurchase(params: {
  resultId: string;
  paypalOrderId: string;
  paypalStatus: string;
  packageType: string;
  credits: number;
  amount: string;
  currency: string;
}): Promise<{ granted: boolean; balance: number }> {
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const dup = await tx.creditPurchase.findUnique({
      where: { paypalOrderId: params.paypalOrderId },
      select: { id: true },
    });
    if (dup) {
      const bal = await tx.creditBalance.findUnique({
        where: { resultId: params.resultId },
        select: { balance: true },
      });
      return { granted: false, balance: bal?.balance ?? 0 };
    }

    await tx.creditPurchase.create({
      data: {
        resultId: params.resultId,
        paypalOrderId: params.paypalOrderId,
        paypalStatus: params.paypalStatus,
        packageType: params.packageType,
        credits: params.credits,
        amount: new Prisma.Decimal(params.amount),
        currency: params.currency,
      },
    });

    const updated = await tx.creditBalance.upsert({
      where: { resultId: params.resultId },
      create: { resultId: params.resultId, balance: params.credits },
      update: { balance: { increment: params.credits } },
      select: { balance: true },
    });

    return { granted: true, balance: updated.balance };
  });
}

/**
 * Verbraucht Credits und persistiert Schaltplan-Daten + PDF-URL atomar.
 */
export async function consumeCreditsAndStoreSchematic(params: {
  resultId: string;
  cost: number;
  schematicData: Prisma.InputJsonValue;
  schematicPdfUrl: string;
}): Promise<void> {
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const dec = await tx.creditBalance.updateMany({
      where: { resultId: params.resultId, balance: { gte: params.cost } },
      data: { balance: { decrement: params.cost } },
    });
    if (dec.count !== 1) {
      throw new InsufficientCreditsError();
    }

    await tx.creditUsage.create({
      data: {
        resultId: params.resultId,
        amount: params.cost,
        action: "schematic_pdf",
      },
    });

    await tx.result.update({
      where: { id: params.resultId },
      data: {
        schematicData: params.schematicData,
        schematicPdfUrl: params.schematicPdfUrl,
        creditsUsed: { increment: params.cost },
      },
    });
  });
}
