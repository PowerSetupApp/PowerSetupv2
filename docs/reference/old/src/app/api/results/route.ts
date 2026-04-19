import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FormDataSchema } from "@/lib/schemas/result";
import { calculateSystemRequirements, type WizardInput } from "@/lib/algorithm";
import { getAlgorithmSettings } from "@/app/actions/algorithm-settings";

// POST /api/results - Create new Result
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate formData
        const parseResult = FormDataSchema.safeParse(body.formData);

        if (!parseResult.success) {
            const flattened = parseResult.error.flatten();
            const fieldErrors = Object.entries(flattened.fieldErrors)
                .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
                .join('; ');

            console.error("Validation errors:", JSON.stringify(flattened, null, 2));

            return NextResponse.json(
                {
                    error: fieldErrors || "Invalid form data",
                    details: flattened,
                },
                { status: 400 }
            );
        }

        // Fetch settings from DB
        const settings = await getAlgorithmSettings();

        // Calculate system requirements algorithmically
        let calculations = null;
        try {
            const data = parseResult.data as any;

            // Map flat formData fields to customOverrides structure (like in generate route)
            const wizardInput = {
                ...(parseResult.data as unknown as WizardInput),
                customOverrides: {
                    battery: data.customBatteryCapacity ?? null,
                    solar: data.customSolarPower ?? null,
                    booster: data.customBoosterCurrent ?? null,
                    controller: data.customSolarControllerCurrent ?? null,
                    inverter: data.customInverterPower ?? null,
                    charger: data.customChargerCurrent ?? null,
                },
            };

            calculations = await calculateSystemRequirements(wizardInput, settings);

        } catch (calcError) {
            console.error("Requirements calculation failed:", calcError);
            // Continue without calculations - AI will fall back to its own logic
        }

        // expiresAt = createdAt + 90 days
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + 90);

        // Create Result
        const result = await prisma.result.create({
            data: {
                formData: parseResult.data,
                // Serialize to plain JSON object for Prisma
                ...(calculations && { calculations: JSON.parse(JSON.stringify(calculations)) }),
                expiresAt,
            },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating result:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// GET /api/results - Get all results (Admin)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
        const skip = (page - 1) * limit;

        const where = { expiresAt: { gt: new Date() } };

        const [results, total] = await Promise.all([
            prisma.result.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.result.count({ where }),
        ]);

        return NextResponse.json({
            results,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching results:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
