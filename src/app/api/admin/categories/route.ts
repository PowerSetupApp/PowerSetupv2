import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CategorySchema = z.object({
    name: z.string().min(1, "Name ist erforderlich"),
    slug: z.string().min(1, "Slug ist erforderlich").regex(/^[a-z0-9-]+$/, "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten"),
    icon: z.string().optional(),
    sortOrder: z.number().optional(),
});

// GET /api/admin/categories - List all categories
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

// POST /api/admin/categories - Create new category
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const parseResult = CategorySchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Validierungsfehler", details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existing = await prisma.category.findUnique({
            where: { slug: parseResult.data.slug },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Eine Kategorie mit diesem Slug existiert bereits" },
                { status: 409 }
            );
        }

        const category = await prisma.category.create({
            data: parseResult.data,
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
