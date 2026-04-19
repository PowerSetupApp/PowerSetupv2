
import 'dotenv/config';
import { prisma } from './src/lib/db';

async function main() {
    const allSettings = await prisma.systemSetting.findMany();
    console.log('All System Settings:');
    allSettings.forEach(s => {
        // Obfuscate values that look like keys
        const val = s.value.length > 10 ? s.value.substring(0, 10) + '...' : s.value;
        console.log(`- Key: "${s.key}", Value: "${val}"`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
