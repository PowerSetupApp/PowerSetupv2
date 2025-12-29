import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FormDataSchema } from "@/lib/schemas/result";

// POST /api/results - Neues Result erstellen
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validierung der formData
        const parseResult = FormDataSchema.safeParse(body.formData);

        if (!parseResult.success) {
            const flattened = parseResult.error.flatten();
            const fieldErrors = Object.entries(flattened.fieldErrors)
                .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
                .join('; ');

            console.error("Validation errors:", JSON.stringify(flattened, null, 2));

            return NextResponse.json(
                {
                    error: fieldErrors || "Ungültige Formulardaten",
                    details: flattened,
                },
                { status: 400 }
            );
        }

        // expiresAt = createdAt + 90 Tage
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + 90);

        // Result erstellen
        const result = await prisma.result.create({
            data: {
                formData: parseResult.data,
                expiresAt,
            },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating result:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

// GET /api/results - Alle Results abrufen (optional, für Admin)
export async function GET() {
    try {
        const results = await prisma.result.findMany({
            where: {
                expiresAt: {
                    gt: new Date(), // Nur nicht-abgelaufene
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50, // Limit
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error fetching results:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
