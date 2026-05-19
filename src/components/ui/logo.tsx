import * as React from "react";

import { cn } from "@/lib/utils";

export interface LogoProps {
  size?: number;
  color?: string;
  accent?: string;
  withText?: boolean;
  className?: string;
}

/** Lockup: Mark + „PowerSetup“ — Farben aus Tokens überschreibbar. */
export function Logo({
  size = 28,
  color = "var(--charcoal-600)",
  accent = "var(--amber-400)",
  withText = true,
  className,
}: LogoProps) {
  const fs = size * 0.6;
  return (
    <div className={cn("flex items-center gap-2.5", className)} style={{ color }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect x="2" y="2" width="28" height="28" rx="7" fill={color} />
        <path d="M17 7 L10 18 L15 18 L14 25 L22 13 L16 13 Z" fill={accent} />
      </svg>
      {withText ? (
        <span className="font-display font-bold tracking-tight" style={{ fontSize: fs }}>
          PowerSetup
        </span>
      ) : null}
    </div>
  );
}
