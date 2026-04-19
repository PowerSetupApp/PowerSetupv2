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
              "relative flex min-h-[9.5rem] flex-col items-center rounded-2xl border-2 p-5 text-center transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              option.disabled
                ? "cursor-not-allowed border-muted bg-muted/20 opacity-60 grayscale"
                : "cursor-pointer border-border/80 bg-card hover:border-primary/40 hover:shadow-md active:scale-[0.99] motion-reduce:active:scale-100",
              selected && "border-primary bg-primary/5 shadow-sm",
            )}
          >
            {option.badge ? (
              <span
                className={cn(
                  "absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {option.badge}
              </span>
            ) : null}

            {option.icon ? (
              <span className="mb-3 shrink-0 text-muted-foreground [&_svg]:size-6">{option.icon}</span>
            ) : null}

            <span
              className={cn(
                "mb-1.5 text-base font-semibold leading-tight",
                selected ? "text-primary" : "text-foreground",
              )}
            >
              {option.title}
            </span>

            {option.description ? (
              <span className="text-sm leading-relaxed text-muted-foreground">{option.description}</span>
            ) : null}

            <span
              className={cn(
                "absolute bottom-4 flex size-5 items-center justify-center rounded-full border-2 transition-colors",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
              )}
            >
              {selected ? <Check className="size-3 stroke-[3]" aria-hidden /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
