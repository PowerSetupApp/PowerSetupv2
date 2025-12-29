
import dotenv from "dotenv";
import { generateSolarPlan, AIInput } from "../src/lib/ai";
import { BatteryType, SolarPanelType } from "../src/lib/schemas/products";

dotenv.config({ path: ".env.local" });
// fallback to .env if .env.local doesn't exist
dotenv.config();

const mockInput: AIInput = {
    vehicleType: "Wohnmobil",
    voltage: 12,
    energySources: ["solar", "battery"],
    consumers: [
        { name: "LED Licht", power: 20, hoursPerDay: 4 },
        { name: "Kühlschrank", power: 45, hoursPerDay: 24 },
        { name: "Laptop", power: 65, hoursPerDay: 4 },
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
                type: "LiFePO4" as BatteryType,
                voltage: 12,
                capacity: 100,
                maxChargeCurrent: 50,
                maxDischargeCurrent: 100,
                cycleLife: 3000,
                weight: 12,
                dimensions: { l: 300, b: 170, h: 220 },
                bmsIncluded: true,
            },
        },
        {
            id: "solar-1",
            name: "Solarpanel 100W",
            category: "solar_panel",
            price: 150,
            specs: {
                type: "mono" as SolarPanelType,
                power: 100,
                vmp: 18,
                imp: 5.5,
                voc: 22,
                isc: 6,
                dimensions: { l: 1000, b: 500, h: 35 },
                flexible: false,
            },
        },
        {
            id: "solar-2",
            name: "Solarpanel 200W",
            category: "solar_panel",
            price: 250,
            specs: {
                type: "mono" as SolarPanelType,
                power: 200,
                vmp: 18,
                imp: 11,
                voc: 22,
                isc: 12,
                dimensions: { l: 1500, b: 680, h: 35 },
                flexible: false,
            },
        },
        {
            id: "mppt-1",
            name: "MPPT 75/15",
            category: "charge_controller",
            price: 100,
            specs: {
                type: "MPPT",
                maxInputVoltage: 75,
                maxChargeCurrent: 15,
                maxPvPower: 220,
                batteryVoltages: [12, 24],
                batteryTypes: ["LiFePO4" as BatteryType, "AGM" as BatteryType],
            },
        },
    ],
};

async function run() {
    console.log("Starting AI Generation Test...");
    try {
        const result = await generateSolarPlan(mockInput);
        console.log("AI Generation Successful!");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("AI Generation Failed:", error);
    }
}

run();
