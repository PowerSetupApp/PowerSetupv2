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
