
// Mock types
interface Consumer {
    id: string;
    category: string;
    name: string;
    power: number;
    voltage: 12 | 24 | 48 | 230;
    usageHoursPerDay: number;
    isFixed?: boolean;
    coolingMethod?: 'compressor' | 'absorber';
    usesGas?: boolean;
    electricPercentage?: number;
}

const mockSettings = {
    dutyCycleCompressor: 0.3,
    dutyCycleAbsorber: 1.0,
};

function calculateDailyWh(consumers: Consumer[], settings: any): number {
    return consumers.reduce((sum, c) => {
        // Cooling devices have duty cycle
        // FALLBACK: Check name if coolingMethod is missing but name implies cooling
        const isLikelyCooling = !c.coolingMethod &&
            (c.name.toLowerCase().includes('kühl') || c.name.toLowerCase().includes('cool') || c.name.toLowerCase().includes('fridge'));

        const effectiveCoolingMethod = c.coolingMethod || (isLikelyCooling ? 'compressor' : undefined);

        if (effectiveCoolingMethod) {
            const dutyCycle = effectiveCoolingMethod === 'compressor'
                ? settings.dutyCycleCompressor
                : settings.dutyCycleAbsorber;

            // For absorber with gas: only count the electric portion
            // c.coolingMethod might be undefined here if we used fallback!
            const electricFactor = (effectiveCoolingMethod === 'absorber' && c.usesGas && c.electricPercentage !== undefined)
                ? c.electricPercentage / 100
                : 1.0;

            console.log(`[Calc] ${c.name}: Method=${effectiveCoolingMethod} Gas=${c.usesGas} Elec=${c.electricPercentage} -> Factor=${electricFactor}, Duty=${dutyCycle}`);

            return sum + (c.power * 24 * dutyCycle * electricFactor);
        }
        return sum + (c.power * c.usageHoursPerDay);
    }, 0);
}

const consumers: Consumer[] = [
    {
        "id": "5efbadd3",
        "category": "light",
        "name": "LED Beleuchtung",
        "power": 20,
        "voltage": 12,
        "usageHoursPerDay": 4
    },
    {
        "id": "d70f810f",
        "category": "kitchen",
        "name": "Kühlbox/-schrank",
        "power": 50,
        "voltage": 12,
        "usageHoursPerDay": 24,
        "coolingMethod": "absorber",
        "usesGas": true,
        "electricPercentage": 90
    },
    {
        "id": "dc6f0e04",
        "category": "kitchen",
        "name": "Kaffeemaschine",
        "power": 1200,
        "voltage": 230,
        "usageHoursPerDay": 0.3
    },
    {
        "id": "induction",
        "category": "kitchen",
        "name": "Induktionskochplatte",
        "power": 2000,
        "voltage": 230,
        "usageHoursPerDay": 0.5
    }
];

console.log("--- TEST RUN 1: 90% Electric ---");
const wh1 = calculateDailyWh(consumers as any, mockSettings);
console.log("Daily Wh:", wh1);

// Change to 10%
consumers[1].electricPercentage = 10;
console.log("\n--- TEST RUN 2: 10% Electric ---");
const wh2 = calculateDailyWh(consumers as any, mockSettings);
console.log("Daily Wh:", wh2);
