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
} from "../constants";
import { getMinCrossSectionForAmpacity, roundUpToStandard } from "./1-energy-demand";
import { getSetting } from "./settings";

export function calculateCableCrossSection(
  lengthM: number,
  currentA: number,
  voltage: number,
  isCritical: boolean,
  input?: AlgorithmInput,
): number {
  const dropCritical = input ? getSetting(input, "voltageDropCritical", VOLTAGE_DROP_CRITICAL) : VOLTAGE_DROP_CRITICAL;
  const dropNormal = input ? getSetting(input, "voltageDropNormal", VOLTAGE_DROP_NORMAL) : VOLTAGE_DROP_NORMAL;
  const conductivity = input ? getSetting(input, "copperConductivity", COPPER_CONDUCTIVITY) : COPPER_CONDUCTIVITY;

  const voltageDropPercent = isCritical ? dropCritical : dropNormal;
  const allowedVoltageDrop = voltage * voltageDropPercent;
  return (2 * lengthM * currentA) / (conductivity * allowedVoltageDrop);
}

export function calculateCables(
  input: AlgorithmInput,
  booster: BoosterRecommendation,
  charger: ChargerRecommendation,
  inverter: InverterRecommendation,
  controller: ControllerRecommendation,
): CableRecommendation[] {
  const cables: CableRecommendation[] = [];

  const addCable = (
    route: string,
    displayName: string,
    lengthM: number,
    currentA: number,
    voltage: number,
    isCritical: boolean,
  ) => {
    if (currentA <= 0 || lengthM <= 0) return;
    const minCrossSection = calculateCableCrossSection(lengthM, currentA, voltage, isCritical, input);
    const recommendedCrossSection = roundUpToStandard(minCrossSection, STANDARD_CABLE_SIZES);
    cables.push({
      route,
      displayName,
      lengthM,
      currentA,
      voltage,
      minCrossSection: Math.round(minCrossSection * 100) / 100,
      recommendedCrossSection: Math.max(recommendedCrossSection, getMinCrossSectionForAmpacity(currentA)),
      isCritical,
    });
  };

  if (booster.needed) {
    addCable(
      "starter_to_booster",
      "Starterbatterie → Ladebooster",
      input.cableLengths.starterToService,
      booster.inputCurrentA,
      input.vehicleVoltage,
      true,
    );
    addCable(
      "booster_to_service",
      "Ladebooster → Versorgerbatterie",
      input.cableLengths.boosterToService,
      booster.outputCurrentA,
      input.systemVoltage,
      true,
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
      true,
    );
  }

  if (charger.needed) {
    addCable(
      "charger_to_service",
      "Batterieladegerät → Versorgerbatterie",
      input.cableLengths.chargerToService,
      charger.recommendedCurrentA,
      input.systemVoltage,
      true,
    );
  }

  if (controller.needed) {
    addCable(
      "solar_to_regulator",
      "Solarmodule → Laderegler",
      input.cableLengths.solarToRegulator,
      controller.currentA,
      input.systemVoltage,
      false,
    );
    addCable(
      "regulator_to_service",
      "Laderegler → Versorgerbatterie",
      input.cableLengths.regulatorToService,
      controller.currentA,
      input.systemVoltage,
      false,
    );
  }

  const fuseBoxCurrentA = 30;
  addCable(
    "battery_to_fuse_box",
    "Batterie → Sicherungskasten",
    input.cableLengths.batteryToFuseBox,
    fuseBoxCurrentA,
    input.systemVoltage,
    false,
  );

  return cables;
}
