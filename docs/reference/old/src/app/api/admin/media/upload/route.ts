import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Keine Datei hochgeladen" },
                { status: 400 }
            );
        }

        // Upload to Vercel Blob
        const blob = await put(file.name, file, {
            access: 'public',
            addRandomSuffix: true // Default is true, but explicit is good
        });

        return NextResponse.json({
            url: blob.url,
            name: file.name,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Fehler beim Hochladen" },
            { status: 500 }
        );
    }
}
