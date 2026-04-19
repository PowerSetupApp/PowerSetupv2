
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const device = await prisma.consumerDevice.findUnique({
            where: { id },
            include: {
                category: true,
            },
        });

        if (!device) {
            return NextResponse.json(
                { error: "Gerät nicht gefunden" },
                { status: 404 }
            );
        }

        return NextResponse.json(device);
    } catch (error) {
        console.error("Error fetching consumer device:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden des Geräts" },
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

        const device = await prisma.consumerDevice.update({
            where: { id },
            data: {
                name: body.name,
                i18nKey: body.i18nKey || null,
                icon: body.icon,
                categoryId: body.categoryId,

                defaultPower: parseInt(body.defaultPower),
                defaultVoltage: body.defaultVoltage,
                defaultHoursPerDay: parseFloat(body.defaultHoursPerDay),
                stepHours: parseFloat(body.stepHours),

                showHoursField: body.showHoursField,
                showFixedOption: body.showFixedOption,
                isCooling: body.isCooling,

                keywords: body.keywords || [],
                sortOrder: parseInt(body.sortOrder),
                isActive: body.isActive,
                isFeatured: body.isFeatured,
            },
        });

        return NextResponse.json(device);
    } catch (error) {
        console.error("Error updating consumer device:", error);
        return NextResponse.json(
            {
                error: "Fehler beim Aktualisieren des Geräts",
                details: error instanceof Error ? error.message : String(error)
            },
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
        await prisma.consumerDevice.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting consumer device:", error);
        return NextResponse.json(
            { error: "Fehler beim Löschen des Geräts" },
            { status: 500 }
        );
    }
}
