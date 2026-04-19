process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import 'dotenv/config';
import { prisma } from '../src/lib/db';

/**
 * Seed Category Filters
 * 
 * Run with: npx ts-node prisma/seed-category-filters.ts
 * Or add to main seed.ts
 */

interface FilterDef {
    name: string;
    key: string;
    type: "text" | "number" | "select" | "multiselect" | "brand";
    unit?: string;
    options?: string[];
}

const CATEGORY_FILTERS: Record<string, FilterDef[]> = {
    "wechselrichter": [
        { name: "Marke", key: "brand", type: "brand" },
        { name: "Ausgangsleistung (Dauerhaft)", key: "outputPowerW", type: "number", unit: "W" },
        { name: "Ausgangsleistung (Peak)", key: "peakPowerW", type: "number", unit: "W" },
        { name: "Eingangsspannung", key: "inputVoltage", type: "multiselect", unit: "V", options: ["12V", "24V", "48V"] },
    ],
    "batterien": [
        { name: "Marke", key: "brand", type: "brand" },
        { name: "Kapazität", key: "capacityAh", type: "number", unit: "Ah" },
        { name: "Spannung", key: "voltageV", type: "select", unit: "V", options: ["12V", "24V", "48V"] },
        { name: "Max. Entladestrom", key: "maxDischargeA", type: "number", unit: "A" },
        { name: "Max. Ladestrom", key: "maxChargeA", type: "number", unit: "A" },
        { name: "Batterie-Typ", key: "batteryType", type: "select", options: ["LiFePo4", "AGM", "GEL"] },
    ],
    "solartaschen": [
        { name: "Marke", key: "brand", type: "brand" },
        { name: "Spannung", key: "voltageV", type: "number", unit: "V" },
        { name: "Max. Leistung", key: "maxPowerWp", type: "number", unit: "Wp" },
    ],
    "solarmodule": [
        { name: "Marke", key: "brand", type: "brand" },
        { name: "Maße", key: "dimensions", type: "text" },
        { name: "Spannung", key: "voltageV", type: "number", unit: "V" },
        { name: "Max. Leistung", key: "maxPowerWp", type: "number", unit: "Wp" },
        { name: "Bauart", key: "constructionType", type: "select", options: ["Starr", "Flexibel"] },
    ],
    "kabel": [
        { name: "Marke", key: "brand", type: "brand" },
        { name: "Querschnitt", key: "crossSectionMm2", type: "number", unit: "mm²" },
        { name: "Kabel-Typ", key: "cableType", type: "select", options: ["Normal", "Solarkabel (Solarmodul > Solar-Laderegler)", "Batteriekabel (Solar-Laderegler > Batterie)"] },
        { name: "Farbe", key: "color", type: "select", options: ["Rot", "Schwarz"] },
    ],
    "batterieladegeraete": [
        { name: "Marke", key: "brand", type: "brand" },
        { name: "Max. Ladestrom", key: "maxChargeA", type: "number", unit: "A" },
        { name: "Ausgangsspannung", key: "outputVoltage", type: "multiselect", unit: "V", options: ["12V", "24V", "48V"] },
    ],
    "sicherungen": [
        { name: "Marke", key: "brand", type: "brand" },
        { name: "Auslöse-Art", key: "triggerType", type: "select", options: ["Thermisch", "Magnetisch"] },
        { name: "Max. Ampere", key: "maxAmpere", type: "number", unit: "A" },
        {
            name: "Typ", key: "fuseType", type: "select", options: [
                "Mini (ATM) – 5–30 A",
                "Standard (ATO/ATC) – 5–40 A",
                "Maxi (MAXI) – 20–120 A",
                "Midi Fuse (30–200 A)",
                "Mega Fuse (80–500 A)",
                "FI-Schutzschalter (RCD)",
                "Leitungsschutzschalter (LS)"
            ]
        },
    ],
    "sicherungskaesten": [
        { name: "Marke", key: "brand", type: "brand" },
        { name: "Anzahl Steckplätze", key: "slotCount", type: "number" },
        {
            name: "Fassung", key: "socketType", type: "select", options: [
                "Mini (ATM) – 5–30 A",
                "Standard (ATO/ATC) – 5–40 A",
                "Maxi (MAXI) – 20–120 A",
                "Midi Fuse (30–200 A)",
                "Mega Fuse (80–500 A)",
                "FI-Schutzschalter (RCD)",
                "Leitungsschutzschalter (LS)"
            ]
        },
    ],

    "ladebooster": [
        { name: "Marke", key: "brand", type: "brand" },
        { name: "Ladestrom", key: "maxChargeCurrent", type: "number", unit: "A" },
        { name: "Eingangsspannung", key: "inputVoltage", type: "multiselect", unit: "V", options: ["12V", "24V"] },
        { name: "Ausgangsspannung", key: "outputVoltage", type: "multiselect", unit: "V", options: ["12V", "24V"] },
    ],
};

async function seedCategoryFilters() {
    console.log("🌱 Seeding category filters...");

    for (const [slug, filters] of Object.entries(CATEGORY_FILTERS)) {
        // Find category by slug
        const category = await prisma.category.findUnique({
            where: { slug },
        });

        if (!category) {
            console.log(`  ⚠️ Category "${slug}" not found, skipping...`);
            continue;
        }

        console.log(`  📁 ${category.name} (${slug})`);

        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];

            // Upsert filter (update if exists, create if not)
            await prisma.categoryFilter.upsert({
                where: {
                    categoryId_key: {
                        categoryId: category.id,
                        key: filter.key,
                    },
                },
                update: {
                    name: filter.name,
                    type: filter.type,
                    unit: filter.unit || null,
                    options: filter.options || [],
                    sortOrder: i,
                },
                create: {
                    categoryId: category.id,
                    name: filter.name,
                    key: filter.key,
                    type: filter.type,
                    unit: filter.unit || null,
                    options: filter.options || [],
                    sortOrder: i,
                },
            });

            console.log(`    ✓ ${filter.name}`);
        }
    }

    console.log("✅ Category filters seeded successfully!");
}

// Run directly
seedCategoryFilters()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

export { seedCategoryFilters };
