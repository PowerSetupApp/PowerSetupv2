import { headers } from "next/headers";

import { readFromDatabase } from "@/lib/db/prisma-errors";
import { getPrisma } from "@/lib/db/client";

export type AdminDashboardStats = {
  productCount: number;
  activeProductCount: number;
  categoryCount: number;
  resultsLast7Days: number;
};

export type AdminDashboardStatsResult =
  | { ok: true; stats: AdminDashboardStats }
  | { ok: false; reason: "database_unavailable"; message: string };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function getAdminDashboardStats(): Promise<AdminDashboardStatsResult> {
  await headers();

  const result = await readFromDatabase(async () => {
    const prisma = getPrisma();
    const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY);

    const [productCount, activeProductCount, categoryCount, resultsLast7Days] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.category.count(),
        prisma.result.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
      ]);

    return {
      productCount,
      activeProductCount,
      categoryCount,
      resultsLast7Days,
    };
  });

  if (!result.ok) {
    return { ok: false, reason: "database_unavailable", message: result.message };
  }
  return { ok: true, stats: result.data };
}
