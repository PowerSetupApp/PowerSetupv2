
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const categories = await prisma.consumerCategory.findMany({
            include: {
                _count: {
                    select: { devices: true },
                },
            },
            orderBy: {
                sortOrder: "asc",
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching consumer categories:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden der Kategorien" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, icon, sortOrder } = body;

        // Slug erstellen (einfach)
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const category = await prisma.consumerCategory.create({
            data: {
                name,
                slug,
                icon,
                sortOrder: parseInt(sortOrder) || 0,
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error creating consumer category:", error);
        return NextResponse.json(
            { error: "Fehler beim Erstellen der Kategorie" },
            { status: 500 }
        );
    }
}
