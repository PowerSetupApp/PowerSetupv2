import { describe, expect, it } from "vitest";

import { schematicPlanSchema } from "./schema";
import { schematicPlanToPrintHtml } from "./schematic-html";

describe("schematicPlanToPrintHtml", () => {
  it("includes title and escaped angle brackets", () => {
    const plan = schematicPlanSchema.parse({
      title: "Plan <test>",
      legendDe: "Legende mit <tag>",
      warningsDe: ["Warn <1>"],
      nodes: [
        { id: "A", label: "A", componentType: "t" },
        { id: "B", label: "B", componentType: "t" },
      ],
      edges: [{ from: "A", to: "B" }],
    });
    const html = schematicPlanToPrintHtml(plan);
    expect(html).toContain("Plan &lt;test&gt;");
    expect(html).not.toContain("<test>");
  });
});
