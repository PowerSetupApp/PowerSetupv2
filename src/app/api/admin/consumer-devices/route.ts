
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    try {
        const where = categoryId ? { categoryId } : {};

        const devices = await prisma.consumerDevice.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: {
                sortOrder: "asc",
            },
        });

        return NextResponse.json(devices);
    } catch (error) {
        console.error("Error fetching consumer devices:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden der Geräte" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validation could be added here

        const device = await prisma.consumerDevice.create({
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
                sortOrder: parseInt(body.sortOrder) || 0,
                isActive: body.isActive !== false,
                isFeatured: body.isFeatured === true,
            },
        });

        return NextResponse.json(device);
    } catch (error) {
        console.error("Error creating consumer device:", error);
        return NextResponse.json(
            { error: "Fehler beim Erstellen des Geräts" },
            { status: 500 }
        );
    }
}
