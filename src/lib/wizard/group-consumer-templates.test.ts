import { describe, expect, it } from "vitest";

import type { WizardConsumerTemplate } from "@/lib/db/queries/wizard-consumer-templates";

import { groupConsumerTemplatesByCategory } from "./group-consumer-templates";

function tpl(p: Partial<WizardConsumerTemplate> & Pick<WizardConsumerTemplate, "id" | "name">): WizardConsumerTemplate {
  return {
    categoryId: "c1",
    categoryName: "A",
    categorySortOrder: 0,
    categoryIcon: null,
    deviceIcon: null,
    defaultPower: 10,
    defaultHoursPerDay: 1,
    defaultVoltage: 12,
    isCooling: false,
    showHoursField: true,
    stepHours: 0.5,
    averageLoadPercent: null,
    ...p,
  };
}

describe("groupConsumerTemplatesByCategory", () => {
  it("groups by categoryId and sorts categories by sortOrder", () => {
    const templates: WizardConsumerTemplate[] = [
      tpl({ id: "d1", name: "x", categoryId: "cat-b", categoryName: "B", categorySortOrder: 10 }),
      tpl({ id: "d2", name: "y", categoryId: "cat-a", categoryName: "A", categorySortOrder: 0 }),
      tpl({ id: "d3", name: "z", categoryId: "cat-a", categoryName: "A", categorySortOrder: 0 }),
    ];
    const groups = groupConsumerTemplatesByCategory(templates);
    expect(groups.map((g) => g.categoryId)).toEqual(["cat-a", "cat-b"]);
    expect(groups[0].templates.map((t) => t.id)).toEqual(["d2", "d3"]);
    expect(groups[1].templates.map((t) => t.id)).toEqual(["d1"]);
  });
});
