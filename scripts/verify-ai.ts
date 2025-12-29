
// scripts/verify-ai.ts
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// Note: We assume key is in env, otherwise we might fail.
// If .env is needed, we can try to read it manually or use dotenv

try {
    require("dotenv").config({ path: ".env.local" });
    require("dotenv").config(); // fallback
} catch (e) { console.log("dotenv skipped"); }

const { generateSolarPlan } = require("../src/lib/ai");
const { BatteryType, SolarPanelType } = require("../src/lib/schemas/products");

const mockInput = {
    vehicleType: "Wohnmobil",
    voltage: 12,
    energySources: ["solar", "battery"],
    consumers: [
        { name: "LED Licht", power: 20, hoursPerDay: 4 },
    ],
    autarkyDays: 2,
    comfortLevel: "standard",
    products: [
        {
            id: "batt-1",
            name: "LiFePO4 100Ah",
            category: "battery",
            price: 400,
            specs: {
                type: "LiFePO4",
                voltage: 12,
                capacity: 100,
                maxChargeCurrent: 50,
                maxDischargeCurrent: 100,
                cycleLife: 3000,
                weight: 12,
                dimensions: { l: 300, b: 170, h: 220 },
                bmsIncluded: true,
            },
        }
    ],
};

async function run() {
    console.log("Starting Verification...");
    if (!process.env.GEMINI_API_KEY) {
        console.error("SKIP: GEMINI_API_KEY not found in env.");
        return;
    }

    try {
        const result = await generateSolarPlan(mockInput);
        console.log("SUCCESS: Generated Plan");
        console.log("Selected:", result.selectedProducts.length, "products");
        console.log("Calculations:", JSON.stringify(result.calculations));
    } catch (error) {
        console.error("FAILED:", error);
        process.exit(1);
    }
}

run();
