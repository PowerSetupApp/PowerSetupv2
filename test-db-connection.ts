
import 'dotenv/config';
import { prisma } from "./src/lib/db";

async function main() {
    try {
        console.log("Attempting to connect to database...");
        const categories = await prisma.consumerCategory.findMany();
        console.log("Successfully connected!");
        console.log(`Found ${categories.length} categories.`);
        console.log("Categories:", JSON.stringify(categories, null, 2));
    } catch (error) {
        console.error("Connection failed:", JSON.stringify(error, null, 2));
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
