"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface IconOption<T extends string = string> {
  value: T;
  label: string;
  icon: React.ReactNode;
}

export interface IconSelectorProps<T extends string = string> {
  options: IconOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  columns?: 2 | 3;
}

/** Tile selection (e.g. vehicle type) — touch-friendly, mobile-first. */
export function IconSelector<T extends string = string>({
  options,
  value,
  onChange,
  className,
  columns = 2,
}: IconSelectorProps<T>) {
  const gridCols = columns === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className={cn("grid gap-3", gridCols, className)} role="listbox">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors",
              "min-h-[104px] touch-manipulation",
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <span className="text-foreground [&_svg]:size-8">{option.icon}</span>
            <span className="text-sm font-medium leading-tight">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
