"use server";

import { prisma } from "@/lib/db";

export async function getResults() {
    try {
        const results = await prisma.result.findMany({
            orderBy: { createdAt: "desc" },
            take: 100, // Limit to last 100 results for performance
            select: {
                id: true,
                createdAt: true,
                aiModel: true,
                inputTokens: true,
                outputTokens: true,
                formData: true, // Need summary data like vehicleType
            },
        });
        return results;
    } catch (error) {
        console.error("Failed to fetch results:", error);
        return [];
    }
}

export async function updateResult(id: string, recommendations: any) {
    try {
        await prisma.result.update({
            where: { id },
            data: {
                recommendations: recommendations,
                aiModel: recommendations.debugInfo?.aiModel,
                inputTokens: recommendations.debugInfo?.inputTokens,
                outputTokens: recommendations.debugInfo?.outputTokens,
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to update result:", error);
        return { success: false, error: "Failed to update result" };
    }
}
