"use client";

import type { AlgorithmSettings } from "@/generated/prisma/client";
import { ALGORITHM_SETTINGS_GROUPS } from "@/components/admin/settings/algorithm-settings-groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Cable, Settings2, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";

const highlightClass =
  "inline-flex max-w-[min(100%,28rem)] cursor-pointer items-center break-all border border-blue-200 bg-blue-100 px-1.5 py-0.5 align-baseline text-sm font-semibold text-blue-700 transition-colors [overflow-wrap:anywhere] rounded-md hover:bg-blue-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:outline-none dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800";

type OnFieldChange = (key: string, value: string | number | object) => void;

type FlowInputKind = "int" | "float" | "string" | "json";

const PRODUCT_MODE_LABEL: Record<string, string> = {
  algorithm: "Rein algorithmisch",
  hybrid: "Hybrid (KI + Algorithmus)",
};

const REASON_MODE_LABEL: Record<string, string> = {
  algorithm: "Templates (schnell)",
  ai: "KI-generiert",
  none: "Keine Begründung",
};

function num(settings: AlgorithmSettings, key: string): number {
  const v = (settings as Record<string, unknown>)[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function str(settings: AlgorithmSettings, key: string): string {
  const v = (settings as Record<string, unknown>)[key];
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function FlowEdit({
  fieldKey,
  dialogTitle,
  inputKind,
  displayText,
  settings,
  getDraft,
  parseCommit,
  onApply,
}: {
  fieldKey: string;
  dialogTitle: string;
  inputKind: FlowInputKind;
  displayText: string;
  settings: AlgorithmSettings;
  getDraft: (s: AlgorithmSettings) => string;
  parseCommit: (draft: string) => string | number | object | null;
  onApply: OnFieldChange;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const openDialog = useCallback(() => {
    setDraft(getDraft(settings));
    setError(null);
    setOpen(true);
  }, [getDraft, settings]);

  const commit = useCallback(() => {
    const v = parseCommit(draft.trim());
    if (v === null) {
      setError("Ungültiger Wert");
      return;
    }
    onApply(fieldKey, v);
    setOpen(false);
  }, [draft, fieldKey, onApply, parseCommit]);

  return (
    <>
      <button type="button" className={highlightClass} title="Klicken zum Bearbeiten" onClick={openDialog}>
        {displayText}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>Wert wird sofort im Formular übernommen (Speichern nicht vergessen).</DialogDescription>
          </DialogHeader>
          {inputKind === "string" || inputKind === "json" ? (
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={inputKind === "json" ? 10 : 5} className="font-mono text-sm" />
          ) : (
            <Input
              type="text"
              inputMode={inputKind === "int" ? "numeric" : "decimal"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoComplete="off"
            />
          )}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="button" onClick={() => void commit()}>
              Übernehmen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ModeFlowEdit({
  modeKey,
  label,
  options,
  optionLabels,
  settings,
  onApply,
}: {
  modeKey: "productSelectionMode" | "reasonGenerationMode";
  label: string;
  options: readonly string[];
  optionLabels: Record<string, string>;
  settings: AlgorithmSettings;
  onApply: OnFieldChange;
}) {
  const [open, setOpen] = useState(false);
  const current = str(settings, modeKey);
  const display = optionLabels[current] ?? current;

  return (
    <>
      <button type="button" className={highlightClass} title="Klicken zum Bearbeiten" onClick={() => setOpen(true)}>
        {display}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>Modus für die Recommendation Engine.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {options.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/80 p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name={modeKey}
                  value={opt}
                  checked={current === opt}
                  onChange={() => {
                    onApply(modeKey, opt);
                    setOpen(false);
                  }}
                  className="mt-1"
                />
                <span className="text-sm">{optionLabels[opt] ?? opt}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export type AlgorithmFlowNarrativeProps = {
  settings: AlgorithmSettings;
  onFieldChange: OnFieldChange;
};

/**
 * COVERAGE: every key from getAllAlgorithmFlowRequiredKeys() must appear exactly once below
 * (see algorithm-flow-coverage.test.ts). Keys: `FLOW_NARRATIVE_KEYS_USED` in algorithm-flow-coverage.ts
 */
export function AlgorithmFlowNarrative({ settings, onFieldChange }: AlgorithmFlowNarrativeProps) {
  const s = settings;
  const proseClass = "text-base leading-relaxed text-foreground";
  const sectionTitleClass = "mb-2 flex items-center gap-2 text-base font-semibold text-foreground";

  const fieldControl = (fieldKey: string, label: string, type: "float" | "int" | "string" | "matrix") => {
    if (type === "matrix" || type === "string") {
      const short = str(s, fieldKey);
      const display = short.length > 48 ? `${short.slice(0, 46)}…` : short || "—";
      return (
        <FlowEdit
          key={fieldKey}
          fieldKey={fieldKey}
          dialogTitle={label}
          inputKind={type === "matrix" ? "json" : "string"}
          displayText={display}
          settings={s}
          getDraft={(st) => str(st, fieldKey)}
          parseCommit={(d) => {
            if (type === "matrix") {
              try {
                return JSON.parse(d) as object;
              } catch {
                return null;
              }
            }
            return d;
          }}
          onApply={onFieldChange}
        />
      );
    }
    if (type === "int") {
      return (
        <FlowEdit
          key={fieldKey}
          fieldKey={fieldKey}
          dialogTitle={label}
          inputKind="int"
          displayText={`${Math.round(num(s, fieldKey))}`}
          settings={s}
          getDraft={(st) => String(Math.round(num(st, fieldKey)))}
          parseCommit={(d) => {
            const n = Number.parseInt(d, 10);
            return Number.isFinite(n) ? n : null;
          }}
          onApply={onFieldChange}
        />
      );
    }
    const isVoltage = fieldKey.startsWith("voltageDrop");
    const displayFn = (n: number) => (isVoltage ? `${n}%` : String(n));
    return (
      <FlowEdit
        key={fieldKey}
        fieldKey={fieldKey}
        dialogTitle={label}
        inputKind="float"
        displayText={displayFn(num(s, fieldKey))}
        settings={s}
        getDraft={(st) => String(num(st, fieldKey)).replace(",", ".")}
        parseCommit={(d) => {
          const n = Number.parseFloat(d.replace(",", "."));
          return Number.isFinite(n) ? n : null;
        }}
        onApply={onFieldChange}
      />
    );
  };

  return (
    <Card className="border-blue-200 bg-muted/40 dark:border-blue-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden>🤖</span>
          Algorithm-Check
        </CardTitle>
        <CardDescription>
          Jeder Wert erscheint genau einmal und ist klickbar (wie in den Karten oben — bitte danach speichern).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-base leading-relaxed">
        <div>
          <h4 className={sectionTitleClass}>
            <Settings2 className="size-4 shrink-0" aria-hidden />
            Berechnungsparameter (v2)
          </h4>
          <div className="space-y-3">
            {ALGORITHM_SETTINGS_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-sm font-semibold text-foreground">{group.title}</p>
                <p className="mb-2 text-sm text-muted-foreground">{group.description}</p>
                <ul className={`${proseClass} list-inside list-disc space-y-1`}>
                  {group.fields.map((f) => (
                    <li key={f.key}>
                      <span className="font-medium">{f.label}:</span> {fieldControl(f.key, f.label, f.type)}
                      {f.suffix ? <span className="text-muted-foreground"> {f.suffix}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className={sectionTitleClass}>
            <Cable className="size-4 shrink-0" aria-hidden />
            Kabel &amp; Komponentenlisten
          </h4>
          <p className={proseClass}>
            Die Querschnitte und Komponentenklassen werden aus den obigen Gruppen „Komponentenklassen“ gespeist —
            identisch zur Karten-Ansicht.
          </p>
        </div>

        <div>
          <h4 className={sectionTitleClass}>
            <Sparkles className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            Recommendation Engine
          </h4>
          <p className={`${proseClass} flex flex-wrap items-center gap-x-1 gap-y-1`}>
            <strong>Produktauswahl:</strong>{" "}
            <ModeFlowEdit
              modeKey="productSelectionMode"
              label="Produktauswahl"
              options={["algorithm", "hybrid"]}
              optionLabels={PRODUCT_MODE_LABEL}
              settings={s}
              onApply={onFieldChange}
            />
            . <strong>Begründungstexte:</strong>{" "}
            <ModeFlowEdit
              modeKey="reasonGenerationMode"
              label="Begründungstexte"
              options={["algorithm", "ai", "none"]}
              optionLabels={REASON_MODE_LABEL}
              settings={s}
              onApply={onFieldChange}
            />
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
