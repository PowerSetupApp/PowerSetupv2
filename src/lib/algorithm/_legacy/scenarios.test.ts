/**
 * End-to-End Szenario-Tests für drei realistische Camper-Setups.
 *
 * Ziel: sicherstellen, dass die Algorithmus-Empfehlungen nach den Bug-Fixes
 * plausible Zahlen produzieren (nicht „lächerlich hoch" oder „absurd niedrig")
 * und dass der komplette Trace/Mermaid-Flow vorhanden ist.
 *
 * Die Zahlenbereiche sind bewusst großzügig — hier geht es um Sanity, nicht um
 * exakte Werte. Falls ein Bereich verletzt wird, schlägt der Test fehl und
 * zwingt uns, den Algorithmus bewusst zu prüfen.
 */

import { describe, expect, it } from "vitest";

import { calculateRequirements } from "./calculate";
import { traceToMermaid } from "./mermaid";
import { createTrace } from "./trace";
import type { AlgorithmInput, Consumer } from "./types";
import { DEFAULT_ALGORITHM_INPUT, DEFAULT_CUSTOM_OVERRIDES } from "./types";

function build(overrides: Partial<AlgorithmInput>): AlgorithmInput {
  return {
    ...DEFAULT_ALGORITHM_INPUT,
    customOverrides: { ...DEFAULT_CUSTOM_OVERRIDES },
    ...overrides,
  };
}

const LIGHT_VAN_CONSUMERS: Consumer[] = [
  { id: "led", name: "LED-Beleuchtung", power: 15, daily: 4, voltage: 12 },
  { id: "fridge", name: "Kompressor-Kühlschrank", power: 55, daily: 24, voltage: 12, coolingMethod: "compressor" },
  { id: "phone", name: "Handy-Ladung", power: 10, daily: 2, voltage: 12 },
  { id: "water", name: "Wasserpumpe", power: 60, daily: 0.25, voltage: 12 },
];

const CAMPER_CONSUMERS: Consumer[] = [
  ...LIGHT_VAN_CONSUMERS,
  { id: "boiler", name: "Warmwasser-Boiler DC", power: 300, daily: 0.5, voltage: 12 },
  { id: "fan", name: "Dachlüfter", power: 25, daily: 8, voltage: 12 },
  { id: "laptop", name: "Laptop", power: 65, daily: 3, voltage: 230, averageLoadPercent: 60 },
];

const LARGE_RV_CONSUMERS: Consumer[] = [
  ...CAMPER_CONSUMERS,
  { id: "induction", name: "Induktionsherd", power: 3000, daily: 0.5, voltage: 230, averageLoadPercent: 33 },
  { id: "tv", name: "TV", power: 120, daily: 3, voltage: 230, averageLoadPercent: 70 },
  { id: "heater", name: "Dieselheizung (DC)", power: 35, daily: 6, voltage: 12 },
];

describe("E2E Szenarien · realistische Camper-Setups", () => {
  it("Kleiner Van – Sommer Deutschland – Solar only", () => {
    const input = build({
      systemVoltage: 12,
      batteryPreference: "lifepo4",
      energySources: ["solar"],
      roofModuleType: "rigid",
      roofAreas: [{ id: "r-1", name: "Dach", length: 400, width: 180 }], // 7.2 m²
      consumers: LIGHT_VAN_CONSUMERS,
      simultaneousLoad: "low",
      travelBehavior: {
        season: "summer",
        tripDuration: "extended",
        winterLocation: "germany",
        standingDuration: "short",
      },
      autarchyDays: 2,
    });
    const trace = createTrace();
    const result = calculateRequirements(input, trace);

    expect(result.battery.recommendedCapacityAh).toBeGreaterThanOrEqual(50);
    expect(result.battery.recommendedCapacityAh).toBeLessThanOrEqual(300);

    expect(result.solar.needed).toBe(true);
    expect(result.solar.totalAvailableWp).toBeGreaterThan(400);
    expect(result.solar.totalAvailableWp).toBeLessThan(2500);

    expect(result.controller.needed).toBe(true);
    expect(result.controller.currentA).toBeGreaterThanOrEqual(20);
    expect(result.controller.currentA).toBeLessThanOrEqual(150);

    expect(trace.steps.length).toBeGreaterThan(5);
    expect(trace.constants.length).toBeGreaterThan(5);
    const mermaid = traceToMermaid(trace);
    expect(mermaid).toContain("flowchart TD");
    expect(mermaid).toContain("energy");
    expect(mermaid).toContain("battery");
  });

  it("Camper – Winter Skandinavien – Solar + LiMa + Landstrom", () => {
    const input = build({
      systemVoltage: 12,
      vehicleVoltage: 12,
      batteryPreference: "lifepo4",
      energySources: ["solar", "alternator", "shore_power"],
      alternatorTier: "enhanced",
      chargerSpeed: "normal",
      roofModuleType: "flexible",
      roofAreas: [{ id: "r-1", name: "Dach", length: 500, width: 220 }],
      solarBags: [{ id: "bag-1", power: 200 }],
      consumers: CAMPER_CONSUMERS,
      simultaneousLoad: "moderate",
      travelBehavior: {
        season: "winter",
        tripDuration: "permanent",
        winterLocation: "scandinavia",
        standingDuration: "medium",
      },
      autarchyDays: 4,
    });
    const trace = createTrace();
    const result = calculateRequirements(input, trace);

    expect(result.battery.recommendedCapacityAh).toBeGreaterThan(100);
    expect(result.battery.recommendedCapacityAh).toBeLessThan(800);

    expect(result.booster.needed).toBe(true);
    expect(result.booster.outputCurrentA).toBeGreaterThan(40);
    expect(result.booster.dailyAlternatorChargeWh).toBeGreaterThan(0);

    expect(result.charger.needed).toBe(true);
    expect(result.charger.recommendedCurrentA).toBeGreaterThan(0);

    expect(result.controller.maxInputWp).toBe(result.solar.totalAvailableWp);
  });

  it("Großes Reisemobil – Ganzjahr – Hochlast mit Induktion", () => {
    const input = build({
      systemVoltage: 24,
      vehicleVoltage: 24,
      batteryPreference: "lifepo4",
      energySources: ["solar", "alternator", "shore_power"],
      alternatorTier: "enhanced",
      chargerSpeed: "normal",
      roofModuleType: "rigid",
      roofAreas: [{ id: "r-1", name: "Dach-1", length: 500, width: 200 }],
      consumers: LARGE_RV_CONSUMERS,
      simultaneousLoad: "high",
      travelBehavior: {
        season: "all_year",
        tripDuration: "permanent",
        winterLocation: "southern",
        standingDuration: "long",
      },
      autarchyDays: 3,
    });
    const trace = createTrace();
    const result = calculateRequirements(input, trace);

    expect(result.battery.recommendedCapacityAh).toBeGreaterThanOrEqual(50);
    expect(result.battery.recommendedCapacityAh).toBeLessThan(1000);

    expect(result.inverter.needed).toBe(true);
    expect(result.inverter.recommendedW).toBeGreaterThanOrEqual(2000);
    expect(result.inverter.recommendedW).toBeLessThanOrEqual(6000);

    const serviceToInverter = result.cables.find((c) => c.route === "service_to_inverter");
    expect(serviceToInverter).toBeDefined();
    expect(serviceToInverter?.recommendedCrossSection).toBeGreaterThanOrEqual(10);
  });
});
