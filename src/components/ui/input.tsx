import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.ComponentProps<"input"> & {
  label?: string;
  hint?: string;
  error?: string;
  unit?: string;
  leadingIcon?: React.ReactNode;
  inputSize?: "sm" | "md" | "lg";
  tabular?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    type,
    label,
    hint,
    error,
    unit,
    leadingIcon,
    inputSize = "md",
    tabular,
    id,
    ...props
  },
  ref,
) {
  const genId = React.useId();
  const inputId = id ?? genId;

  const pad = inputSize === "sm" ? "py-1.5" : inputSize === "lg" ? "py-3.5" : "py-2.5";
  const fs = inputSize === "sm" ? "text-xs" : inputSize === "lg" ? "text-base" : "text-sm";

  const field = (
    <input
      ref={ref}
      id={inputId}
      type={type}
      data-slot="input"
      className={cn(
        /* flex row wrapper: grow to full width; avoid display:flex on input (sizing quirks) */
        "block min-w-0 flex-1 bg-transparent text-fg-1 outline-none focus-visible:outline-none",
        "placeholder:text-fg-3",
        fs,
        pad,
        tabular && "num tabular-nums",
        className,
      )}
      {...props}
    />
  );

  const hasChrome = Boolean(label || hint || error || unit || leadingIcon);

  if (!hasChrome) {
    return (
      <input
        ref={ref}
        id={inputId}
        type={type}
        data-slot="input"
        className={cn(
          "flex h-9 w-full min-w-0 rounded-[var(--radius-sm)] border border-border-2 bg-bg-2 px-3 py-1 text-sm shadow-[inset_0_1px_2px_rgba(52,44,27,0.03)] transition-[color,box-shadow]",
          "outline-none focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          tabular && "num tabular-nums",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3"
        >
          {label}
        </label>
      ) : null}
      <div
        data-slot="input-shell"
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-sm)] border bg-bg-2 px-3 shadow-[inset_0_1px_2px_rgba(52,44,27,0.03)] transition-[color,box-shadow]",
          error ? "border-rust-500" : "border-border-2",
          /* Focus ring on shell — globals.css strips outline on inner input inside input-shell */
          !error &&
            "focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/25",
        )}
      >
        {leadingIcon ? <span className="shrink-0 text-fg-3">{leadingIcon}</span> : null}
        {field}
        {unit ? (
          <span className="shrink-0 font-mono text-xs text-fg-3 tabular-nums">{unit}</span>
        ) : null}
      </div>
      {error ? (
        <p className="text-[11.5px] text-rust-700 dark:text-rust-300">{error}</p>
      ) : hint ? (
        <p className="text-[11.5px] text-fg-3">{hint}</p>
      ) : null}
    </div>
  );
});

export { Input };
