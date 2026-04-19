import { PlugZap } from "lucide-react";

import { cn } from "@/lib/utils";

type DeviceIconSlotProps = {
  icon?: string | null;
  className?: string;
  /** Decorative slot when no DB icon */
  "aria-hidden"?: boolean;
};

export function DeviceIconSlot({ icon, className, ...rest }: DeviceIconSlotProps) {
  const trimmed = icon?.trim();
  if (trimmed) {
    return (
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-xl leading-none",
          className,
        )}
        aria-hidden={rest["aria-hidden"] ?? true}
      >
        {trimmed}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground",
        className,
      )}
      aria-hidden={rest["aria-hidden"] ?? true}
    >
      <PlugZap className="size-5" />
    </span>
  );
}
