import type {
  AlgorithmInput,
  BoosterRecommendation,
  CableRecommendation,
  ChargerRecommendation,
  ControllerRecommendation,
  InverterRecommendation,
} from "../types";
import {
  COPPER_CONDUCTIVITY,
  STANDARD_CABLE_SIZES,
  VOLTAGE_DROP_CRITICAL,
  VOLTAGE_DROP_NORMAL,
  VOLTAGE_DROP_SOLAR,
} from "../constants";
import type { AlgorithmTrace } from "../trace";
import { pushStep } from "../trace";
import {
  getMinCrossSectionForAmpacity,
  getSimultaneousFactor,
  roundUpToStandard,
} from "./1-energy-demand";
import { getSetting } from "./settings";

/**
 * Kabel-Klasse steuert den zulässigen Spannungsabfall:
 * - `critical` ≈ 2 % (Wechselrichter / Ladebooster / Ladegerät)
 * - `normal`   ≈ 3 % (Standard-Verbraucher, Sicherungskasten)
 * - `solar`    ≈ 3 % (PV-Strang — admin-seitig separat konfigurierbar)
 */
export type CableClass = "critical" | "normal" | "solar";

export function calculateCableCrossSection(
  lengthM: number,
  currentA: number,
  voltage: number,
  cableClass: CableClass,
  input?: AlgorithmInput,
  trace?: AlgorithmTrace,
): number {
  const dropCritical = input
    ? getSetting(input, "voltageDropCritical", VOLTAGE_DROP_CRITICAL, "cables", trace)
    : VOLTAGE_DROP_CRITICAL;
  const dropNormal = input
    ? getSetting(input, "voltageDropNormal", VOLTAGE_DROP_NORMAL, "cables", trace)
    : VOLTAGE_DROP_NORMAL;
  const dropSolar = input
    ? getSetting(input, "voltageDropSolar", VOLTAGE_DROP_SOLAR, "cables", trace)
    : VOLTAGE_DROP_SOLAR;
  const resistivity = input
    ? getSetting(input, "copperResistivity", 1 / COPPER_CONDUCTIVITY, "cables", trace)
    : 1 / COPPER_CONDUCTIVITY;

  const voltageDropPercent =
    cableClass === "critical" ? dropCritical : cableClass === "solar" ? dropSolar : dropNormal;
  const allowedVoltageDrop = voltage * voltageDropPercent;
  return (2 * lengthM * currentA * resistivity) / allowedVoltageDrop;
}

/**
 * Summiert die tatsächlich erwartete DC-Last (Verbraucher am System-Voltage-Rail)
 * mit dem konfigurierten Gleichzeitigkeits-Faktor auf.
 *
 * Ersetzt die alte Konstante `fuseBoxCurrentA = 30` — siehe Fix 7: bei
 * großen DC-Lasten (z. B. 12-V-Kühlschrank + Wasserboiler + Ventilator) war
 * 30 A dramatisch unterdimensioniert.
 */
function calculateFuseBoxDcLoad(input: AlgorithmInput, trace?: AlgorithmTrace): number {
  const dc = input.consumers.filter((c) => c.voltage !== 230 && c.power > 0);
  if (dc.length === 0) return 0;
  const totalW = dc.reduce((sum, c) => sum + c.power, 0);
  const maxW = Math.max(...dc.map((c) => c.power));
  const simFactor = getSimultaneousFactor(input.simultaneousLoad, input, trace);
  // Gleiche Peak-Logik wie beim Inverter: stärkster Verbraucher volle Leistung,
  // der Rest mit Gleichzeitigkeitsfaktor gewichtet.
  const peakW = maxW + (totalW - maxW) * simFactor;
  return peakW / input.systemVoltage;
}

export function calculateCables(
  input: AlgorithmInput,
  booster: BoosterRecommendation,
  charger: ChargerRecommendation,
  inverter: InverterRecommendation,
  controller: ControllerRecommendation,
  trace?: AlgorithmTrace,
): CableRecommendation[] {
  const cables: CableRecommendation[] = [];

  const cableStandards = input.componentClasses?.cable ?? STANDARD_CABLE_SIZES;

  const addCable = (
    route: string,
    displayName: string,
    lengthM: number,
    currentA: number,
    voltage: number,
    cableClass: CableClass,
  ) => {
    if (currentA <= 0 || lengthM <= 0) return;
    const minCrossSection = calculateCableCrossSection(
      lengthM,
      currentA,
      voltage,
      cableClass,
      input,
      trace,
    );
    const recommendedCrossSection = roundUpToStandard(minCrossSection, cableStandards);
    cables.push({
      route,
      displayName,
      lengthM,
      currentA,
      voltage,
      minCrossSection: Math.round(minCrossSection * 100) / 100,
      recommendedCrossSection: Math.max(recommendedCrossSection, getMinCrossSectionForAmpacity(currentA)),
      isCritical: cableClass === "critical",
    });
  };

  if (booster.needed) {
    addCable(
      "starter_to_booster",
      "Starterbatterie → Ladebooster",
      input.cableLengths.starterToService,
      booster.inputCurrentA,
      input.vehicleVoltage,
      "critical",
    );
    addCable(
      "booster_to_service",
      "Ladebooster → Versorgerbatterie",
      input.cableLengths.boosterToService,
      booster.outputCurrentA,
      input.systemVoltage,
      "critical",
    );
  }

  if (inverter.needed) {
    const inverterCurrentA = inverter.recommendedW / input.systemVoltage;
    addCable(
      "service_to_inverter",
      "Versorgerbatterie → Wechselrichter",
      input.cableLengths.serviceToInverter,
      inverterCurrentA,
      input.systemVoltage,
      "critical",
    );
  }

  if (charger.needed) {
    addCable(
      "charger_to_service",
      "Batterieladegerät → Versorgerbatterie",
      input.cableLengths.chargerToService,
      charger.recommendedCurrentA,
      input.systemVoltage,
      "critical",
    );
  }

  if (controller.needed) {
    addCable(
      "solar_to_regulator",
      "Solarmodule → Laderegler",
      input.cableLengths.solarToRegulator,
      controller.currentA,
      input.systemVoltage,
      "solar",
    );
    addCable(
      "regulator_to_service",
      "Laderegler → Versorgerbatterie",
      input.cableLengths.regulatorToService,
      controller.currentA,
      input.systemVoltage,
      "solar",
    );
  }

  const fuseBoxCurrentA = Math.max(10, calculateFuseBoxDcLoad(input, trace));
  addCable(
    "battery_to_fuse_box",
    "Batterie → Sicherungskasten",
    input.cableLengths.batteryToFuseBox,
    fuseBoxCurrentA,
    input.systemVoltage,
    "normal",
  );

  pushStep(trace, {
    phase: "cables",
    id: "cables.fuseBoxCurrentA",
    label: "Sicherungskasten-Strom",
    value: Math.round(fuseBoxCurrentA * 10) / 10,
    unit: "A",
    kind: "output",
    formula: `(maxDc + (ΣDc − maxDc) × simFactor) / ${input.systemVoltage} V, mind. 10 A`,
  });
  pushStep(trace, {
    phase: "cables",
    id: "cables.count",
    label: "Kabel-Empfehlungen",
    value: cables.length,
    unit: "Stk",
    kind: "output",
  });

  return cables;
}
