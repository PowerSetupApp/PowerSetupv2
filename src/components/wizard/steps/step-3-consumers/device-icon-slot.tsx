import { cn } from "@/lib/utils";
import { normalizeIconKeyOrFallback } from "@/lib/icons/normalize-icon-key";
import { iconRegistry } from "@/lib/icons/registry";

type DeviceIconSlotProps = {
  icon?: string | null;
  className?: string;
  /** Highlight tile (e.g. category header, selected row). */
  active?: boolean;
  /** Decorative slot when no DB icon */
  "aria-hidden"?: boolean;
};

export function DeviceIconSlot({ icon, className, active = false, ...rest }: DeviceIconSlotProps) {
  const key = normalizeIconKeyOrFallback(icon);
  const Icon = iconRegistry[key];

  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl",
        active
          ? "bg-primary/15 text-primary ring-1 ring-primary/20"
          : "bg-muted/50 text-muted-foreground",
        className,
      )}
      aria-hidden={rest["aria-hidden"] ?? true}
    >
      <Icon className="size-5" />
    </span>
  );
}
