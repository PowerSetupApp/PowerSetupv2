import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const FilterUpdateSchema = z.object({
    name: z.string().min(1, "Name ist erforderlich").optional(),
    key: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9]*$/).optional(),
    type: z.enum(["text", "number", "select", "multiselect", "brand"]).optional(),
    unit: z.string().optional().nullable(),
    options: z.array(z.string()).optional(),
    sortOrder: z.number().optional(),
});

// GET /api/admin/categories/[id]/filters/[filterId] - Get single filter
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; filterId: string }> }
) {
    const { id, filterId } = await params;

    try {
        const filter = await prisma.categoryFilter.findFirst({
            where: {
                id: filterId,
                categoryId: id,
            },
        });

        if (!filter) {
            return NextResponse.json(
                { error: "Filter nicht gefunden" },
                { status: 404 }
            );
        }

        return NextResponse.json(filter);
    } catch (error) {
        console.error("Error fetching filter:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

// PUT /api/admin/categories/[id]/filters/[filterId] - Update filter
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; filterId: string }> }
) {
    const { id, filterId } = await params;

    try {
        const body = await request.json();

        const parseResult = FilterUpdateSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Validierungsfehler", details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        // Check if filter exists
        const existing = await prisma.categoryFilter.findFirst({
            where: {
                id: filterId,
                categoryId: id,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Filter nicht gefunden" },
                { status: 404 }
            );
        }

        // If key is being changed, check for conflicts
        if (parseResult.data.key && parseResult.data.key !== existing.key) {
            const conflict = await prisma.categoryFilter.findUnique({
                where: {
                    categoryId_key: {
                        categoryId: id,
                        key: parseResult.data.key,
                    },
                },
            });

            if (conflict) {
                return NextResponse.json(
                    { error: "Ein Filter mit diesem Key existiert bereits" },
                    { status: 409 }
                );
            }
        }

        const filter = await prisma.categoryFilter.update({
            where: { id: filterId },
            data: parseResult.data,
        });

        return NextResponse.json(filter);
    } catch (error) {
        console.error("Error updating filter:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/categories/[id]/filters/[filterId] - Delete filter
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; filterId: string }> }
) {
    const { id, filterId } = await params;

    try {
        const existing = await prisma.categoryFilter.findFirst({
            where: {
                id: filterId,
                categoryId: id,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Filter nicht gefunden" },
                { status: 404 }
            );
        }

        await prisma.categoryFilter.delete({
            where: { id: filterId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting filter:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
