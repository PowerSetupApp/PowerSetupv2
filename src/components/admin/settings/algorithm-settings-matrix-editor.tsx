"use client";

import { Input } from "@/components/ui/input";
import type { AlgorithmMatrixFieldKey } from "@/lib/schemas/algorithm-settings-matrices";
import { algorithmMatrixFieldSchemas, parseJsonMatrixField } from "@/lib/schemas/algorithm-settings-matrices";

type MatrixGridProps = {
  fieldKey: AlgorithmMatrixFieldKey;
  value: unknown;
  onChange: (next: unknown) => void;
};

type Layout =
  | {
      kind: "nested";
      rows: string[];
      cols: string[];
    }
  | {
      kind: "flat";
      keys: string[];
    };

const MATRIX_LAYOUT: Record<AlgorithmMatrixFieldKey, Layout> = {
  maxAutarchyDays: {
    kind: "nested",
    rows: ["weekend", "week", "extended", "permanent"],
    cols: ["battery_only", "solar_or_alt", "solar_and_alt"],
  },
  pshTable: {
    kind: "nested",
    rows: ["scandinavia", "germany", "southern", "eastern", "varies"],
    cols: ["summer", "all_year", "winter"],
  },
  solarBagAlignmentUplift: {
    kind: "nested",
    rows: ["scandinavia", "germany", "southern", "eastern", "varies"],
    cols: ["summer", "all_year", "winter"],
  },
  driveHoursPerDay: {
    kind: "nested",
    rows: ["weekend", "week", "extended", "permanent"],
    cols: ["short", "medium", "long"],
  },
  dodDefaults: { kind: "flat", keys: ["lifepo4", "agm", "gel"] },
  roundtripDefaults: { kind: "flat", keys: ["lifepo4", "agm", "gel"] },
  cRateChargeMax: { kind: "flat", keys: ["lifepo4", "agm", "gel"] },
  absorptionTailH: { kind: "flat", keys: ["lifepo4", "agm", "gel"] },
  chargerTargetCRate: { kind: "flat", keys: ["occasional", "nightly", "nightly_fast", "full_time"] },
  shoreBridgeReliefDays: { kind: "flat", keys: ["never", "occasional", "nightly", "nightly_fast", "full_time"] },
  alternatorBridgeStandingCredit: { kind: "flat", keys: ["short", "medium", "long"] },
  topUpCoverageStandingCapMult: { kind: "flat", keys: ["short", "medium", "long"] },
  peakFactor: { kind: "flat", keys: ["low", "moderate", "high"] },
};

function readNested(data: Record<string, unknown>, row: string, col: string): number {
  const rowObj = data[row];
  if (!rowObj || typeof rowObj !== "object") return 0;
  const v = (rowObj as Record<string, unknown>)[col];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function readFlat(data: Record<string, unknown>, key: string): number {
  const v = data[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function AlgorithmSettingsMatrixEditor({ fieldKey, value, onChange }: MatrixGridProps) {
  const layout = MATRIX_LAYOUT[fieldKey];
  const parsed = parseJsonMatrixField(fieldKey, value);
  const data = (parsed ?? {}) as Record<string, unknown>;

  const commit = (next: Record<string, unknown>) => {
    const schema = algorithmMatrixFieldSchemas[fieldKey];
    const checked = schema.safeParse(next);
    if (checked.success) onChange(checked.data);
    else onChange(next);
  };

  if (layout.kind === "flat") {
    return (
      <div className="overflow-x-auto rounded-md border border-border/80">
        <table className="w-full min-w-[12rem] border-collapse text-sm">
          <tbody>
            {layout.keys.map((k) => (
              <tr key={k} className="border-b border-border/60 last:border-0">
                <td className="whitespace-nowrap px-2 py-1 font-medium capitalize">{k.replace(/_/g, " ")}</td>
                <td className="px-1 py-1">
                  <Input
                    type="number"
                    step="0.01"
                    className="h-8"
                    value={String(readFlat(data, k))}
                    onChange={(e) => {
                      const n = Number.parseFloat(e.target.value);
                      const next = { ...data, [k]: Number.isFinite(n) ? n : 0 };
                      commit(next);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border/80">
      <table className="w-full min-w-[16rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/80 bg-muted/40">
            <th className="px-2 py-1.5 text-left font-medium text-muted-foreground"> </th>
            {layout.cols.map((c) => (
              <th key={c} className="px-2 py-1.5 text-left font-medium capitalize text-muted-foreground">
                {c.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {layout.rows.map((r) => (
            <tr key={r} className="border-b border-border/60 last:border-0">
              <td className="whitespace-nowrap px-2 py-1 font-medium capitalize">{r.replace(/_/g, " ")}</td>
              {layout.cols.map((c) => (
                <td key={c} className="px-1 py-1">
                  <Input
                    type="number"
                    step="0.01"
                    className="h-8"
                    value={String(readNested(data, r, c))}
                    onChange={(e) => {
                      const n = Number.parseFloat(e.target.value);
                      const rowObj = {
                        ...(typeof data[r] === "object" && data[r] !== null ? (data[r] as object) : {}),
                        [c]: Number.isFinite(n) ? n : 0,
                      };
                      const next = { ...data, [r]: rowObj };
                      commit(next);
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
