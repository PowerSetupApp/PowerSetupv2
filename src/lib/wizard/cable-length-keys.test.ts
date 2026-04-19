import { describe, expect, it } from "vitest";

import type { AlgorithmInput } from "@/lib/algorithm/types";
import { DEFAULT_ALGORITHM_INPUT, DEFAULT_CABLE_LENGTHS } from "@/lib/algorithm/types";

import {
  areRequiredCableLengthsValid,
  getRequiredCableLengthKeys,
} from "./cable-length-keys";

const base = DEFAULT_ALGORITHM_INPUT;

describe("getRequiredCableLengthKeys", () => {
  it("always includes batteryToFuseBox", () => {
    const input = {
      ...base,
      energySources: ["alternator"] as const,
    } satisfies AlgorithmInput;
    expect(getRequiredCableLengthKeys(input)).toContain("batteryToFuseBox");
  });

  it("includes alternator legs only when alternator is selected", () => {
    const solarOnly = {
      ...base,
      energySources: ["solar"] as const,
      roofAreas: [{ id: "1", name: "Dach", length: 300, width: 200 }],
    } satisfies AlgorithmInput;
    expect(getRequiredCableLengthKeys(solarOnly)).not.toContain("starterToService");

    const withAlt = {
      ...solarOnly,
      energySources: ["solar", "alternator"] as const,
    } satisfies AlgorithmInput;
    expect(getRequiredCableLengthKeys(withAlt)).toEqual(
      expect.arrayContaining(["starterToService", "boosterToService"]),
    );
  });

  it("includes solar legs when solar is selected with at least one roof area", () => {
    const input = {
      ...base,
      energySources: ["solar"] as const,
      roofAreas: [{ id: "1", name: "Dach", length: 300, width: 200 }],
    } satisfies AlgorithmInput;
    expect(getRequiredCableLengthKeys(input)).toEqual(
      expect.arrayContaining(["solarToRegulator", "regulatorToService"]),
    );
  });

  it("includes solar legs when solar is selected with only a solar bag", () => {
    const input = {
      ...base,
      energySources: ["solar"] as const,
      roofAreas: [],
      solarBags: [{ id: "bag1", power: 200 }],
    } satisfies AlgorithmInput;
    expect(getRequiredCableLengthKeys(input)).toEqual(
      expect.arrayContaining(["solarToRegulator", "regulatorToService"]),
    );
  });

  it("omits solar legs when solar is selected but no roof areas and no bags", () => {
    const input = {
      ...base,
      energySources: ["solar"] as const,
      roofAreas: [],
      solarBags: [],
    } satisfies AlgorithmInput;
    expect(getRequiredCableLengthKeys(input)).not.toContain("solarToRegulator");
  });

  it("includes charger leg when shore_power is selected", () => {
    const input = {
      ...base,
      energySources: ["shore_power"] as const,
    } satisfies AlgorithmInput;
    expect(getRequiredCableLengthKeys(input)).toContain("chargerToService");
  });

  it("includes serviceToInverter only with 230 V consumers", () => {
    const twelve = {
      ...base,
      energySources: ["solar"] as const,
      roofAreas: [{ id: "1", name: "Dach", length: 300, width: 200 }],
      consumers: [{ id: "1", name: "Licht", power: 5, daily: 3, voltage: 12 as const }],
    } satisfies AlgorithmInput;
    expect(getRequiredCableLengthKeys(twelve)).not.toContain("serviceToInverter");

    const twoThirty = {
      ...twelve,
      consumers: [{ id: "1", name: "Kettle", power: 2000, daily: 0.5, voltage: 230 as const }],
    } satisfies AlgorithmInput;
    expect(getRequiredCableLengthKeys(twoThirty)).toContain("serviceToInverter");
  });
});

describe("areRequiredCableLengthsValid", () => {
  it("ignores non-required keys", () => {
    const input = {
      ...base,
      energySources: ["solar"] as const,
      roofAreas: [{ id: "1", name: "Dach", length: 300, width: 200 }],
      consumers: [{ id: "1", name: "Licht", power: 5, daily: 3, voltage: 12 as const }],
      cableLengths: {
        ...DEFAULT_CABLE_LENGTHS,
        starterToService: 0,
        boosterToService: 0,
      },
    } satisfies AlgorithmInput;
    expect(areRequiredCableLengthsValid(input)).toBe(true);
  });

  it("fails when a required key is zero", () => {
    const input = {
      ...base,
      energySources: ["alternator"] as const,
      cableLengths: { ...DEFAULT_CABLE_LENGTHS, starterToService: 0 },
    } satisfies AlgorithmInput;
    expect(areRequiredCableLengthsValid(input)).toBe(false);
  });
});
