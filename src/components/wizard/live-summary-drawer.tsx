"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LiveSummary } from "@/components/wizard/live-summary";
import type { AlgorithmInput } from "@/lib/algorithm/types";
import { cn } from "@/lib/utils";

export interface LiveSummaryDrawerProps {
  step: number;
  input: AlgorithmInput;
}

export function LiveSummaryDrawer({ step, input }: LiveSummaryDrawerProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="dark"
          size="sm"
          className={cn(
            "fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 min-[1100px]:hidden",
            "rounded-full shadow-[var(--shadow-md)]",
          )}
        >
          Setup · Live
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/45 min-[1100px]:hidden" />
        <DialogPrimitive.Content
          className={cn(
            "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=closed]:animate-out",
            "fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border-1 bg-bg-1 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)] min-[1100px]:hidden",
            "duration-200 ease-[var(--ease-out)]",
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <DialogPrimitive.Title className="font-display text-lg font-semibold text-fg-1">
              Live-Übersicht
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Schließen">
                <X className="size-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            Zusammenfassung des Wizard-Setups und vorläufige Berechnung
          </DialogPrimitive.Description>
          <LiveSummary step={step} input={input} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
