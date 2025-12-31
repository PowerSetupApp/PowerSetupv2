
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    try {
        const promptContent = fs.readFileSync("prompt_update.md", "utf8");

        console.log("Updating SystemSetting...");
        await prisma.systemSetting.upsert({
            where: { key: "user_prompt_template" },
            update: { value: promptContent },
            create: {
                key: "user_prompt_template",
                value: promptContent
            }
        });

        console.log("Successfully updated prompt in database.");
    } catch (e) {
        console.error("Error updating prompt:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
