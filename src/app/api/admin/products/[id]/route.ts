import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    imageUrl: z.string().optional(),
    affiliateUrl: z.string().url().optional(),
    price: z.number().nullable().optional(),
    categoryId: z.string().uuid().optional(),
    specs: z.string().nullable().optional(),
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
    // New Filter Fields
    brandId: z.string().nullable().optional(),
    filterValues: z.record(z.string(), z.any()).nullable().optional(),
});

// GET /api/admin/products/[id] - Get single product
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Produkt nicht gefunden" },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/products/[id] - Update product
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const parseResult = UpdateProductSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Validierungsfehler", details: parseResult.error.flatten() },
                { status: 400 }
            );
        }
        // Transform categoryId to Prisma relation syntax
        // Transform relational fields (categoryId, brandId) to Prisma relation syntax
        const { categoryId, brandId, ...restData } = parseResult.data;
        const updateData: any = { ...restData };

        if (categoryId) {
            updateData.category = { connect: { id: categoryId } };
        }

        if (brandId !== undefined) {
            if (brandId) {
                updateData.brand = { connect: { id: brandId } };
            } else {
                updateData.brand = { disconnect: true };
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
            include: { category: true },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        // Return actual error for debugging
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Interner Serverfehler", details: errorMessage },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/products/[id] - Soft delete (set isActive=false) -> Now HARD DELETE with Image Removal
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Fetch product to get image URL
        const product = await prisma.product.findUnique({
            where: { id },
            select: { imageUrl: true }
        });

        if (product?.imageUrl) {
            try {
                // Check if it's a Vercel Blob URL (simple check)
                if (product.imageUrl.includes('vercel-storage.com')) {
                    const { del } = await import("@vercel/blob");
                    await del(product.imageUrl);
                } else if (product.imageUrl.startsWith("/uploads/") || product.imageUrl.startsWith("/images/products/")) {
                    // Local file deletion
                    // Extract relative path and join with cwd public
                    const { unlink } = await import("fs/promises");
                    const { join } = await import("path");

                    // remove leading slash
                    const relativePath = product.imageUrl.startsWith("/") ? product.imageUrl.slice(1) : product.imageUrl;
                    const filepath = join(process.cwd(), "public", relativePath);

                    await unlink(filepath).catch(e => {
                        console.warn("Could not delete image file:", filepath, e);
                    });
                }
            } catch (err) {
                console.error("Error cleaning up image:", err);
            }
        }

        // 2. Delete product from DB
        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
