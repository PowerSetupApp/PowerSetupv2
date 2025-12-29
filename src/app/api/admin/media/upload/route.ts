import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name;
        // Split name and extension
        const lastDotIndex = originalName.lastIndexOf(".");
        const namePart = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
        const extension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex + 1).toLowerCase() : "bin";

        // Sanitize name for SEO: lowercase, replace spaces/specials with dashes, alphanumeric only
        const sanitizedName = namePart
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with dashes
            .replace(/^-+|-+$/g, ""); // Trim dashes from start/end

        // Add short random suffix for uniqueness
        const uniqueSuffix = crypto.randomUUID().split("-")[0];
        const filename = `${sanitizedName || "upload"}-${uniqueSuffix}.${extension}`;

        // Ensure uploads directory exists
        const uploadDir = join(process.cwd(), "public/uploads");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const url = `/uploads/${filename}`;

        return NextResponse.json({
            url,
            name: originalName,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Fehler beim Hochladen" },
            { status: 500 }
        );
    }
}
