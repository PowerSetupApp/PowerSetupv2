import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Zod schema for product creation/update
const ProductSchema = z.object({
    name: z.string().min(1, "Name ist erforderlich"),
    description: z.string().optional(),
    icon: z.string().optional(),
    imageUrl: z.string().optional(),
    affiliateUrl: z.string().url("Ungültige URL"),
    price: z.number().optional(),
    categoryId: z.string().uuid("Ungültige Kategorie-ID"),
    specs: z.string().optional(),
    isActive: z.boolean().optional(),
    // Filter fields
    powerW: z.number().nullable().optional(),
    capacityAh: z.number().nullable().optional(),
    voltageV: z.number().nullable().optional(),
    batteryType: z.string().nullable().optional(),
    currentA: z.number().nullable().optional(),
    crossSectionMm2: z.number().nullable().optional(),
    solarWp: z.number().nullable().optional(),
    supportedVoltages: z.array(z.number()).nullable().optional(),
    maxDischargeA: z.number().nullable().optional(),
    waveform: z.string().nullable().optional(),
    fuseType: z.string().nullable().optional(),
    asin: z.string().nullable().optional(),
});

// GET /api/admin/products - List all products
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const where = categoryId ? { categoryId } : {};

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    category: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const parseResult = ProductSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Validierungsfehler", details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        const product = await prisma.product.create({
            data: {
                name: parseResult.data.name,
                description: parseResult.data.description,
                icon: parseResult.data.icon,
                imageUrl: parseResult.data.imageUrl,
                affiliateUrl: parseResult.data.affiliateUrl,
                price: parseResult.data.price,
                categoryId: parseResult.data.categoryId,
                specs: parseResult.data.specs || "",
                // Filter fields
                powerW: parseResult.data.powerW ?? null,
                capacityAh: parseResult.data.capacityAh ?? null,
                voltageV: parseResult.data.voltageV ?? null,
                batteryType: parseResult.data.batteryType ?? null,
                currentA: parseResult.data.currentA ?? null,
                crossSectionMm2: parseResult.data.crossSectionMm2 ?? null,
                solarWp: parseResult.data.solarWp ?? null,
                supportedVoltages: (parseResult.data.supportedVoltages ?? null) as any,
                maxDischargeA: parseResult.data.maxDischargeA ?? null,
                waveform: parseResult.data.waveform ?? null,
                fuseType: parseResult.data.fuseType ?? null,
                asin: parseResult.data.asin ?? null,
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
