"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface SliderProps extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Screen reader text; default `"{value} Tage"` for autarky sliders. */
  ariaValueText?: string;
}

/** Native range control styled for the wizard (accent-primary). */
export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  className,
  disabled,
  ariaValueText,
  ...props
}: SliderProps) {
  return (
    <input
      {...props}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={ariaValueText ?? `${value} Tage`}
      onChange={(e) => onValueChange(Number(e.target.value))}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-sand-100 accent-amber-400 dark:bg-charcoal-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-500 [&::-webkit-slider-thumb]:bg-bg-2 [&::-webkit-slider-thumb]:shadow-sm",
        "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-amber-500 [&::-moz-range-thumb]:bg-bg-2",
        className,
      )}
    />
  );
}
