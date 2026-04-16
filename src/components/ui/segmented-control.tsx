"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption<T extends string | number = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string | number = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/** Pill-style toggle (e.g. 12V / 24V). */
export function SegmentedControl<T extends string | number = string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: "h-9 text-sm",
    md: "h-11 text-base",
    lg: "h-14 text-lg",
  };

  return (
    <div className={cn("inline-flex rounded-xl bg-muted p-1", className)}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
            className={cn(
            "flex min-w-[80px] items-center justify-center gap-2 rounded-lg px-6 transition-[color,background-color,box-shadow,transform] duration-200 ease-out motion-reduce:transition-none",
            "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            sizeClasses[size],
            value === option.value
              ? "bg-background font-medium text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.icon ? <span>{option.icon}</span> : null}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
