
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CategoryUpdateSchema = z.object({
    name: z.string().min(1, "Name ist erforderlich").optional(),
    slug: z.string().min(1, "Slug ist erforderlich").regex(/^[a-z0-9-]+$/, "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten").optional(),
    icon: z.string().optional(),
    sortOrder: z.number().optional(),
});

// GET /api/admin/categories/[id]
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
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
        console.error("Error fetching category:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

// PUT /api/admin/categories/[id]
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        const parseResult = CategoryUpdateSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Validierungsfehler", details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        // Check if slug is taken by another category (if slug is being updated)
        if (parseResult.data.slug) {
            const existing = await prisma.category.findUnique({
                where: { slug: parseResult.data.slug },
            });

            if (existing && existing.id !== id) {
                return NextResponse.json(
                    { error: "Eine Kategorie mit diesem Slug existiert bereits" },
                    { status: 409 }
                );
            }
        }

        const category = await prisma.category.update({
            where: { id },
            data: parseResult.data,
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error updating category:", error);
        // Check for prisma not found error
        if ((error as any).code === 'P2025') {
            return NextResponse.json(
                { error: "Kategorie nicht gefunden" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/categories/[id]
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        await prisma.category.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting category:", error);
        if ((error as any).code === 'P2025') {
            return NextResponse.json(
                { error: "Kategorie nicht gefunden" },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
