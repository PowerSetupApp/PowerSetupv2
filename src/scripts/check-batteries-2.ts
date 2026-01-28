
import fs from 'fs';
import path from 'path';

// Load .env manually
try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key && !key.startsWith('//') && !key.startsWith('#')) {
                process.env[key] = value;
            }
        }
    });
} catch (e) { console.log("No .env found or error reading it"); }

async function main() {
    const { prisma } = await import('../lib/db');
    try {
        const batteries = await prisma.product.findMany({
            where: {
                category: {
                    slug: 'batterien'
                }
            },
            select: {
                id: true,
                name: true,
                specs: true,
                filterValues: true,
            }
        });

        // Check for 24V batteries
        const batteries24V = batteries.filter(b => {
            // Check filterValues
            const fv = b.filterValues as any;
            if (fv && (fv.voltageV == 24 || fv.voltage == 24)) return true;

            // Check specs
            try {
                const specs = typeof b.specs === 'string' ? JSON.parse(b.specs) : b.specs;
                if (specs && (specs.voltageV == 24 || specs.voltage == 24 || specs.systemVoltage == 24)) return true;
            } catch (e) { }

            return false;
        });

        console.log(`Found ${batteries24V.length} 24V batteries.`);
        batteries24V.forEach(b => {
            const fv = b.filterValues as any;
            console.log(`- [${b.id}] ${b.name}`);
            console.log(`  Capacity: ${fv?.capacityAh || '?'}Ah, Voltage: ${fv?.voltageV || '?'}V`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
