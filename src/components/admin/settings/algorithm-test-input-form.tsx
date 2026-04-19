"use client";

import { Plus, Trash2 } from "lucide-react";

import { CABLE_FIELD_META } from "@/components/wizard/steps/step-6-cables/cable-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/ui/simple-select";
import type {
  AlgorithmInput,
  Consumer,
  EnergySource,
  RoofArea,
  SolarBag,
} from "@/lib/algorithm/types";

const ENERGY_OPTIONS: { value: EnergySource; label: string }[] = [
  { value: "solar", label: "Solar" },
  { value: "alternator", label: "Lichtmaschine / Booster" },
  { value: "shore_power", label: "Landstrom" },
];

function toggleEnergySource(list: EnergySource[], src: EnergySource): EnergySource[] {
  return list.includes(src) ? list.filter((s) => s !== src) : [...list, src];
}

function newRoofArea(index: number): RoofArea {
  return {
    id: `roof-${crypto.randomUUID().slice(0, 8)}`,
    name: `Dachfläche ${index + 1}`,
    length: 200,
    width: 120,
  };
}

function newSolarBag(): SolarBag {
  return {
    id: `bag-${crypto.randomUUID().slice(0, 8)}`,
    power: 200,
  };
}

function newConsumer(systemVoltage: AlgorithmInput["systemVoltage"]): Consumer {
  return {
    id: `c-${crypto.randomUUID()}`,
    name: "Neuer Verbraucher",
    power: 50,
    daily: 2,
    voltage: systemVoltage,
  };
}

export type AlgorithmTestInputFormProps = {
  value: AlgorithmInput;
  onChange: (next: AlgorithmInput) => void;
  disabled?: boolean;
};

export function AlgorithmTestInputForm({ value, onChange, disabled }: AlgorithmTestInputFormProps) {
  const patch = (partial: Partial<AlgorithmInput>) => onChange({ ...value, ...partial });

  const patchTravel = (partial: Partial<AlgorithmInput["travelBehavior"]>) =>
    onChange({ ...value, travelBehavior: { ...value.travelBehavior, ...partial } });

  const patchCables = (key: keyof AlgorithmInput["cableLengths"], n: number) =>
    onChange({
      ...value,
      cableLengths: { ...value.cableLengths, [key]: n },
    });

  const patchBrands = (key: keyof AlgorithmInput["brandPreferences"], v: string | null) =>
    onChange({
      ...value,
      brandPreferences: { ...value.brandPreferences, [key]: v },
    });

  const patchOverride = (key: keyof AlgorithmInput["customOverrides"], n: number | null) =>
    onChange({
      ...value,
      customOverrides: { ...value.customOverrides, [key]: n },
    });

  const updateRoof = (index: number, partial: Partial<RoofArea>) => {
    const roofAreas = value.roofAreas.map((r, i) => (i === index ? { ...r, ...partial } : r));
    onChange({ ...value, roofAreas });
  };

  const removeRoof = (index: number) => {
    onChange({ ...value, roofAreas: value.roofAreas.filter((_, i) => i !== index) });
  };

  const updateBag = (index: number, partial: Partial<SolarBag>) => {
    const solarBags = value.solarBags.map((b, i) => (i === index ? { ...b, ...partial } : b));
    onChange({ ...value, solarBags });
  };

  const removeBag = (index: number) => {
    onChange({ ...value, solarBags: value.solarBags.filter((_, i) => i !== index) });
  };

  const updateConsumer = (index: number, partial: Partial<Consumer>) => {
    const consumers = value.consumers.map((c, i) => (i === index ? { ...c, ...partial } : c));
    onChange({ ...value, consumers });
  };

  const removeConsumer = (index: number) => {
    onChange({ ...value, consumers: value.consumers.filter((_, i) => i !== index) });
  };

  const cableKeys = Object.keys(CABLE_FIELD_META) as (keyof typeof CABLE_FIELD_META)[];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">System &amp; Batterie</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="at-system-v">Bordnetz (V)</Label>
            <SimpleSelect
              id="at-system-v"
              value={String(value.systemVoltage)}
              onValueChange={(v) => patch({ systemVoltage: Number(v) as AlgorithmInput["systemVoltage"] })}
              options={[
                { value: "12", label: "12 V" },
                { value: "24", label: "24 V" },
                { value: "48", label: "48 V" },
              ]}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="at-vehicle-v">Starterbatterie (V)</Label>
            <SimpleSelect
              id="at-vehicle-v"
              value={String(value.vehicleVoltage)}
              onValueChange={(v) => patch({ vehicleVoltage: Number(v) as AlgorithmInput["vehicleVoltage"] })}
              options={[
                { value: "12", label: "12 V" },
                { value: "24", label: "24 V" },
                { value: "48", label: "48 V" },
              ]}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="at-battery-pref">Batterietechnologie</Label>
            <SimpleSelect
              id="at-battery-pref"
              value={value.batteryPreference}
              onValueChange={(v) =>
                patch({ batteryPreference: v as AlgorithmInput["batteryPreference"] })
              }
              options={[
                { value: "lifepo4", label: "LiFePO₄" },
                { value: "agm", label: "AGM" },
                { value: "gel", label: "Gel" },
              ]}
              disabled={disabled}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Energiequellen</h3>
        <div className="flex flex-wrap gap-4">
          {ENERGY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input accent-primary"
                checked={value.energySources.includes(opt.value)}
                disabled={disabled}
                onChange={() => patch({ energySources: toggleEnergySource(value.energySources, opt.value) })}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="at-roof-mod">Modultyp (Dach)</Label>
            <SimpleSelect
              id="at-roof-mod"
              value={value.roofModuleType}
              onValueChange={(v) => patch({ roofModuleType: v as AlgorithmInput["roofModuleType"] })}
              options={[
                { value: "rigid", label: "Starr" },
                { value: "flexible", label: "Flexibel" },
              ]}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="at-charger-speed">Landstrom-Ladegeschwindigkeit</Label>
            <SimpleSelect
              id="at-charger-speed"
              value={value.chargerSpeed}
              onValueChange={(v) => patch({ chargerSpeed: v as AlgorithmInput["chargerSpeed"] })}
              options={[
                { value: "slow", label: "Langsam" },
                { value: "normal", label: "Normal" },
                { value: "fast", label: "Schnell" },
              ]}
              disabled={disabled}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Dachflächen (cm)</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onChange({ ...value, roofAreas: [...value.roofAreas, newRoofArea(value.roofAreas.length)] })}
          >
            <Plus className="size-4" aria-hidden />
            Fläche hinzufügen
          </Button>
        </div>
        {value.roofAreas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Dachflächen — bei Solar ggf. eine hinzufügen.</p>
        ) : (
          <div className="space-y-3">
            {value.roofAreas.map((r, i) => (
              <div
                key={r.id}
                className="grid gap-3 rounded-lg border border-border/70 bg-muted/10 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
              >
                <div className="space-y-2">
                  <Label htmlFor={`at-roof-name-${i}`}>Name</Label>
                  <Input
                    id={`at-roof-name-${i}`}
                    value={r.name}
                    disabled={disabled}
                    onChange={(e) => updateRoof(i, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`at-roof-l-${i}`}>Länge (cm)</Label>
                  <Input
                    id={`at-roof-l-${i}`}
                    type="number"
                    min={1}
                    disabled={disabled}
                    value={r.length}
                    onChange={(e) => updateRoof(i, { length: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`at-roof-w-${i}`}>Breite (cm)</Label>
                  <Input
                    id={`at-roof-w-${i}`}
                    type="number"
                    min={1}
                    disabled={disabled}
                    value={r.width}
                    onChange={(e) => updateRoof(i, { width: Number(e.target.value) || 0 })}
                  />
                </div>
                <Button type="button" size="icon" variant="ghost" disabled={disabled} onClick={() => removeRoof(i)}>
                  <Trash2 className="size-4" aria-hidden />
                  <span className="sr-only">Fläche entfernen</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Mobile Solartaschen (W)</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onChange({ ...value, solarBags: [...value.solarBags, newSolarBag()] })}
          >
            <Plus className="size-4" aria-hidden />
            Tasche hinzufügen
          </Button>
        </div>
        {value.solarBags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Solartaschen.</p>
        ) : (
          <div className="space-y-3">
            {value.solarBags.map((b, i) => (
              <div
                key={b.id}
                className="flex flex-wrap items-end gap-3 rounded-lg border border-border/70 bg-muted/10 p-3"
              >
                <div className="min-w-[140px] flex-1 space-y-2">
                  <Label htmlFor={`at-bag-p-${i}`}>Leistung (W)</Label>
                  <Input
                    id={`at-bag-p-${i}`}
                    type="number"
                    min={1}
                    disabled={disabled}
                    value={b.power}
                    onChange={(e) => updateBag(i, { power: Number(e.target.value) || 0 })}
                  />
                </div>
                <Button type="button" size="icon" variant="ghost" disabled={disabled} onClick={() => removeBag(i)}>
                  <Trash2 className="size-4" aria-hidden />
                  <span className="sr-only">Tasche entfernen</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Verbraucher</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onChange({ ...value, consumers: [...value.consumers, newConsumer(value.systemVoltage)] })}
          >
            <Plus className="size-4" aria-hidden />
            Verbraucher hinzufügen
          </Button>
        </div>
        {value.consumers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Verbraucher — mindestens einen anlegen für realistische Last.</p>
        ) : (
          <div className="space-y-4">
            {value.consumers.map((c, i) => (
              <div key={c.id} className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`at-c-name-${i}`}>Bezeichnung</Label>
                    <Input
                      id={`at-c-name-${i}`}
                      value={c.name}
                      disabled={disabled}
                      onChange={(e) => updateConsumer(i, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`at-c-pow-${i}`}>Leistung (W)</Label>
                    <Input
                      id={`at-c-pow-${i}`}
                      type="number"
                      min={1}
                      disabled={disabled}
                      value={c.power}
                      onChange={(e) => updateConsumer(i, { power: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`at-c-daily-${i}`}>h / Tag</Label>
                    <Input
                      id={`at-c-daily-${i}`}
                      type="number"
                      min={0}
                      step={0.5}
                      disabled={disabled}
                      value={c.daily}
                      onChange={(e) => updateConsumer(i, { daily: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`at-c-v-${i}`}>Spannung</Label>
                    <SimpleSelect
                      id={`at-c-v-${i}`}
                      value={String(c.voltage)}
                      onValueChange={(v) =>
                        updateConsumer(i, { voltage: Number(v) as Consumer["voltage"] })
                      }
                      options={[
                        { value: "12", label: "12 V DC" },
                        { value: "24", label: "24 V DC" },
                        { value: "48", label: "48 V DC" },
                        { value: "230", label: "230 V AC" },
                      ]}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`at-c-cool-${i}`}>Kühlung (optional)</Label>
                    <SimpleSelect
                      id={`at-c-cool-${i}`}
                      value={c.coolingMethod ?? ""}
                      onValueChange={(v) =>
                        updateConsumer(i, {
                          coolingMethod: v === "" ? undefined : (v as NonNullable<Consumer["coolingMethod"]>),
                        })
                      }
                      emptyOptionLabel="—"
                      options={[
                        { value: "compressor", label: "Kompressor" },
                        { value: "absorber", label: "Absorber" },
                      ]}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`at-c-avg-${i}`}>Ø-Last % (optional, 1–100)</Label>
                    <Input
                      id={`at-c-avg-${i}`}
                      type="number"
                      min={1}
                      max={100}
                      disabled={disabled}
                      value={c.averageLoadPercent ?? ""}
                      placeholder="100"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") updateConsumer(i, { averageLoadPercent: undefined });
                        else updateConsumer(i, { averageLoadPercent: Math.round(Number(raw)) || undefined });
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => removeConsumer(i)}>
                    <Trash2 className="size-4" aria-hidden />
                    Entfernen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Gleichzeitige 230-V-Last</h3>
        <SimpleSelect
          id="at-sim-load"
          value={value.simultaneousLoad}
          onValueChange={(v) => patch({ simultaneousLoad: v as AlgorithmInput["simultaneousLoad"] })}
          options={[
            { value: "low", label: "Niedrig" },
            { value: "moderate", label: "Mittel" },
            { value: "high", label: "Hoch" },
          ]}
          disabled={disabled}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Reiseverhalten</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="at-season">Saison</Label>
            <SimpleSelect
              id="at-season"
              value={value.travelBehavior.season}
              onValueChange={(v) => patchTravel({ season: v as AlgorithmInput["travelBehavior"]["season"] })}
              options={[
                { value: "summer", label: "Sommer" },
                { value: "all_year", label: "Ganzjährig" },
                { value: "winter", label: "Winter" },
              ]}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="at-trip">Typische Reisedauer</Label>
            <SimpleSelect
              id="at-trip"
              value={value.travelBehavior.tripDuration}
              onValueChange={(v) =>
                patchTravel({ tripDuration: v as AlgorithmInput["travelBehavior"]["tripDuration"] })
              }
              options={[
                { value: "weekend", label: "Wochenende" },
                { value: "week", label: "Woche" },
                { value: "extended", label: "Länger" },
                { value: "permanent", label: "Dauerhaft" },
              ]}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="at-winter-loc">Winter-Region</Label>
            <SimpleSelect
              id="at-winter-loc"
              value={value.travelBehavior.winterLocation}
              onValueChange={(v) =>
                patchTravel({ winterLocation: v as AlgorithmInput["travelBehavior"]["winterLocation"] })
              }
              options={[
                { value: "scandinavia", label: "Skandinavien" },
                { value: "germany", label: "DE / Alpen" },
                { value: "southern", label: "Südeuropa" },
                { value: "eastern", label: "Osteuropa" },
                { value: "varies", label: "Wechselnd" },
              ]}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="at-stand">Standzeit ohne Fahren</Label>
            <SimpleSelect
              id="at-stand"
              value={value.travelBehavior.standingDuration}
              onValueChange={(v) =>
                patchTravel({ standingDuration: v as AlgorithmInput["travelBehavior"]["standingDuration"] })
              }
              options={[
                { value: "short", label: "Kurz" },
                { value: "medium", label: "Mittel" },
                { value: "long", label: "Lang" },
              ]}
              disabled={disabled}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Autarkie-Ziel (Tage, 1–999)</h3>
        <Input
          id="at-autarchy"
          type="number"
          min={1}
          max={999}
          className="max-w-xs"
          disabled={disabled}
          value={value.autarchyDays}
          onChange={(e) => patch({ autarchyDays: Math.min(999, Math.max(1, Math.round(Number(e.target.value) || 1))) })}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Kabellängen (m)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {cableKeys.map((key) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`at-cable-${key}`}>{CABLE_FIELD_META[key].label}</Label>
              <Input
                id={`at-cable-${key}`}
                type="number"
                min={0}
                step={0.1}
                disabled={disabled}
                value={value.cableLengths[key]}
                onChange={(e) => patchCables(key, Number(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Marken-Präferenzen (IDs, optional)</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["charger", "Ladegerät / Booster"],
              ["battery", "Batterie"],
              ["solar", "Solar"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`at-brand-${key}`}>{label}</Label>
              <Input
                id={`at-brand-${key}`}
                value={value.brandPreferences[key] ?? ""}
                disabled={disabled}
                placeholder="leer = keine Präferenz"
                onChange={(e) => patchBrands(key, e.target.value === "" ? null : e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Manuelle Overrides (leer = automatisch)</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["battery", "Batterie (Ah)"],
              ["solar", "Solar (Wp)"],
              ["booster", "Booster (A)"],
              ["controller", "Solarregler (A)"],
              ["inverter", "Wechselrichter (W)"],
              ["charger", "Landstrom-Lader (A)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`at-ov-${key}`}>{label}</Label>
              <Input
                id={`at-ov-${key}`}
                type="number"
                min={0}
                disabled={disabled}
                value={value.customOverrides[key] ?? ""}
                placeholder="auto"
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") patchOverride(key, null);
                  else {
                    const n = Number(raw);
                    patchOverride(key, Number.isFinite(n) ? n : null);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
