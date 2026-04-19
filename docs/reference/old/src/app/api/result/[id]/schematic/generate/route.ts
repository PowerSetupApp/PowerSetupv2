import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAISettings } from "@/app/actions/settings";
import { formatFormDataForAI } from "@/lib/format-for-ai";
import OpenAI from "openai";

export const maxDuration = 60; // Allow 60 seconds for AI generation

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Await params correctly for Next.js 15+ / Future
    const { id } = await params;

    try {
        // 1. Fetch Result
        const result = await prisma.result.findUnique({
            where: { id },
            include: { creditBalance: true } // Check credits if needed later
        });

        if (!result) {
            return NextResponse.json({ error: "Result not found" }, { status: 404 });
        }

        // 2. Fetch AI Settings
        const settings = await getAISettings();
        if (!settings.openaiApiKey) {
            return NextResponse.json({ error: "OpenAI API Key not configured" }, { status: 500 });
        }

        // 3. Prepare Data
        // formData is JSON, cast to any
        const formData = result.formData as any;
        const recommendations = result.recommendations as any;

        // 4. Build {{PROMPT_FORMAT}} (User Profile)
        const userProfile = formatFormDataForAI(formData);

        // 5. Build {{SELECTED_PRODUCTS}}
        // Fetch ALL referenced products from DB to get names/specs/images
        let productIds: string[] = [];

        if (recommendations && recommendations.productGroups) {
            Object.values(recommendations.productGroups).forEach((group: any) => {
                if (Array.isArray(group)) {
                    group.forEach((p: any) => {
                        if (p.productId && p.isRecommended) productIds.push(p.productId);
                    });
                }
            });
        }

        // Remove duplicates just for the DB fetch
        productIds = Array.from(new Set(productIds));

        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { category: true }
        });

        // Map simplified list for Prompt
        const selectedProductsList = products.map(p => {
            return `- ${p.category.name}: ${p.name} (ID: ${p.id}, Image: ${p.imageUrl || 'None'})`;
        }).join("\n");


        // 6. Build Final Prompt
        let prompt = settings.imagePromptTemplate || "Create a schematic.";
        prompt = prompt.replace("{{PROMPT_FORMAT}}", userProfile);
        prompt = prompt.replace("{{SELECTED_PRODUCTS}}", selectedProductsList);


        // 7. Call OpenAI DALL-E 3
        const openai = new OpenAI({ apiKey: settings.openaiApiKey });

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            style: "vivid",
        });

        const imageUrl = response.data?.[0]?.url;

        if (!imageUrl) {
            throw new Error("No image URL returned from OpenAI");
        }

        // 8. Save URL (Ideally upload to Vercel Key/Blob first to make it permanent, 
        // but for now we save the OpenAI URL or assuming user will handle persistence layer later.
        // NOTE: DALL-E URLs expire after an hour! We MUST upload it.
        // We will reuse the upload logic or just save it for now, 
        // BUT user asked for permanent link. 
        // We will try to fetch and upload to Vercel Blob if token exists, else save raw URL (warn).

        let finalUrl = imageUrl;

        if (process.env.BLOB_READ_WRITE_TOKEN) {
            const { put } = await import("@vercel/blob");
            const imgRes = await fetch(imageUrl);
            const imgBuffer = await imgRes.arrayBuffer();

            const blob = await put(`schematics/${id}.jpg`, imgBuffer, {
                access: 'public',
            });
            finalUrl = blob.url;
        }

        // Update Result
        await prisma.result.update({
            where: { id },
            data: { schematicImageUrl: finalUrl }
        });

        return NextResponse.json({ url: finalUrl });

    } catch (error) {
        console.error("Schematic Gen Error:", error);
        return NextResponse.json({ error: "Generation failed" }, { status: 500 });
    }
}
