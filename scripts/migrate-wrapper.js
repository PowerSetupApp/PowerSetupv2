
require('dotenv').config();
const { execSync } = require('child_process');

console.log("Debug: Checking DATABASE_URL...");
if (process.env.DATABASE_URL) {
    console.log(`DATABASE_URL found, length: ${process.env.DATABASE_URL.length}`);
} else {
    console.error("DATABASE_URL is MISSING from process.env!");
    // Try loading from .env.local
    require('dotenv').config({ path: '.env.local' });
    if (process.env.DATABASE_URL) {
        console.log(`DATABASE_URL found in .env.local, length: ${process.env.DATABASE_URL.length}`);
    }
}

try {
    // Use shell checking
    execSync('npx prisma migrate dev --name add_system_settings', { stdio: 'inherit', env: process.env });
} catch (error) {
    console.error("Migration failed");
    process.exit(1);
}
