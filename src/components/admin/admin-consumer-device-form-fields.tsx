"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPicker } from "@/components/ui/icon-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/ui/simple-select";
import type { IconKey } from "@/lib/icons/icon-keys";

import type { AdminConsumerDeviceFormState } from "./use-admin-consumer-device-form";

type Props = {
  form: AdminConsumerDeviceFormState;
  categories: { id: string; name: string }[];
};

export function AdminConsumerDeviceFormFields({ form, categories }: Props) {
  const { state: f, update, keywordsText, setKeywordsText } = form;

  return (
    <>
      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Basisdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="d-name">Name</Label>
              <Input id="d-name" value={f.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-cat">Kategorie</Label>
              <SimpleSelect
                id="d-cat"
                value={f.categoryId}
                onValueChange={(v) => update("categoryId", v)}
                emptyOptionLabel="Bitte wählen…"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                triggerClassName="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label id="d-icon-label">Icon</Label>
            <IconPicker id="d-icon" value={f.icon} onChange={(key: IconKey | null) => update("icon", key)} />
          </div>
          <div className="space-y-2 max-w-xs">
              <Label htmlFor="d-sort">Sortierung</Label>
              <Input
                id="d-sort"
                type="number"
                value={String(f.sortOrder)}
                onChange={(e) => update("sortOrder", Number.parseInt(e.target.value || "0", 10) || 0)}
                inputMode="numeric"
              />
            </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Standardwerte</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="d-power">Leistung (W)</Label>
            <Input
              id="d-power"
              type="number"
              min={1}
              value={String(f.defaultPower)}
              onChange={(e) => update("defaultPower", Number.parseInt(e.target.value || "0", 10) || 0)}
            />
          </div>
            <div className="space-y-2">
              <Label htmlFor="d-volt">Spannung</Label>
              <SimpleSelect
                id="d-volt"
                value={f.defaultVoltage}
                onValueChange={(v) => update("defaultVoltage", v)}
                options={[
                  { value: "12V", label: "12V" },
                  { value: "230V", label: "230V" },
                  { value: "user", label: "Benutzerauswahl" },
                ]}
                triggerClassName="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              />
            </div>
          <div className="space-y-2">
            <Label htmlFor="d-hours">Std./Tag</Label>
            <Input
              id="d-hours"
              type="number"
              step="0.25"
              value={String(f.defaultHoursPerDay)}
              onChange={(e) => update("defaultHoursPerDay", Number.parseFloat(e.target.value || "0") || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-step">Schrittweite (Std.)</Label>
            <Input
              id="d-step"
              type="number"
              step="0.25"
              min="0.1"
              value={String(f.stepHours)}
              onChange={(e) => update("stepHours", Number.parseFloat(e.target.value || "0.5") || 0.5)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="d-avg">Durchschnittliche Leistung (% der Nennleistung)</Label>
            <Input
              id="d-avg"
              type="number"
              min={1}
              max={100}
              step={1}
              placeholder="leer = 100 % (voller Nennwert)"
              value={f.averageLoadPercent === null ? "" : String(f.averageLoadPercent)}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (raw === "") {
                  update("averageLoadPercent", null);
                  return;
                }
                const n = Number.parseInt(raw, 10);
                if (!Number.isFinite(n)) {
                  update("averageLoadPercent", null);
                  return;
                }
                const clamped = Math.min(100, Math.max(1, n));
                update("averageLoadPercent", clamped);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Beispiel: Induktionskochfeld mit 3000 W Max-Leistung, aber typisch nur 1000 W Dauerlast → 33. Der
              Wizard rechnet damit den Tagesverbrauch (Wh), während die volle Nennleistung weiterhin für die
              Wechselrichter-Peakdimensionierung zählt.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="d-keywords">Keywords (kommagetrennt)</Label>
            <Input
              id="d-keywords"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="z. B. kompressor, kuehlung"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Optionen</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Toggle id="d-active" label="Aktiv" checked={f.isActive} onChange={(v) => update("isActive", v)} />
          <Toggle id="d-feat" label="Featured" checked={f.isFeatured} onChange={(v) => update("isFeatured", v)} />
          <Toggle
            id="d-hrs"
            label="Stunden-Feld anzeigen"
            checked={f.showHoursField}
            onChange={(v) => update("showHoursField", v)}
          />
          <Toggle
            id="d-fix"
            label="„Fest verbaut“ Option"
            checked={f.showFixedOption}
            onChange={(v) => update("showFixedOption", v)}
          />
          <Toggle id="d-cool" label="Kühlgerät" checked={f.isCooling} onChange={(v) => update("isCooling", v)} />
        </CardContent>
      </Card>
    </>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-border/60 px-3 py-2 text-sm"
    >
      <span>{label}</span>
      <input
        id={id}
        type="checkbox"
        className="size-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
