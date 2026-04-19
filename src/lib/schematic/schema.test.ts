import { describe, expect, it } from "vitest";

import { assertSchematicGraphValid, schematicPlanSchema } from "./schema";

describe("schematicPlanSchema", () => {
  it("accepts a minimal valid plan", () => {
    const plan = schematicPlanSchema.parse({
      title: "Test",
      legendDe: "Legende",
      warningsDe: ["Achtung"],
      nodes: [
        { id: "A", label: "A", componentType: "x" },
        { id: "B", label: "B", componentType: "y" },
      ],
      edges: [{ from: "A", to: "B" }],
    });
    expect(plan.nodes).toHaveLength(2);
    assertSchematicGraphValid(plan);
  });

  it("rejects invalid edge endpoint", () => {
    const plan = schematicPlanSchema.parse({
      title: "Test",
      legendDe: "Legende",
      warningsDe: [],
      nodes: [
        { id: "A", label: "A", componentType: "x" },
        { id: "B", label: "B", componentType: "y" },
      ],
      edges: [{ from: "A", to: "Z" }],
    });
    expect(() => assertSchematicGraphValid(plan)).toThrow();
  });
});
