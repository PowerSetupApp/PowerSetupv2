import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Unified stroke weight for catalog / wizard outline icons. */
export const ICON_STROKE = 1.75;

export type IconSvgProps = {
  className?: string;
};

export function IconSvg({ className, children }: IconSvgProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5 shrink-0", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}
