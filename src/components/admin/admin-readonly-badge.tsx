import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminReadonlyBadgeProps = {
  children: ReactNode;
  variant?: "active" | "inactive" | "neutral" | "category";
};

export function AdminReadonlyBadge({ children, variant = "neutral" }: AdminReadonlyBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "active" && "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100",
        variant === "inactive" && "bg-muted text-muted-foreground",
        variant === "neutral" && "bg-primary/10 text-foreground",
        variant === "category" && "bg-sky-500/15 text-sky-950 dark:text-sky-100",
      )}
    >
      {children}
    </span>
  );
}
