"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  className?: string;
}

/** Circular progress 0–100. */
export function ProgressRing({
  value,
  size = 44,
  stroke = 5,
  color = "var(--amber-400)",
  track = "var(--sand-200)",
  className,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = c - (clamped / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
