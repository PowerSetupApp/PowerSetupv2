import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/results/[id] - Abrufen eines Results
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Result abrufen
        const result = await prisma.result.findUnique({
            where: { id },
            include: {
                creditBalance: true,
            },
        });

        if (!result) {
            return NextResponse.json(
                { error: "Result nicht gefunden" },
                { status: 404 }
            );
        }

        // Prüfen ob abgelaufen
        if (new Date() > result.expiresAt) {
            return NextResponse.json(
                { error: "Result ist abgelaufen" },
                { status: 410 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching result:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

// PATCH /api/results/[id] - Aktualisieren eines Results
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Prüfen ob Result existiert
        const existingResult = await prisma.result.findUnique({
            where: { id },
        });

        if (!existingResult) {
            return NextResponse.json(
                { error: "Result nicht gefunden" },
                { status: 404 }
            );
        }

        // Prüfen ob abgelaufen
        if (new Date() > existingResult.expiresAt) {
            return NextResponse.json(
                { error: "Result ist abgelaufen und kann nicht mehr aktualisiert werden" },
                { status: 410 }
            );
        }

        // Nur erlaubte Felder aktualisieren
        const updateData: Prisma.ResultUpdateInput = {
            version: existingResult.version + 1, // Version erhöhen
        };

        if (body.formData !== undefined) {
            updateData.formData = body.formData as Prisma.InputJsonValue;
        }
        if (body.calculations !== undefined) {
            updateData.calculations = body.calculations as Prisma.InputJsonValue;
        }
        if (body.recommendations !== undefined) {
            updateData.recommendations = body.recommendations as Prisma.InputJsonValue;
        }
        if (body.schematicData !== undefined) {
            updateData.schematicData = body.schematicData as Prisma.InputJsonValue;
        }

        // Result aktualisieren
        const updatedResult = await prisma.result.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedResult);
    } catch (error) {
        console.error("Error updating result:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
