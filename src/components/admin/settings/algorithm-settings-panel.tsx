"use client";

import type { AlgorithmSettings } from "@/generated/prisma/client";
import { loadAlgorithmSettingsAction, saveAlgorithmSettingsAction } from "@/app/admin/settings/actions";
import { AlgorithmFlowNarrative } from "@/components/admin/settings/algorithm-flow-narrative";
import { AlgorithmSettingsMatrixEditor } from "@/components/admin/settings/algorithm-settings-matrix-editor";
import { ALGORITHM_SETTINGS_GROUPS } from "@/components/admin/settings/algorithm-settings-groups";
import { CABLE_CURRENT_SAFETY_FACTOR } from "@/lib/algorithm/constants";
import type { AlgorithmMatrixFieldKey } from "@/lib/schemas/algorithm-settings-matrices";

const DEFAULT_AMBIENT_TEMP_C = 30;

function withCableAmpacityFormDefaults(data: Row): Row {
  return {
    ...data,
    cableCurrentSafetyFactor:
      typeof data.cableCurrentSafetyFactor === "number" && Number.isFinite(data.cableCurrentSafetyFactor)
        ? data.cableCurrentSafetyFactor
        : CABLE_CURRENT_SAFETY_FACTOR,
    ambientTempC:
      typeof data.ambientTempC === "number" && Number.isFinite(data.ambientTempC) ? data.ambientTempC : DEFAULT_AMBIENT_TEMP_C,
  };
}

function coalesceScalarForForm(key: string, raw: unknown, type: "float" | "int" | "string"): unknown {
  if (type === "string") return raw;
  if (key === "cableCurrentSafetyFactor") {
    if (raw === undefined || raw === null || (typeof raw === "number" && !Number.isFinite(raw))) {
      return CABLE_CURRENT_SAFETY_FACTOR;
    }
  }
  if (key === "ambientTempC") {
    if (raw === undefined || raw === null || (typeof raw === "number" && !Number.isFinite(raw))) {
      return DEFAULT_AMBIENT_TEMP_C;
    }
  }
  return raw;
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Row = AlgorithmSettings;

export function AlgorithmSettingsPanel() {
  const [settings, setSettings] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadAlgorithmSettingsAction();
      setSettings(withCableAmpacityFormDefaults(data));
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleChange = (key: string, value: string | number | object) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value } as Row);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const rest = { ...settings } as Record<string, unknown>;
      delete rest.id;
      delete rest.updatedAt;
      const patch = Object.fromEntries(Object.entries(rest)) as Record<string, unknown>;
      await saveAlgorithmSettingsAction(patch);
      setDirty(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 flex flex-col gap-3 rounded-xl border border-border/80 bg-card/95 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-medium text-foreground">Berechnungsparameter</h3>
          <p className="text-sm text-muted-foreground">Werte für die algorithmische Komponentenberechnung.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={saving}>
            <RotateCcw className="size-4" aria-hidden />
            Zurücksetzen
          </Button>
          <Button type="button" size="sm" onClick={() => void handleSave()} disabled={saving || !dirty}>
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
            Speichern
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle>Recommendation Engine</CardTitle>
          <CardDescription>Produktauswahl und Begründungstexte.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 pt-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium">Produktauswahl</p>
            <div className="space-y-2">
              {(
                [
                  { v: "algorithm", label: "Rein algorithmisch" },
                  { v: "hybrid", label: "Hybrid (KI + Algorithmus)" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.v}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/80 p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="productSelectionMode"
                    value={opt.v}
                    checked={settings.productSelectionMode === opt.v}
                    onChange={() => handleChange("productSelectionMode", opt.v)}
                    className="mt-1"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Begründungstexte</p>
            <div className="space-y-2">
              {(
                [
                  { v: "algorithm", label: "Templates (schnell)" },
                  { v: "ai", label: "KI-generiert" },
                  { v: "none", label: "Keine Begründung" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.v}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/80 p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="reasonGenerationMode"
                    value={opt.v}
                    checked={settings.reasonGenerationMode === opt.v}
                    onChange={() => handleChange("reasonGenerationMode", opt.v)}
                    className="mt-1"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {ALGORITHM_SETTINGS_GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-lg">{group.title}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
                {group.tooltip ? <p className="mt-2 text-xs text-muted-foreground">{group.tooltip}</p> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.fields.map((field) => {
                const stored = (settings as Record<string, unknown>)[field.key];
                const raw =
                  field.type === "matrix"
                    ? stored
                    : coalesceScalarForForm(field.key, stored, field.type);
                if (field.type === "matrix") {
                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <Label className="text-sm font-medium">{field.label}</Label>
                      <AlgorithmSettingsMatrixEditor
                        fieldKey={field.key as AlgorithmMatrixFieldKey}
                        value={raw}
                        onChange={(next) => handleChange(field.key, next as object)}
                      />
                    </div>
                  );
                }
                const value =
                  field.type === "string" ? String(raw ?? "") : raw === undefined || raw === null ? "" : String(raw);
                return (
                  <div key={field.key} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                    <Label className="sm:w-2/5 shrink-0 text-sm" htmlFor={`alg-${field.key}`}>
                      {field.label}
                    </Label>
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        id={`alg-${field.key}`}
                        type={field.type === "string" ? "text" : "number"}
                        step={field.type === "float" ? "0.01" : "1"}
                        value={value}
                        onChange={(e) => {
                          const v =
                            field.type === "string"
                              ? e.target.value
                              : field.type === "int"
                                ? Number.parseInt(e.target.value, 10) || 0
                                : Number.parseFloat(e.target.value) || 0;
                          handleChange(field.key, v);
                        }}
                      />
                      {field.suffix ? <span className="text-sm text-muted-foreground">{field.suffix}</span> : null}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <AlgorithmFlowNarrative settings={settings} onFieldChange={handleChange} />
    </div>
  );
}
