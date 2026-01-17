
import 'dotenv/config';
import { prisma } from './src/lib/db';

async function main() {
    const openaiKey = await prisma.systemSetting.findUnique({
        where: { key: 'openai_api_key' },
    });
    console.log('OpenAI Key in DB:', openaiKey ? (openaiKey.value ? 'Present (Starts with ' + openaiKey.value.substring(0, 5) + ')' : 'Empty String') : 'Not Found');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
