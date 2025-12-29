
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Manually parse .env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = { ...process.env };

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        // Remove quotes if present
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[key] = value;
    }
});

console.log("DATABASE_URL present:", !!env.DATABASE_URL);

// 2. Run Prisma
try {
    execSync('npx prisma migrate dev --name add_system_settings', {
        stdio: 'inherit',
        env: env
    });
} catch (e) {
    process.exit(1);
}
