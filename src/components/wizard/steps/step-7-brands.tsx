"use client";

import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { wizardInsetPanel } from "@/components/wizard/wizard-surfaces";
import { useWizardStore } from "@/store/wizard";

const QUICK_BRANDS = [
  "Victron",
  "BattEnergy",
  "Renogy",
  "Offgridtec",
  "Büttner",
  "EcoFlow",
  "Keine Präferenz",
] as const;

export function Step7Brands() {
  const brandPreferences = useWizardStore((s) => s.input.brandPreferences);
  const setBrandPreferences = useWizardStore((s) => s.setBrandPreferences);

  const fillAll = (name: string | null) => {
    setBrandPreferences({
      solar: name,
      battery: name,
      charger: name,
      inverter: name,
    });
  };

  return (
    <div className="flex max-w-[var(--form-max)] flex-col gap-10">
      <div className={wizardInsetPanel("border border-border-1 bg-sand-50/80 text-sm text-fg-2 dark:bg-charcoal-600/40")}>
        Optional: Marken helfen später bei der Produktauswahl — leer lassen ist immer erlaubt.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BrandField
          eyebrow="Solar"
          value={brandPreferences.solar}
          onChange={(v) => setBrandPreferences({ solar: v })}
        />
        <BrandField
          eyebrow="Batterie"
          value={brandPreferences.battery}
          onChange={(v) => setBrandPreferences({ battery: v })}
        />
        <BrandField
          eyebrow="Lader / Booster"
          value={brandPreferences.charger}
          onChange={(v) => setBrandPreferences({ charger: v })}
        />
        <BrandField
          eyebrow="Wechselrichter"
          value={brandPreferences.inverter}
          onChange={(v) => setBrandPreferences({ inverter: v })}
        />
      </div>

      <div className="space-y-2">
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-fg-3">Schnellauswahl</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_BRANDS.map((b) => (
            <button
              key={b}
              type="button"
              className="rounded-full border-0 bg-transparent p-0"
              onClick={() => fillAll(b === "Keine Präferenz" ? null : b)}
            >
              <Chip tone="neutral" size="sm">
                {b}
              </Chip>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandField({
  eyebrow,
  value,
  onChange,
}: {
  eyebrow: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const filled = Boolean(value && value.trim().length > 0);
  return (
    <div>
      <p className="mb-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3">{eyebrow}</p>
      <Input
        className={filled ? "border-amber-200 bg-amber-50/60 dark:bg-amber-500/10" : undefined}
        value={value ?? ""}
        placeholder="(leer = egal)"
        onChange={(e) => onChange(e.target.value.trim() === "" ? null : e.target.value.trim())}
        hint={filled ? undefined : "Freitext oder Brand-ID"}
      />
    </div>
  );
}
