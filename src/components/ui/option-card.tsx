import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface OptionCardOption<T extends string | number> {
  value: T;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface OptionCardGroupProps<T extends string | number> {
  options: OptionCardOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  columns?: 2 | 3;
  labelId?: string;
}

/**
 * Design-System Option Card — Icon, Titel, Sub, selected + Check (Radio-Logik).
 */
export function OptionCardGroup<T extends string | number>({
  options,
  value,
  onChange,
  className,
  columns = 3,
  labelId,
}: OptionCardGroupProps<T>) {
  const grid = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className={cn("grid grid-cols-1 gap-3", grid, className)}
    >
      {options.map((opt) => {
        const selected = !opt.disabled && value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            onClick={() => {
              if (!opt.disabled) onChange(opt.value);
            }}
            className={cn(
              "relative flex min-h-[9.5rem] flex-col items-center rounded-lg border p-5 text-center transition-[border-color,background-color,box-shadow,transform] duration-[var(--duration-base)] ease-[var(--ease-out)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2",
              opt.disabled
                ? "cursor-not-allowed border-border-1 bg-bg-3/50 opacity-60"
                : "cursor-pointer border-border-1 bg-bg-2 hover:border-amber-300/80 hover:shadow-[var(--shadow-sm)]",
              selected && "border-amber-400 bg-amber-50/60 shadow-sm dark:bg-amber-500/10",
            )}
          >
            {selected ? (
              <span
                className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-amber-400 text-charcoal-700"
                aria-hidden
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            ) : null}
            {opt.icon ? <span className="mb-2 text-fg-2 [&_svg]:size-6">{opt.icon}</span> : null}
            <span className="font-display text-sm font-semibold text-fg-1">{opt.title}</span>
            {opt.description ? (
              <span className="mt-1 text-pretty text-xs leading-snug text-fg-2">{opt.description}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
