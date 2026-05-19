"use client";

import { cn } from "@/lib/utils";
import { ICON_PICKER_GROUPS, resolveIcon } from "@/lib/icons/registry";
import type { IconKey } from "@/lib/icons/icon-keys";
import { isIconKey } from "@/lib/icons/icon-keys";
import { normalizeIconKey } from "@/lib/icons/normalize-icon-key";

export type IconPickerProps = {
  value: string | null;
  onChange: (key: IconKey | null) => void;
  className?: string;
  id?: string;
};

export function IconPicker({ value, onChange, className, id }: IconPickerProps) {
  const selected = normalizeIconKey(value);

  return (
    <div id={id} className={cn("space-y-4", className)} role="listbox" aria-label="Icon auswählen">
      {ICON_PICKER_GROUPS.map((group) => (
        <div key={group.label} className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {group.keys.map((key) => {
              const active = selected === key;
              const Icon = resolveIcon(key);
              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={active}
                  title={key}
                  onClick={() => onChange(active ? null : key)}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl border transition-colors",
                    active
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/80 bg-muted/40 text-muted-foreground hover:border-primary/45 hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {value && !isIconKey(value) && !selected ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {`Gespeicherter Wert "${value}" ist kein gültiger Icon-Key — bitte neu wählen.`}
        </p>
      ) : null}
    </div>
  );
}
