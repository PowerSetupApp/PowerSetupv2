
import { PrismaClient } from '@prisma/client';

const REMOTE_URL = "postgres://88ad45100977a0dcf669576767457afb60564e88652f53f8a38c028dba5e1e03:sk_dmfWm-MU22Ui9I_y3Ws_k@db.prisma.io:5432/postgres?sslmode=require";

// Use datasources override to connect to remote
const remote = new PrismaClient({
    datasources: {
        db: {
            url: REMOTE_URL,
        },
    },
});

// Default local connection
const local = new PrismaClient();

async function main() {
    console.log('Starting restoration from Remote DB...');

    try {
        // 1. Categories
        console.log('Fetching Categories...');
        const categories = await remote.category.findMany();
        console.log(`Found ${categories.length} categories. Restoring...`);
        for (const c of categories) {
            await local.category.upsert({
                where: { id: c.id },
                update: c,
                create: c,
            });
        }

        // 2. Brands
        console.log('Fetching Brands...');
        try {
            const brands = await remote.brand.findMany();
            console.log(`Found ${brands.length} brands. Restoring...`);
            for (const b of brands) {
                await local.brand.upsert({
                    where: { id: b.id },
                    update: b,
                    create: b,
                });
            }
        } catch (e) {
            console.warn('Could not restore brands (schema mismatch?):', e);
        }

        // 3. Products
        console.log('Fetching Products...');
        // We select specific fields to avoid issues if local schema has new fields not in remote
        // Wait, if local has new fields, they are optional/nullable usually?
        // If remote lacks fields that local expects in select *, it crashes.
        // We try full select first.
        try {
            const products = await remote.product.findMany();
            console.log(`Found ${products.length} products. Restoring...`);
            for (const p of products) {
                await local.product.upsert({
                    where: { id: p.id },
                    update: p,
                    create: p,
                });
            }
        } catch (e) {
            console.warn('Full product fetch failed. Trying limited fields...');
            // Fallback or just rethrow to trigger seed fallback
            throw e;
        }

        console.log('Restoration complete!');

    } catch (error) {
        console.error('Error during restoration:', error);
        process.exit(1);
    } finally {
        await remote.$disconnect();
        await local.$disconnect();
    }
}

main();
