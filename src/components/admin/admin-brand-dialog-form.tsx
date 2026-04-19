"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  adminCatalogCreateBrandAction,
  adminCatalogUpdateBrandAction,
} from "@/lib/admin/catalog-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const BRAND_TYPE_OPTIONS = [
  { value: "CHARGER", label: "Ladeelektronik" },
  { value: "BATTERY", label: "Batterien" },
  { value: "SOLAR", label: "Solarmodule" },
] as const;

type Props = {
  mode: "create" | "update";
  initial: {
    id?: string;
    name: string;
    types: string[];
    isActive: boolean;
    showInPreferences: boolean;
  };
  onDone: () => void;
};

export function AdminBrandDialogForm({ mode, initial, onDone }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [types, setTypes] = useState<string[]>(initial.types);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [showInPreferences, setShowInPreferences] = useState(initial.showInPreferences);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleType(value: string) {
    setTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function submit() {
    setError(null);
    const payload = { name: name.trim(), types, isActive, showInPreferences };
    startTransition(async () => {
      if (mode === "create") {
        const res = await adminCatalogCreateBrandAction(payload);
        if (!res.ok) {
          setError(res.message);
          return;
        }
      } else {
        if (!initial.id) return;
        const res = await adminCatalogUpdateBrandAction({ id: initial.id, ...payload });
        if (!res.ok) {
          setError(res.message);
          return;
        }
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="b-name">Name</Label>
        <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Victron Energy" />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Typen</legend>
        {BRAND_TYPE_OPTIONS.map((t) => (
          <label key={t.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border"
              checked={types.includes(t.value)}
              onChange={() => toggleType(t.value)}
            />
            {t.label}
          </label>
        ))}
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border"
          checked={showInPreferences}
          onChange={(e) => setShowInPreferences(e.target.checked)}
        />
        Im Wizard anzeigen
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Aktiv
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Abbrechen
        </Button>
        <Button type="button" disabled={pending} onClick={() => submit()}>
          {pending ? "Speichern…" : mode === "create" ? "Erstellen" : "Speichern"}
        </Button>
      </div>
    </div>
  );
}
