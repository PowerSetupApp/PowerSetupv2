
import { AIInput } from "@/lib/ai";

export interface SystemRequirements {
    totalDailyWh: number;
    requiredBatteryCapacityAh: number;
    recommendedSolarWp: number;
    requiredInverterPowerW: number;
    requiredBoosterA: number;
    requiredChargerA: number;
}

/**
 * Calculates the required system parameters based on user input.
 * This replaces the "calculations" part previously hallucinated by the LLM.
 */
export function calculateSystemRequirements(input: AIInput): SystemRequirements {
    // 1. Calculate Total Daily Consumption (Wh)
    const totalDailyWh = input.consumers.reduce((sum, c) => {
        return sum + (c.power * c.hoursPerDay);
    }, 0);

    // 2. Calculate Required Battery Capacity (Ah)
    // Formula: (DailyWh * AutarkyDays) / (Voltage * DOD)
    // DOD (Depth of Discharge): LiFePO4 ~90%, AGM/Gel ~50%
    let dod = 0.5; // Default (Lead/AGM/Gel)
    if (input.batteryType.toLowerCase().includes("lifepo4") || input.batteryType.toLowerCase().includes("lithium")) {
        dod = 0.9;
    } else if (input.batteryType === "any") {
        dod = 0.8; // Optimistic average if undecided
    }

    const rawBatteryCapacity = (totalDailyWh * input.autarkyDays) / (input.voltage * dod);
    // Add 10% safety margin and round up
    const requiredBatteryCapacityAh = Math.ceil(rawBatteryCapacity * 1.1);

    // 3. Calculate Recommended Solar Power (Wp)
    // Target: Re-fill the daily consumption in an average day.
    // Assumption (Central Europe): Average 4 Peak Sun Hours (PSH) in season.
    // Efficiency loss factor: 0.75 (Heat, cabling, etc.)
    // Formula: DailyWh / (PSH * Efficiency)
    // If autarky is high, we might want to over-dimension.
    const peakSunHours = 4;
    const efficiency = 0.75;

    let requiredSolarWp = totalDailyWh / (peakSunHours * efficiency);

    // Adjust for season
    if (input.travelBehavior.season !== "summer_only") {
        // Winter/Off-season needs significantly more solar to gather same energy
        requiredSolarWp *= 1.5;
    }

    // Round to nearest 10
    const recommendedSolarWp = Math.ceil(requiredSolarWp / 10) * 10;

    // 4. Inverter Power
    // Sum of all 230V consumers (assuming they run simultaneously for worst case, or apply diversity factor)
    // For now: Max power of largest single consumer + 20% OR Sum if we had simultaneous flag.
    // Heuristic: Sum of all consumers that act like high-power devices if no explicit voltage is given, 
    // but in our input we don't strictly have voltage per consumer in AIInput yet (it's flattened).
    // Let's assume input.consumers represents ALL consumers. 
    // We'll take the MAX single power draw and multiply by 1.2 buffer, or sum if small.
    // Better heuristic: Sum of all power * 0.7 (diversity) but min largest device.
    const maxConsumerPower = Math.max(...input.consumers.map(c => c.power), 0);
    const totalConnectedLoad = input.consumers.reduce((sum, c) => sum + c.power, 0);

    // Simple sizing: 
    const requiredInverterPowerW = Math.max(maxConsumerPower * 1.2, totalConnectedLoad * 0.6);

    // 5. Charger / Booster Sizing (Rough heuristics)
    // 10-20% of battery capacity is healthy charging current
    const requiredChargerA = Math.ceil(requiredBatteryCapacityAh * 0.15);
    const requiredBoosterA = Math.ceil(requiredBatteryCapacityAh * 0.2); // Faster charging while driving

    return {
        totalDailyWh: Math.ceil(totalDailyWh),
        requiredBatteryCapacityAh,
        recommendedSolarWp,
        requiredInverterPowerW: Math.ceil(requiredInverterPowerW),
        requiredBoosterA,
        requiredChargerA
    };
}
