import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn(
        "size-4 shrink-0 animate-spin text-amber-500 motion-reduce:animate-none",
        className,
      )}
      aria-hidden
    />
  );
}

export function LoadingIndicator({
  className,
  label = "Lädt …",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn("flex flex-col items-center justify-center gap-4 py-10", className)}
    >
      <span className="sr-only">{label}</span>
      <div className="flex items-center justify-center motion-reduce:hidden">
        <Loader2 className="size-14 shrink-0 animate-spin text-amber-500" aria-hidden />
      </div>
      <div className="hidden flex-col items-center gap-2 motion-reduce:flex">
        <Loader2 className="size-12 shrink-0 text-amber-500" aria-hidden />
        <p className="text-sm text-fg-2">{label}</p>
      </div>
    </div>
  );
}
