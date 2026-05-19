import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const chipVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-display font-semibold leading-none",
  {
    variants: {
      tone: {
        neutral: "border-sand-200 bg-sand-100 text-fg-2",
        amber: "border-amber-200 bg-amber-50 text-amber-700",
        forest: "border-forest-100 bg-forest-50 text-forest-700",
        rust: "border-rust-100 bg-rust-50 text-rust-700",
        dark: "border-charcoal-500 bg-charcoal-600 text-sand-50",
      },
      size: {
        xs: "px-[7px] py-0.5 text-[10px]",
        sm: "px-2 py-[3px] text-[11px]",
        md: "px-3 py-[5px] text-xs",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "sm",
    },
  },
);

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof chipVariants> {
  icon?: React.ReactNode;
}

export function Chip({ className, tone, size, icon, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ tone, size }), className)} {...props}>
      {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      {children}
    </span>
  );
}

