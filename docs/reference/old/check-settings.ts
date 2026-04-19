
import { prisma } from "./src/lib/db";

async function main() {
    const settings = await prisma.algorithmSettings.findUnique({
        where: { id: "default" }
    });
    console.log("Current Settings in DB:");
    console.log(JSON.stringify(settings, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
