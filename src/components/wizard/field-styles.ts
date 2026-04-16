import { cn } from "@/lib/utils";

/** Einheitliche native Felder (kein shadcn-Input im Projekt). */
export function inputClassName(className?: string) {
  return cn(
    "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors",
    "placeholder:text-muted-foreground",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "disabled:cursor-not-allowed disabled:opacity-50",
    className,
  );
}

export function labelClassName(className?: string) {
  return cn("mb-1.5 block text-sm font-medium text-foreground", className);
}
