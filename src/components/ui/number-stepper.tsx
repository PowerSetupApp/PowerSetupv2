"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
  formatValue,
  className,
}: NumberStepperProps) {
  const decrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(Math.round(newValue * 100) / 100);
  };

  const increase = () => {
    const newValue = Math.min(max, value + step);
    onChange(Math.round(newValue * 100) / 100);
  };

  const displayValue = React.useMemo(() => {
    const val = Number.isNaN(value) ? min : value;
    return formatValue ? formatValue(val) : val;
  }, [value, min, formatValue]);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <button
        type="button"
        onClick={decrease}
        disabled={value <= min}
        className={cn(
          "flex h-11 min-h-11 w-11 min-w-11 cursor-pointer items-center justify-center rounded-md border transition-colors",
          "bg-muted hover:bg-muted/80 active:bg-muted/60",
          "touch-manipulation disabled:cursor-not-allowed disabled:opacity-50",
        )}
        aria-label="Decrease"
      >
        <Minus className="h-5 w-5" />
      </button>
      <div className="flex h-11 min-h-11 min-w-[4.5rem] items-center justify-center rounded-md border bg-background px-2 text-center font-medium">
        <span>{displayValue}</span>
        {suffix ? (
          <span className="ml-1 text-sm text-muted-foreground">{suffix}</span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={increase}
        disabled={value >= max}
        className={cn(
          "flex h-11 min-h-11 w-11 min-w-11 cursor-pointer items-center justify-center rounded-md border transition-colors",
          "bg-muted hover:bg-muted/80 active:bg-muted/60",
          "touch-manipulation disabled:cursor-not-allowed disabled:opacity-50",
        )}
        aria-label="Increase"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
