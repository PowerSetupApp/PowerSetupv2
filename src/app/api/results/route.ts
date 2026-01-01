import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FormDataSchema } from "@/lib/schemas/result";
import { calculateSystemRequirements, type WizardInput } from "@/lib/requirements-engine";

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

        // Calculate system requirements algorithmically
        let calculations = null;
        try {
            const wizardInput = parseResult.data as unknown as WizardInput;
            calculations = await calculateSystemRequirements(wizardInput);

            // APPLY OVERRIDES if present in formData
            // note: formData is 'any' basically after parseResult.data, but let's be safe.
            const data = parseResult.data as any;

            if (calculations) {
                if (data.customBatteryCapacity) {
                    console.log(`Overriding Battery Capacity: ${calculations.battery.recommendedCapacityAh} -> ${data.customBatteryCapacity}`);
                    calculations.battery.recommendedCapacityAh = data.customBatteryCapacity;
                }

                if (data.customSolarPower && calculations.solarModules) {
                    console.log(`Overriding Solar Power: ${calculations.solarModules.totalAvailableWp} -> ${data.customSolarPower}`);
                    calculations.solarModules.totalAvailableWp = data.customSolarPower;
                    // Also update requiredWp ? No, required is what is needed, available is what we select against.
                    // But wait, if user overrides, they are saying "I want X Wp", so effectively this becomes the target for product search.
                    // Implementation plan said: "calculations.solarModules.requiredWp"
                    // But `totalAvailableWp` is usually what matches the selected bags + roof. 
                    // Let's decide: The user input is "Desired Power". So we should probably set 'totalAvailableWp' to match that, implies we look for that amount.
                }

                if (data.customBoosterCurrent && calculations.booster) {
                    console.log(`Overriding Booster Current: ${calculations.booster.currentA} -> ${data.customBoosterCurrent}`);
                    calculations.booster.currentA = data.customBoosterCurrent;
                }

                if (data.customSolarControllerCurrent && calculations.solarController) {
                    console.log(`Overriding Controller Current: ${calculations.solarController.recommendedCurrentA} -> ${data.customSolarControllerCurrent}`);
                    calculations.solarController.recommendedCurrentA = data.customSolarControllerCurrent;
                }
            }

            console.log("Calculated requirements (with overrides):", JSON.stringify(calculations, null, 2));
        } catch (calcError) {
            console.error("Requirements calculation failed:", calcError);
            // Continue without calculations - AI will fall back to its own logic
        }

        // expiresAt = createdAt + 90 Tage
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + 90);

        // Result erstellen
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
