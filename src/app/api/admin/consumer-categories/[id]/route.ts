
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const category = await prisma.consumerCategory.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { devices: true },
                },
            },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Kategorie nicht gefunden" },
                { status: 404 }
            );
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error fetching consumer category:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden der Kategorie" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, icon, sortOrder } = body;

        const category = await prisma.consumerCategory.update({
            where: { id },
            data: {
                name,
                icon,
                sortOrder: parseInt(sortOrder) || 0,
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error updating consumer category:", error);
        return NextResponse.json(
            { error: "Fehler beim Aktualisieren der Kategorie" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.consumerCategory.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting consumer category:", error);
        return NextResponse.json(
            { error: "Fehler beim Löschen der Kategorie" },
            { status: 500 }
        );
    }
}
