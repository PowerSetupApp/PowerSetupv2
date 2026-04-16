import { describe, expect, it } from "vitest";

import { DEFAULT_ALGORITHM_INPUT } from "@/lib/algorithm/types";

import {
  canNavigateToStep,
  completedWizardStepIds,
  validateWizardStep,
} from "./validation";

describe("validateWizardStep", () => {
  it("requires at least one energy source on step 2", () => {
    expect(validateWizardStep(2, DEFAULT_ALGORITHM_INPUT)).toBe(false);
    expect(
      validateWizardStep(2, {
        ...DEFAULT_ALGORITHM_INPUT,
        energySources: ["solar"],
      }),
    ).toBe(true);
  });

  it("requires at least one consumer on step 3", () => {
    const withSolar = { ...DEFAULT_ALGORITHM_INPUT, energySources: ["solar"] as const };
    expect(validateWizardStep(3, withSolar)).toBe(false);
    expect(
      validateWizardStep(3, {
        ...withSolar,
        consumers: [
          { id: "1", name: "Licht", power: 5, daily: 3, voltage: 12 },
        ],
      }),
    ).toBe(true);
  });
});

describe("canNavigateToStep", () => {
  it("blocks skipping ahead when an intermediate step is invalid", () => {
    const input = DEFAULT_ALGORITHM_INPUT;
    expect(canNavigateToStep(3, 1, input)).toBe(false);
  });
});

describe("completedWizardStepIds", () => {
  it("lists only valid prior steps", () => {
    const input = {
      ...DEFAULT_ALGORITHM_INPUT,
      energySources: ["solar"] as const,
      consumers: [{ id: "1", name: "X", power: 1, daily: 1, voltage: 12 as const }],
    };
    expect(completedWizardStepIds(3, input)).toEqual([1, 2]);
  });
});
