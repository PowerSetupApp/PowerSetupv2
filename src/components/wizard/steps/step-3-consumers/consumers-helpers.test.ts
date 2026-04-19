import { describe, expect, it } from "vitest";

import { countConsumersFromTemplate, templateToConsumerVoltage } from "./consumers-helpers";

describe("templateToConsumerVoltage", () => {
  it("maps DC catalog defaults to system voltage", () => {
    expect(templateToConsumerVoltage(12, 24)).toBe(24);
    expect(templateToConsumerVoltage(48, 12)).toBe(12);
  });

  it("preserves 230 V AC", () => {
    expect(templateToConsumerVoltage(230, 48)).toBe(230);
  });
});

describe("countConsumersFromTemplate", () => {
  it("counts by sourceDeviceId", () => {
    const consumers = [
      { id: "a", name: "LED", power: 10, daily: 1, voltage: 12 as const, sourceDeviceId: "tpl-1" },
      { id: "b", name: "LED copy", power: 10, daily: 1, voltage: 12 as const, sourceDeviceId: "tpl-1" },
      { id: "c", name: "Other", power: 5, daily: 1, voltage: 12 as const },
    ];
    expect(countConsumersFromTemplate(consumers, "tpl-1")).toBe(2);
    expect(countConsumersFromTemplate(consumers, "missing")).toBe(0);
  });
});
