"use client";

import * as React from "react";
import {
  Activity,
  Battery,
  Cable,
  Cpu,
  Gauge,
  PanelTop,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type ProductIlloKind =
  | "battery"
  | "solar"
  | "mppt"
  | "inverter"
  | "booster"
  | "cables"
  | "monitor";

const GRADS: Record<ProductIlloKind, string> = {
  battery: "linear-gradient(135deg, #3a4943 0%, #131a17 100%)",
  solar: "linear-gradient(135deg, #1a365a 0%, #051022 100%)",
  mppt: "linear-gradient(135deg, #262a31 0%, #0f1116 100%)",
  inverter: "linear-gradient(135deg, #2f3139 0%, #14151a 100%)",
  booster: "linear-gradient(135deg, #4a2e1d 0%, #1a0f08 100%)",
  cables: "linear-gradient(135deg, #3d2418 0%, #1a0f08 100%)",
  monitor: "linear-gradient(135deg, #1f2228 0%, #0b0c10 100%)",
};

const ICONS: Record<ProductIlloKind, React.ElementType> = {
  battery: Battery,
  solar: PanelTop,
  mppt: Cpu,
  inverter: Zap,
  booster: Activity,
  cables: Cable,
  monitor: Gauge,
};

export interface ProductIlloProps extends React.HTMLAttributes<HTMLDivElement> {
  kind?: ProductIlloKind;
  size?: number;
}

/** Isometrische Produkt-Miniatur — Farbverlauf + Icon (Design-Vorlage angelehnt). */
export function ProductIllo({
  kind = "battery",
  size = 140,
  className,
  style,
  ...props
}: ProductIlloProps) {
  const Ico = ICONS[kind] ?? Battery;
  const grad = GRADS[kind] ?? GRADS.battery;
  return (
    <div
      className={cn("relative overflow-hidden rounded-[14px] shadow-inner", className)}
      style={{
        width: size,
        height: size,
        background: grad,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -20px 30px rgba(0,0,0,0.2)",
        ...style,
      }}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      <div className="relative flex h-full w-full items-center justify-center p-1.5 text-amber-200/90">
        <Ico className="size-[55%]" strokeWidth={1.25} aria-hidden />
      </div>
    </div>
  );
}
