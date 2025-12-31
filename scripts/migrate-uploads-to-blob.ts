import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Check env vars
if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL not found in environment.");
    process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Error: BLOB_READ_WRITE_TOKEN not found in environment.");
    process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
    console.log("Starting migration of product images to Vercel Blob...");

    try {
        const products = await prisma.product.findMany({
            where: {
                imageUrl: {
                    startsWith: '/uploads/'
                }
            }
        });

        console.log(`Found ${products.length} products with local images.`);

        let successCount = 0;
        let failCount = 0;

        for (const product of products) {
            if (!product.imageUrl) continue;

            // Clean filename
            const filename = product.imageUrl.split('/').pop();
            if (!filename) {
                console.warn(`Could not extract filename for product ${product.id}`);
                failCount++;
                continue;
            }

            const localPath = join(process.cwd(), 'public', product.imageUrl);

            if (!existsSync(localPath)) {
                console.warn(`File not found locally: ${localPath}`);
                failCount++;
                continue;
            }

            try {
                const fileBuffer = await readFile(localPath);

                console.log(`Uploading ${filename}...`);
                const blob = await put(filename, fileBuffer, {
                    access: 'public',
                    addRandomSuffix: false
                });

                await prisma.product.update({
                    where: { id: product.id },
                    data: { imageUrl: blob.url }
                });

                console.log(`✓ Migrated ${product.name} to ${blob.url}`);
                successCount++;
            } catch (error) {
                console.error(`Failed to migrate ${product.name}:`, error);
                failCount++;
            }
        }

        console.log(`Migration complete.`);
        console.log(`Successfully migrated: ${successCount}`);
        console.log(`Failed: ${failCount}`);

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
