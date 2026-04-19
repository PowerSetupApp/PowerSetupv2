import { describe, it, expect } from "vitest";
import { traceToMermaid } from "./mermaid";
import { createTrace, pushStep } from "./trace";

describe("traceToMermaid", () => {
  it("returns a minimal flowchart TD for an empty trace (input node only)", () => {
    const trace = createTrace();
    const src = traceToMermaid(trace);
    expect(src.startsWith("flowchart TD")).toBe(true);
    expect(src).toContain('wizardInput["Wizard-Input"]');
    expect(src).not.toContain("energy[");
  });

  it("renders a node per phase that has steps and connects them", () => {
    const trace = createTrace();
    pushStep(trace, {
      phase: "energy",
      id: "energy.dailyWh",
      label: "Tagesverbrauch",
      value: 1234,
      unit: "Wh",
      kind: "output",
    });
    pushStep(trace, {
      phase: "solar",
      id: "solar.dailySolarYieldWh",
      label: "Solarertrag",
      value: 987,
      unit: "Wh",
      kind: "output",
    });
    pushStep(trace, {
      phase: "battery",
      id: "battery.recommendedCapacityAh",
      label: "Empfohlen",
      value: 100,
      unit: "Ah",
      kind: "output",
    });

    const src = traceToMermaid(trace);

    expect(src).toContain('energy["Phase 1: Energie<br/>Tagesverbrauch: 1234 Wh"]');
    expect(src).toContain('solar["Phase 3: Solar<br/>Solarertrag: 987 Wh"]');
    expect(src).toContain('battery["Phase 2: Batterie<br/>Empfohlen: 100 Ah"]');
    expect(src).toContain("energy --> battery");
    expect(src).toContain("solar --> battery");
    expect(src).toContain("wizardInput --> energy");
  });

  it("prefers output steps over intermediate/input in headline", () => {
    const trace = createTrace();
    pushStep(trace, {
      phase: "battery",
      id: "battery.raw",
      label: "Raw",
      value: 1,
      unit: "Ah",
      kind: "intermediate",
    });
    pushStep(trace, {
      phase: "battery",
      id: "battery.final",
      label: "Final",
      value: 2,
      unit: "Ah",
      kind: "output",
    });
    const src = traceToMermaid(trace);
    expect(src).toContain("Final: 2 Ah");
    expect(src).not.toContain("Raw: 1 Ah");
  });

  it("is deterministic for the same trace", () => {
    const build = () => {
      const t = createTrace();
      pushStep(t, {
        phase: "energy",
        id: "energy.dailyWh",
        label: "Tagesverbrauch",
        value: 500,
        unit: "Wh",
        kind: "output",
      });
      pushStep(t, {
        phase: "battery",
        id: "battery.recommendedCapacityAh",
        label: "Empfohlen",
        value: 80,
        unit: "Ah",
        kind: "output",
      });
      return t;
    };
    expect(traceToMermaid(build())).toBe(traceToMermaid(build()));
  });

  it("escapes quotes and newlines in labels", () => {
    const trace = createTrace();
    pushStep(trace, {
      phase: "energy",
      id: "energy.weird",
      label: 'Name with "quotes"\nand newlines',
      value: 1,
      kind: "output",
    });
    const src = traceToMermaid(trace);
    expect(src).toContain('\\"quotes\\"');
    expect(src).not.toMatch(/\n\s*and newlines/);
  });
});
