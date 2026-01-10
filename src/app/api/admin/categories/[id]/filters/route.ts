import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const FilterSchema = z.object({
    name: z.string().min(1, "Name ist erforderlich"),
    key: z.string().min(1, "Key ist erforderlich").regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "Key muss mit Buchstabe beginnen und darf nur Buchstaben/Zahlen enthalten"),
    type: z.enum(["text", "number", "select", "multiselect", "brand"]),
    unit: z.string().optional().nullable(),
    options: z.array(z.string()).default([]),
    sortOrder: z.number().optional().default(0),
});

// GET /api/admin/categories/[id]/filters - List all filters for a category
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const filters = await prisma.categoryFilter.findMany({
            where: { categoryId: id },
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json(filters);
    } catch (error) {
        console.error("Error fetching filters:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

// POST /api/admin/categories/[id]/filters - Create new filter
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();

        const parseResult = FilterSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Validierungsfehler", details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Kategorie nicht gefunden" },
                { status: 404 }
            );
        }

        // Check if key already exists for this category
        const existing = await prisma.categoryFilter.findUnique({
            where: {
                categoryId_key: {
                    categoryId: id,
                    key: parseResult.data.key,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Ein Filter mit diesem Key existiert bereits in dieser Kategorie" },
                { status: 409 }
            );
        }

        const filter = await prisma.categoryFilter.create({
            data: {
                ...parseResult.data,
                categoryId: id,
            },
        });

        return NextResponse.json(filter, { status: 201 });
    } catch (error) {
        console.error("Error creating filter:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
