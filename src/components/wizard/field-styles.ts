import { cn } from "@/lib/utils";

/** Einheitliche native Felder (kein shadcn-Input im Projekt). */
export function inputClassName(className?: string) {
  return cn(
    "w-full rounded-xl border border-border/80 bg-card/80 px-3 py-2.5 text-base text-foreground shadow-sm outline-none transition-[border-color,box-shadow] duration-200 ease-out",
    "placeholder:text-muted-foreground",
    "hover:border-primary/30",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/45",
    "disabled:cursor-not-allowed disabled:opacity-50",
    className,
  );
}

export function labelClassName(className?: string) {
  return cn("mb-2 block text-sm font-semibold tracking-tight text-foreground", className);
}
