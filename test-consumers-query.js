
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const categories = await prisma.consumerCategory.findMany({
            include: {
                devices: {
                    where: { isActive: true },
                    orderBy: { sortOrder: "asc" },
                },
            },
            orderBy: {
                sortOrder: "asc",
            },
        });
        console.log("Successfully fetched categories:", categories.length);
        console.log("First category:", categories[0]?.name);
    } catch (e) {
        console.error("Error fetching consumers:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
