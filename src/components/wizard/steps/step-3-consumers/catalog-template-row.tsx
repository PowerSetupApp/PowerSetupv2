import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WizardConsumerTemplate } from "@/lib/db/queries/wizard-consumer-templates";
import { cn } from "@/lib/utils";

import { DeviceIconSlot } from "./device-icon-slot";

type CatalogTemplateRowProps = {
  template: WizardConsumerTemplate;
  addedCount: number;
  onAdd: (t: WizardConsumerTemplate) => void;
};

export function CatalogTemplateRow({ template, onAdd, addedCount }: CatalogTemplateRowProps) {
  const listLabel =
    addedCount === 0
      ? "Noch nicht in deiner Verbraucherliste"
      : addedCount === 1
        ? "Einmal in deiner Verbraucherliste"
        : `${addedCount}× in deiner Verbraucherliste`;

  return (
    <div
      className={cn(
        "flex min-h-12 items-center gap-1.5 py-2.5 pl-0.5 pr-0.5 sm:gap-2.5 sm:pl-1 sm:pr-1",
        addedCount > 0 && "bg-primary/[0.06] dark:bg-primary/[0.09]",
      )}
    >
      <DeviceIconSlot icon={template.deviceIcon} active={addedCount > 0} />
      <div className="min-w-0 flex-1 pr-0.5 sm:pr-1">
        <p className="line-clamp-2 font-medium leading-snug text-foreground">{template.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="text-muted-foreground">~{template.defaultPower} W</span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-semibold tabular-nums ring-1 ring-inset",
              addedCount > 0
                ? "bg-primary/15 text-primary ring-primary/25"
                : "bg-muted/40 text-muted-foreground ring-border/50",
            )}
            title={listLabel}
          >
            {addedCount}×
          </span>
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-11 min-h-11 shrink-0 rounded-xl px-4 max-[550px]:size-11 max-[550px]:min-w-11 max-[550px]:p-0"
        onClick={() => onAdd(template)}
        aria-label={`${template.name} hinzufügen (${listLabel})`}
      >
        <Plus className="size-5 min-[551px]:hidden" aria-hidden />
        <span className="hidden min-[551px]:inline">Hinzufügen</span>
      </Button>
    </div>
  );
}
