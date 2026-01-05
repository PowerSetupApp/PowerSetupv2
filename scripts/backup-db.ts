
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Not Loaded');

// @ts-ignore
const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backup');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    console.log('Starting backup...');

    try {
        const data = {
            Result: await prisma.result.findMany(),
            Product: await prisma.product.findMany(),
            Category: await prisma.category.findMany(),
            CreditPurchase: await prisma.creditPurchase.findMany(),
            CreditBalance: await prisma.creditBalance.findMany(),
            CreditUsage: await prisma.creditUsage.findMany(),
            PromptVersion: await prisma.promptVersion.findMany(),
            ConsumerCategory: await prisma.consumerCategory.findMany(),
            ConsumerDevice: await prisma.consumerDevice.findMany(),
            SystemSetting: await prisma.systemSetting.findMany(),
            ModelPricing: await prisma.modelPricing.findMany(),
            AlgorithmSettings: await prisma.algorithmSettings.findMany(),
            Brand: await prisma.brand.findMany(),
            BrandFilterCategory: await prisma.brandFilterCategory.findMany(),
        };

        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));

        console.log(`Backup completed successfully: ${backupFile}`);
    } catch (err: any) {
        console.error('Error during backup:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        throw err;
    }
}

backup()
    .catch((e) => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
