import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  pct: number;
  className?: string;
}

/** 3px top progress line — amber fill on sand track. */
export function ProgressBar({ pct, className }: ProgressBarProps) {
  const p = Math.min(100, Math.max(0, pct));
  const scale = p / 100;
  return (
    <div
      className={cn(
        "h-[3px] w-full overflow-hidden bg-sand-100 dark:bg-charcoal-500",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(p)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full w-full origin-left bg-amber-400 will-change-transform transition-transform duration-[650ms] ease-[cubic-bezier(0.45,0.05,0.55,0.95)] motion-reduce:transition-none motion-reduce:will-change-auto"
        style={{ transform: `scaleX(${scale})` }}
      />
    </div>
  );
}
