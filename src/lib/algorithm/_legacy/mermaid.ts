/**
 * Mermaid-Flowchart-Renderer für den `AlgorithmTrace`.
 *
 * Erzeugt einen kompakten `flowchart TD`-Quelltext, in dem jede Phase ein
 * Knoten mit echten Zahlen (Werte, Einheiten) ist. Wird in der Debug-Ansicht
 * von Wizard-Step 8 an `mermaid.render()` übergeben.
 *
 * Design-Ziele:
 * - Deterministisch (gleicher Trace → gleicher String), damit Snapshot-Tests
 *   stabil sind.
 * - Keine externen Abhängigkeiten (pure function).
 * - Knotenlabels sind so kurz wie möglich, damit das Diagramm auf Mobile
 *   lesbar bleibt.
 */

import type { AlgorithmTrace, TracePhase, TraceStep } from "./trace";

/** Ersetzt Zeichen, die Mermaid im Node-Label sprengen würden. */
function escapeLabel(raw: string): string {
  return raw
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Formatiert eine Zahl mit optionaler Einheit. */
function formatValue(step: TraceStep): string {
  const v = Number.isFinite(step.value) ? step.value : "—";
  return step.unit ? `${v} ${step.unit}` : String(v);
}

/**
 * Wählt die „Headline“-Werte jeder Phase aus, die im Diagramm angezeigt werden.
 * Priorität: Output-Schritte → Intermediate → alles.
 */
function headlineStepsForPhase(trace: AlgorithmTrace, phase: TracePhase): TraceStep[] {
  const stepsInPhase = trace.steps.filter((s) => s.phase === phase);
  if (stepsInPhase.length === 0) return [];
  const outputs = stepsInPhase.filter((s) => s.kind === "output");
  if (outputs.length > 0) return outputs.slice(0, 3);
  const intermediates = stepsInPhase.filter((s) => s.kind === "intermediate");
  if (intermediates.length > 0) return intermediates.slice(0, 3);
  return stepsInPhase.slice(0, 3);
}

const PHASE_TITLES: Record<TracePhase, string> = {
  input: "Wizard-Input",
  energy: "Phase 1: Energie",
  solar: "Phase 3: Solar",
  battery: "Phase 2: Batterie",
  booster: "Phase 4: Ladebooster",
  charger: "Phase 5: Landstrom-Lader",
  inverter: "Phase 6: Wechselrichter",
  controller: "Phase 8: Solar-Regler",
  cables: "Phase 7: Kabel",
};

/** Stabile Knoten-IDs — kein String-Hashing nötig, Mapping reicht. */
const PHASE_NODE_IDS: Record<TracePhase, string> = {
  input: "wizardInput",
  energy: "energy",
  solar: "solar",
  battery: "battery",
  booster: "booster",
  charger: "charger",
  inverter: "inverter",
  controller: "controller",
  cables: "cables",
};

/**
 * Wandelt einen Trace in Mermaid-Quelltext um.
 *
 * Kanten modellieren den tatsächlichen Datenfluss im Algorithmus:
 *   input → energy → solar, battery, inverter, controller
 *   energy → battery, inverter
 *   solar → battery, controller
 *   booster → battery, cables
 *   battery → charger
 *   controller → cables
 *   inverter → cables
 *   charger → cables
 */
export function traceToMermaid(trace: AlgorithmTrace): string {
  const lines: string[] = ["flowchart TD"];
  const presentPhases = new Set<TracePhase>();

  for (const phase of Object.keys(PHASE_TITLES) as TracePhase[]) {
    const headline = headlineStepsForPhase(trace, phase);
    if (phase !== "input" && headline.length === 0) continue;
    presentPhases.add(phase);

    const title = PHASE_TITLES[phase];
    const body = headline.map((s) => `${s.label}: ${formatValue(s)}`).join("<br/>");
    const label = escapeLabel(body ? `${title}<br/>${body}` : title);
    lines.push(`    ${PHASE_NODE_IDS[phase]}["${label}"]`);
  }

  const edge = (from: TracePhase, to: TracePhase) => {
    if (presentPhases.has(from) && presentPhases.has(to)) {
      lines.push(`    ${PHASE_NODE_IDS[from]} --> ${PHASE_NODE_IDS[to]}`);
    }
  };

  edge("input", "energy");
  edge("input", "solar");
  edge("input", "booster");
  edge("input", "inverter");
  edge("energy", "battery");
  edge("energy", "solar");
  edge("energy", "inverter");
  edge("solar", "battery");
  edge("solar", "controller");
  edge("booster", "battery");
  edge("battery", "charger");
  edge("booster", "cables");
  edge("charger", "cables");
  edge("inverter", "cables");
  edge("controller", "cables");

  return lines.join("\n");
}
