import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET() {
    try {
        console.log("Starting migration via API...");

        // Use the existing prisma instance from lib/db
        const products = await prisma.product.findMany({
            where: {
                imageUrl: {
                    startsWith: '/uploads/'
                }
            }
        });

        console.log(`Found ${products.length} products to migrate.`);
        const results = [];

        for (const product of products) {
            if (!product.imageUrl) continue;

            const filename = product.imageUrl.split('/').pop();
            const localPath = join(process.cwd(), 'public', product.imageUrl);

            if (!existsSync(localPath)) {
                results.push({ id: product.id, status: 'error', reason: 'File not found locally' });
                continue;
            }

            try {
                const fileBuffer = await readFile(localPath);
                const blob = await put(filename || 'image', fileBuffer, {
                    access: 'public',
                    addRandomSuffix: false
                });

                await prisma.product.update({
                    where: { id: product.id },
                    data: { imageUrl: blob.url }
                });

                results.push({ id: product.id, status: 'success', old: product.imageUrl, new: blob.url });
            } catch (error) {
                console.error(`Error migrating product ${product.id}:`, error);
                results.push({ id: product.id, status: 'error', reason: String(error) });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
