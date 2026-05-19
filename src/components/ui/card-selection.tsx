"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CardOption<T extends string | number = string> {
  value: T;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

export interface CardSelectionProps<T extends string | number = string> {
  options: CardOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  columns?: 2 | 3;
  /** Optional id for aria-labelledby on the radiogroup */
  labelId?: string;
}

const gridCols = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
} as const;

/**
 * Large selectable cards (radio behavior). For wizard steps with title + supporting text per option.
 */
export function CardSelection<T extends string | number = string>({
  options,
  value,
  onChange,
  className,
  columns = 3,
  labelId,
}: CardSelectionProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className={cn("grid gap-3 sm:gap-4", gridCols[columns], className)}
    >
      {options.map((option) => {
        const selected = !option.disabled && value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={option.disabled}
            disabled={option.disabled}
            onClick={() => {
              if (!option.disabled) onChange(option.value);
            }}
            className={cn(
              "relative flex min-h-[9.5rem] flex-col items-start rounded-lg border p-5 pr-12 text-left transition-[border-color,background-color,box-shadow,transform] duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-1",
              option.disabled
                ? "cursor-not-allowed border-border-1 bg-bg-3/60 opacity-60 grayscale"
                : "cursor-pointer border-border-1 bg-bg-2 hover:border-amber-300/80 hover:shadow-[var(--shadow-sm)] active:scale-[0.99] motion-reduce:active:scale-100",
              selected && "border-amber-400 bg-amber-50/70 shadow-sm dark:bg-amber-500/10",
            )}
          >
            {option.badge ? (
              <span
                className={cn(
                  "absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium",
                  selected ? "bg-amber-400 text-charcoal-700" : "bg-bg-3 text-fg-3",
                )}
              >
                {option.badge}
              </span>
            ) : null}

            {option.icon ? (
              <span className="mb-3 shrink-0 text-fg-2 [&_svg]:size-6">{option.icon}</span>
            ) : null}

            <span
              className={cn(
                "mb-1.5 text-base font-semibold leading-tight",
                selected ? "text-amber-700" : "text-fg-1",
              )}
            >
              {option.title}
            </span>

            {option.description ? (
              <span className="text-sm leading-relaxed text-fg-2">{option.description}</span>
            ) : null}

            {selected ? (
              <span
                className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-400 text-charcoal-700"
              >
                <Check className="size-3 stroke-[3] text-charcoal-700" aria-hidden />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
