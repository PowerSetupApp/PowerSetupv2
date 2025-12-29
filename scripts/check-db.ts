
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Checking DB...");
    try {
        const count = await prisma.systemSetting.count();
        console.log("SystemSetting table exists. Row count:", count);
    } catch (e) {
        console.error("DB Error (Table missing?):", e.message);
        process.exit(1);
    }
}

run();
