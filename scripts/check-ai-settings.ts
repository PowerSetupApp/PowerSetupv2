
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSettings() {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['ai_provider', 'ai_model', 'gemini_api_key', 'openai_api_key'] }
            }
        });

        console.log("--- Current DB Settings ---");
        settings.forEach(s => {
            if (s.key.includes('key')) {
                console.log(`${s.key}: ${s.value ? s.value.substring(0, 8) + '...' : 'EMPTY'}`);
            } else {
                console.log(`${s.key}: ${s.value}`);
            }
        });

        if (settings.length === 0) {
            console.log("No AI settings found in DB.");
        }

    } catch (e) {
        console.error("Error checking settings:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSettings();
