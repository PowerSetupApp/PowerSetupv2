import type { SchematicPlan } from "./schema";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function schematicPlanToPrintHtml(plan: SchematicPlan): string {
  const nodesHtml = plan.nodes
    .map(
      (n) => `
      <div class="node">
        <p class="nid">${esc(n.id)}</p>
        <p class="lab">${esc(n.label)}</p>
        <p class="typ">${esc(n.componentType)}</p>
        ${n.notesDe ? `<p class="note">${esc(n.notesDe)}</p>` : ""}
      </div>`,
    )
    .join("");

  const edgesHtml = plan.edges
    .map(
      (e) => `<tr><td>${esc(e.from)}</td><td>${esc(e.to)}</td><td>${e.label ? esc(e.label) : "—"}</td></tr>`,
    )
    .join("");

  const warn = plan.warningsDe.map((w) => `<li>${esc(w)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${esc(plan.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #111; margin: 0; padding: 12mm; font-size: 11pt; }
    h1 { font-size: 18pt; margin: 0 0 8mm; }
    h2 { font-size: 13pt; margin: 6mm 0 3mm; }
    .legend { white-space: pre-wrap; line-height: 1.45; margin-bottom: 6mm; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3mm; }
    .node { border: 1px solid #ccc; border-radius: 6px; padding: 3mm; }
    .nid { font-size: 8pt; color: #666; margin: 0; }
    .lab { font-weight: 700; margin: 1mm 0; }
    .typ { font-size: 9pt; margin: 0; color: #444; }
    .note { font-size: 9pt; margin: 2mm 0 0; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
    th, td { border: 1px solid #ccc; padding: 2mm; font-size: 9pt; text-align: left; }
    th { background: #f3f3f3; }
    .warn { margin-top: 6mm; padding: 3mm; background: #fff8e6; border: 1px solid #e6c200; border-radius: 4px; }
    .footer { margin-top: 8mm; font-size: 8pt; color: #555; }
  </style>
</head>
<body>
  <h1>${esc(plan.title)}</h1>
  <h2>Legende / Beschreibung</h2>
  <div class="legend">${esc(plan.legendDe)}</div>
  <h2>Komponenten</h2>
  <div class="grid">${nodesHtml}</div>
  <h2>Verbindungen</h2>
  <table>
    <thead><tr><th>Von</th><th>Nach</th><th>Label</th></tr></thead>
    <tbody>${edgesHtml}</tbody>
  </table>
  <div class="warn">
    <strong>Hinweise</strong>
    <ul>${warn}</ul>
  </div>
  <p class="footer">PowerSetup — automatisch erstellter Planungsentwurf. Keine Bauanleitung.</p>
</body>
</html>`;
}
