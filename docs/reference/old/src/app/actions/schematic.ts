"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveSchematicSelection(resultId: string, selectedProductIds: string[]) {
    if (!resultId) throw new Error("Result ID required");

    try {
        // Fetch current result to merge with existing schematicData if any
        const currentResult = await prisma.result.findUnique({
            where: { id: resultId },
            select: { schematicData: true }
        });

        const currentSchematicData = (currentResult?.schematicData as Record<string, any>) || {};

        const updatedSchematicData = {
            ...currentSchematicData,
            userSelection: selectedProductIds,
            selectionUpdatedAt: new Date().toISOString()
        };

        await prisma.result.update({
            where: { id: resultId },
            data: {
                schematicData: updatedSchematicData
            }
        });

        revalidatePath(`/result/${resultId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to save schematic selection:", error);
        throw new Error("Failed to save selection");
    }
}
