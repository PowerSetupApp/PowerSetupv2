import * as z from "zod";

const schematicNodeSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  componentType: z.string().min(1).max(80),
  notesDe: z.string().max(500).optional(),
});

const schematicEdgeSchema = z.object({
  from: z.string().min(1).max(64),
  to: z.string().min(1).max(64),
  label: z.string().max(80).optional(),
});

export const schematicPlanSchema = z.object({
  title: z.string().min(1).max(200),
  legendDe: z.string().max(2000),
  warningsDe: z.array(z.string().max(500)).max(20),
  nodes: z.array(schematicNodeSchema).min(2).max(36),
  edges: z.array(schematicEdgeSchema).max(80),
});

export type SchematicPlan = z.infer<typeof schematicPlanSchema>;

export function assertSchematicGraphValid(plan: SchematicPlan): void {
  const ids = new Set(plan.nodes.map((n) => n.id));
  if (ids.size !== plan.nodes.length) throw new Error("Doppelte Knoten-ID");
  for (const e of plan.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) {
      throw new Error("Kante verweist auf unbekannten Knoten");
    }
  }
}
