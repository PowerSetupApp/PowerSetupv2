
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const categories = await prisma.consumerCategory.findMany({
            include: {
                devices: {
                    where: { isActive: true },
                    orderBy: { sortOrder: "asc" },
                },
            },
            orderBy: {
                sortOrder: "asc",
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching wizard consumers:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden der Konfiguration" },
            { status: 500 }
        );
    }
}
