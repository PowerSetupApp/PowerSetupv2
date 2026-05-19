import * as React from "react";

import { cn } from "@/lib/utils";

export interface StatProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  trend?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "amber" | "forest" | "rust";
}

const sizeClasses = {
  sm: { val: "text-lg", label: "text-[10px]", unit: "text-[10px]" },
  md: { val: "text-2xl", label: "text-[10.5px]", unit: "text-[11px]" },
  lg: { val: "text-4xl", unit: "text-[13px]", label: "text-[11px]" },
  xl: { val: "text-[52px]", unit: "text-[15px]", label: "text-xs" },
};

const toneClasses = {
  default: "text-fg-1",
  amber: "text-amber-700",
  forest: "text-forest-700",
  rust: "text-rust-700",
};

export function Stat({ label, value, unit, trend, size = "md", tone = "default" }: StatProps) {
  const s = sizeClasses[size];
  return (
    <div className="flex flex-col gap-0.5">
      <div
        className={cn(
          "font-display font-semibold uppercase tracking-[0.08em] text-fg-3",
          s.label,
        )}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <div
          className={cn(
            "num font-semibold leading-none tracking-tight tabular-nums",
            s.val,
            toneClasses[tone],
          )}
        >
          {value}
        </div>
        {unit ? (
          <span className={cn("num text-fg-3 tabular-nums", s.unit)}>{unit}</span>
        ) : null}
        {trend ? (
          <span
            className={cn(
              "num font-semibold tabular-nums",
              s.unit,
              trend.startsWith("+") ? "text-forest-500" : "text-rust-500",
            )}
          >
            {trend}
          </span>
        ) : null}
      </div>
    </div>
  );
}
