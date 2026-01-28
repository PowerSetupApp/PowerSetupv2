process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import 'dotenv/config';
import { prisma } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('📦 Starting database backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const backupPath = path.join(process.cwd(), filename);

    const backupData: Record<string, any> = {};

    // List of all models to backup
    // These keys must match the Prisma Client model property names (usually lowercase/camelCase)
    const models = [
        'result',
        'product',
        'category',
        'categoryFilter',
        'creditPurchase',
        'creditBalance',
        'creditUsage',
        'promptVersion',
        'consumerCategory',
        'consumerDevice',
        'systemSetting',
        'modelPricing',
        'algorithmSettings',
        'brand',
        'brandFilterCategory'
    ];

    try {
        for (const model of models) {
            console.log(`Scanning table: ${model}...`);
            // @ts-ignore - Dynamic access to prisma models
            if (prisma[model]) {
                // @ts-ignore
                const data = await prisma[model].findMany();
                backupData[model] = data;
                console.log(`  ✓ Found ${data.length} records`);
            } else {
                console.warn(`  ⚠️ Model ${model} not found on Prisma Client instance`);
            }
        }

        console.log(`Writing backup to ${filename}...`);
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

        console.log('✅ Backup completed successfully!');
        console.log(`📁 Saved to: ${backupPath}`);

    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
