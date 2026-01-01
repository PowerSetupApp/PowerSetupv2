
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("--- DEBUGGING CHARGERS ---");

    // 1. Fetch ALL products with 'charger' in category slug
    const allChargers = await prisma.product.findMany({
        where: {
            category: {
                slug: { contains: "charger" }
            }
        },
        select: {
            name: true,
            currentA: true,
            category: {
                select: {
                    name: true,
                    slug: true
                }
            }
        }
    });

    console.log("Found " + allChargers.length + " products with 'charger' in category slug:");
    allChargers.forEach(p => {
        console.log(`- [${p.category.slug}] ${p.name}: ${p.currentA}A`);
    });

    console.log("\n--- TESTING FILTER ---");
    // 2. Test the specific filter I implemented
    const filteredChargers = await prisma.product.findMany({
        where: {
            isActive: true,
            category: {
                slug: { contains: "charger" },
                NOT: [
                    { slug: { contains: "solar" } },
                    { slug: { contains: "mppt" } },
                    { slug: { contains: "pv" } }
                ]
            },
            currentA: { not: null }
        },
        select: {
            name: true,
            currentA: true
        }
    });

    console.log("Filtered results (what the sync uses):");
    filteredChargers.forEach(p => {
        console.log(`- ${p.name}: ${p.currentA}A`);
    });

    const distinctAmps = [...new Set(filteredChargers.map(p => p.currentA))].sort((a, b) => (a || 0) - (b || 0));
    console.log("Distinct Amps: ", distinctAmps.join(","));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
