import { describe, expect, it } from "vitest";

import type { AlgorithmInput } from "@/lib/algorithm/types";
import { DEFAULT_ALGORITHM_INPUT } from "@/lib/algorithm/types";

import {
  canNavigateToStep,
  completedWizardStepIds,
  isWizardCompleteForSubmission,
  validateWizardStep,
} from "./validation";

describe("validateWizardStep", () => {
  it("requires at least one energy source on step 2", () => {
    expect(validateWizardStep(2, DEFAULT_ALGORITHM_INPUT)).toBe(false);
    expect(
      validateWizardStep(2, {
        ...DEFAULT_ALGORITHM_INPUT,
        energySources: ["solar"],
        roofAreas: [],
      } as AlgorithmInput),
    ).toBe(false);
    expect(
      validateWizardStep(2, {
        ...DEFAULT_ALGORITHM_INPUT,
        energySources: ["solar"],
        roofAreas: [{ id: "1", name: "Hauptfläche", length: 300, width: 200 }],
      } as AlgorithmInput),
    ).toBe(true);
  });

  it("requires at least one consumer on step 3", () => {
    const withSolar = {
      ...DEFAULT_ALGORITHM_INPUT,
      energySources: ["solar"],
      roofAreas: [{ id: "1", name: "Hauptfläche", length: 300, width: 200 }],
    } as AlgorithmInput;
    expect(validateWizardStep(3, withSolar)).toBe(false);
    expect(
      validateWizardStep(3, {
        ...withSolar,
        consumers: [
          { id: "1", name: "Licht", power: 5, daily: 3, voltage: 12 },
        ],
      } as AlgorithmInput),
    ).toBe(true);
  });

  it("step 6 only validates cable keys required for selected sources", () => {
    const solar12v = {
      ...DEFAULT_ALGORITHM_INPUT,
      energySources: ["solar"],
      roofAreas: [{ id: "1", name: "Hauptfläche", length: 300, width: 200 }],
      consumers: [{ id: "1", name: "Licht", power: 5, daily: 3, voltage: 12 }],
      cableLengths: {
        ...DEFAULT_ALGORITHM_INPUT.cableLengths,
        starterToService: 0,
        boosterToService: 0,
        chargerToService: 0,
      },
    } satisfies AlgorithmInput;
    expect(validateWizardStep(6, solar12v)).toBe(true);

    const withAlternator = {
      ...solar12v,
      energySources: ["solar", "alternator"],
      cableLengths: {
        ...solar12v.cableLengths,
        starterToService: 0,
      },
    } satisfies AlgorithmInput;
    expect(validateWizardStep(6, withAlternator)).toBe(false);
  });
});

describe("canNavigateToStep", () => {
  it("blocks skipping ahead when an intermediate step is invalid", () => {
    const input = DEFAULT_ALGORITHM_INPUT;
    expect(canNavigateToStep(3, 1, input)).toBe(false);
  });
});

describe("isWizardCompleteForSubmission", () => {
  it("is false when energy or consumers missing", () => {
    expect(isWizardCompleteForSubmission(DEFAULT_ALGORITHM_INPUT)).toBe(false);
  });

  it("is true when steps 1–7 validate", () => {
    const input = {
      ...DEFAULT_ALGORITHM_INPUT,
      energySources: ["solar"],
      roofAreas: [{ id: "1", name: "Hauptfläche", length: 300, width: 200 }],
      consumers: [{ id: "1", name: "X", power: 10, daily: 2, voltage: 12 }],
    } satisfies AlgorithmInput;
    expect(isWizardCompleteForSubmission(input)).toBe(true);
  });
});

describe("completedWizardStepIds", () => {
  it("lists only valid prior steps", () => {
    const input = {
      ...DEFAULT_ALGORITHM_INPUT,
      energySources: ["solar"],
      roofAreas: [{ id: "1", name: "Hauptfläche", length: 300, width: 200 }],
      consumers: [{ id: "1", name: "X", power: 1, daily: 1, voltage: 12 }],
    } satisfies AlgorithmInput;
    expect(completedWizardStepIds(3, input)).toEqual([1, 2]);
  });
});
