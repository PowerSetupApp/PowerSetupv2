import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const STROKE = 1.75;

type EnergySourceIconProps = {
  className?: string;
};

function EnergySourceIconSvg({ className, children }: EnergySourceIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-3.5 shrink-0", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Solar panel grid — matches design primitives `solar`. */
export function SolarSourceIcon({ className }: EnergySourceIconProps) {
  return (
    <EnergySourceIconSvg className={className}>
      <rect x="4" y="5" width="16" height="12" rx="1" />
      <path d="M4 9 H20 M4 13 H20 M10 5 V17 M15 5 V17" />
    </EnergySourceIconSvg>
  );
}

/** Alternator / booster loop — matches design primitives `refresh`. */
export function AlternatorSourceIcon({ className }: EnergySourceIconProps) {
  return (
    <EnergySourceIconSvg className={className}>
      <path d="M3 12 A9 9 0 0 1 20 8" />
      <path d="M20 4 V9 H15" />
      <path d="M21 12 A9 9 0 0 1 4 16" />
      <path d="M4 20 V15 H9" />
    </EnergySourceIconSvg>
  );
}

/** Shore power plug — matches design primitives `plug`. */
export function ShorePowerSourceIcon({ className }: EnergySourceIconProps) {
  return (
    <EnergySourceIconSvg className={className}>
      <path d="M9 2 V6 M15 2 V6" />
      <path d="M6 6 H18 V12 A6 6 0 0 1 6 12 Z" />
      <path d="M12 18 V22" />
    </EnergySourceIconSvg>
  );
}
