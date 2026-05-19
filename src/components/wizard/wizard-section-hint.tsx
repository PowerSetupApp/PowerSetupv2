"use client";

import * as React from "react";
import { CircleHelp } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type WizardSectionHintProps = {
  /** Kurze Beschreibung für Screenreader, z. B. „Hinweis zur Systemspannung“ */
  ariaLabel: string;
  children: React.ReactNode;
  /** Zusätzliche Klassen für das Popover-Panel (z. B. Akzent wie beim Batterie-Hinweis) */
  panelClassName?: string;
};

export function WizardSectionHint({ ariaLabel, children, panelClassName }: WizardSectionHintProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "-mb-0.5 inline-flex shrink-0 rounded-full p-0.5 text-fg-3 outline-none transition-colors",
            "hover:text-fg-2",
            "focus-visible:ring-2 focus-visible:ring-amber-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-1",
          )}
          aria-label={ariaLabel}
        >
          <CircleHelp className="size-[1.05rem] shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className={cn(panelClassName)}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
