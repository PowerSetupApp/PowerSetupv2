"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, Copy, FlaskConical, Loader2, Play, Shuffle, Trash2 } from "lucide-react";

import { AlgorithmTestInputForm } from "@/components/admin/settings/algorithm-test-input-form";
import { AlgorithmTestPresetControls } from "@/components/admin/settings/algorithm-test-preset-controls";
import { AlgorithmTestRecommendationSection } from "@/components/admin/settings/algorithm-test-recommendation-section";
import { runAlgorithmTestAction } from "@/app/admin/settings/actions";
import type { AlgorithmTestRecommendationPreviewPayload } from "@/lib/admin/algorithm-test-recommendation-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_ALGORITHM_INPUT, type AlgorithmInput, type AlgorithmOutput } from "@/lib/algorithm/types";
import { randomizeAlgorithmTestFilters } from "@/lib/admin/algorithm-sandbox";
import { algorithmInputSchema } from "@/lib/schemas/wizard-input";

type RunItem = {
  id: string;
  at: string;
  output: AlgorithmOutput;
};

/** Letzter erfolgreicher Lauf — für Export (Chat / Review). */
type AlgorithmTestShareBundle = {
  wizardInput: AlgorithmInput;
  effectiveInput: AlgorithmInput;
  output: AlgorithmOutput;
  recommendationPreview: AlgorithmTestRecommendationPreviewPayload;
  runAtIso: string;
};

function cloneAlgorithmInput(input: AlgorithmInput): AlgorithmInput {
  return JSON.parse(JSON.stringify(input)) as AlgorithmInput;
}

export function AlgorithmTestPanel() {
  const [input, setInput] = useState<AlgorithmInput>(() => cloneAlgorithmInput(DEFAULT_ALGORITHM_INPUT));
  const [result, setResult] = useState<AlgorithmOutput | null>(null);
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RunItem[]>([]);
  const [pending, startTransition] = useTransition();
  const [hasDbSettings, setHasDbSettings] = useState(false);
  const [recommendationPreview, setRecommendationPreview] = useState<AlgorithmTestRecommendationPreviewPayload | null>(
    null,
  );
  const [lastShareBundle, setLastShareBundle] = useState<AlgorithmTestShareBundle | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const copyHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const summary = useMemo(() => {
    if (!result) return null;
    return [
      { label: "Batterie", value: `${result.battery.recommendedCapacityAh} Ah` },
      { label: "Solar", value: `${result.solar.requiredWp} Wp` },
      { label: "Wechselrichter", value: `${result.inverter.recommendedW} W` },
      { label: "Booster", value: `${result.booster.outputCurrentA} A` },
      { label: "Landstrom-Lader", value: `${result.charger.recommendedCurrentA} A` },
      { label: "Solarregler", value: `${result.controller.currentA} A` },
    ];
  }, [result]);

  useEffect(() => {
    return () => {
      if (copyHintTimer.current) clearTimeout(copyHintTimer.current);
    };
  }, []);

  const executeInput = async (wizardInput: AlgorithmInput) => {
    const res = await runAlgorithmTestAction(wizardInput);
    if (!res.ok) {
      setError(res.message);
      return;
    }

    const rawOutput = JSON.stringify(res.output, null, 2);
    setResult(res.output);
    setOutputText(rawOutput);
    setHasDbSettings(res.hasDbSettings);
    setRecommendationPreview(res.recommendationPreview);
    setLastShareBundle({
      wizardInput: cloneAlgorithmInput(wizardInput),
      effectiveInput: cloneAlgorithmInput(res.effectiveInput),
      output: res.output,
      recommendationPreview: res.recommendationPreview,
      runAtIso: new Date().toISOString(),
    });
    setHistory((prev) =>
      [{ id: crypto.randomUUID(), at: new Date().toLocaleTimeString("de-DE"), output: res.output }, ...prev].slice(0, 8),
    );
  };

  const copyShareJson = async () => {
    if (!lastShareBundle) return;
    const payload = {
      exportVersion: 2,
      context:
        "PowerSetup Admin — Algorithmus-Test: `wizardInput` = Formular nach Schema; `effectiveInput` = nach Merge mit AlgorithmSettings aus der DB; `output` = calculate()-Ergebnis; `recommendationPreview` = Zielwerte + Prefilter-Topliste (wie vor KI-Produktauswahl).",
      exportedAt: lastShareBundle.runAtIso,
      wizardInput: lastShareBundle.wizardInput,
      effectiveInput: lastShareBundle.effectiveInput,
      output: lastShareBundle.output,
      recommendationPreview: lastShareBundle.recommendationPreview,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopyHint("JSON in die Zwischenablage kopiert.");
    } catch {
      setCopyHint("Kopieren fehlgeschlagen (Browser / HTTPS).");
    }
    if (copyHintTimer.current) clearTimeout(copyHintTimer.current);
    copyHintTimer.current = setTimeout(() => setCopyHint(null), 3500);
  };

  const runWithParsedInput = (data: AlgorithmInput) => {
    startTransition(async () => {
      setError(null);
      setResult(null);
      setOutputText("");
      setRecommendationPreview(null);
      const parsed = algorithmInputSchema.safeParse(data);
      if (!parsed.success) {
        const msg = parsed.error.issues
          .map((issue) => `${issue.path.length ? issue.path.join(".") : "Eingabe"}: ${issue.message}`)
          .join(" · ");
        setError(msg || "Eingabe ungültig.");
        return;
      }
      await executeInput(parsed.data as AlgorithmInput);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="size-5" aria-hidden />
            Algorithmus-Test (Live-Logik)
          </CardTitle>
          <CardDescription>
            Nutzt exakt denselben calculate()-Pfad wie im Wizard und merged dabei die aktuellen Admin-Werte aus der
            Datenbank.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {summary.map((row) => (
                <div key={row.label} className="rounded-lg border border-border/70 bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{row.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Noch kein Lauf. Starte unten einen Test.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Settings-Quelle:{" "}
            {hasDbSettings ? "DB-Overrides aktiv" : "keine DB-Overrides gefunden, Fallback-Konstanten aktiv"}
          </p>
        </CardContent>
      </Card>

      <AlgorithmTestRecommendationSection data={recommendationPreview} />

      <Card>
        <CardHeader>
          <CardTitle>Testeingaben</CardTitle>
          <CardDescription>
            Szenario (Bordnetz, Quellen, Verbraucher, Dach …) per Preset oder manuell pflegen. „Zufällige Filter“
            variiert nur Reiseverhalten, Autarkie, Kabel, Lastprofil und Ladegeschwindigkeit — ideal, um dieselbe
            Nutzerkonfiguration unter Randbedingungen zu prüfen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlgorithmTestPresetControls
            formInput={input}
            disabled={pending}
            onApplyPreset={setInput}
            onError={setError}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => runWithParsedInput(input)} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />}
              Berechnen
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInput(randomizeAlgorithmTestFilters(input))}
              disabled={pending}
            >
              <Shuffle className="size-4" aria-hidden />
              Zufällige Filter
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const rnd = randomizeAlgorithmTestFilters(input);
                setInput(rnd);
                runWithParsedInput(rnd);
              }}
              disabled={pending}
            >
              <Shuffle className="size-4" aria-hidden />
              Zufall + sofort rechnen
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const scenario = cloneAlgorithmInput(input);
                  for (let i = 0; i < 5; i++) {
                    const rnd = randomizeAlgorithmTestFilters(scenario);
                    setInput(rnd);
                    const parsed = algorithmInputSchema.safeParse(rnd);
                    if (!parsed.success) {
                      const msg = parsed.error.issues
                        .map((issue) => `${issue.path.length ? issue.path.join(".") : "Eingabe"}: ${issue.message}`)
                        .join(" · ");
                      setError(msg || "Eingabe ungültig.");
                      return;
                    }
                    await executeInput(parsed.data as AlgorithmInput);
                  }
                })
              }
              disabled={pending}
            >
              <Shuffle className="size-4" aria-hidden />
              5× Filter-Zufallslauf
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInput(cloneAlgorithmInput(DEFAULT_ALGORITHM_INPUT))}
              disabled={pending}
            >
              Zurück auf Default
            </Button>
            <Button type="button" variant="ghost" onClick={() => setHistory([])} disabled={pending}>
              <Trash2 className="size-4" aria-hidden />
              Verlauf leeren
            </Button>
          </div>
          <AlgorithmTestInputForm value={input} onChange={setInput} disabled={pending} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle>Algorithmus-Output</CardTitle>
              <CardDescription>
                Rohausgabe des Berechnungsergebnisses (identisch zur zentralen Berechnungslogik). Nach einem Lauf kannst
                du Eingaben, Ausgabe und Produkt-Prefilter zusammen kopieren — z. B. für ein Review im Chat.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              disabled={!lastShareBundle}
              onClick={() => void copyShareJson()}
            >
              {copyHint?.startsWith("JSON") ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              JSON (Input, Output, Prefilter) kopieren
            </Button>
          </div>
          {copyHint ? <p className="text-xs text-muted-foreground">{copyHint}</p> : null}
        </CardHeader>
        <CardContent>
          <textarea
            className="min-h-[280px] w-full rounded-md border border-input bg-muted/20 p-3 font-mono text-xs"
            value={outputText}
            readOnly
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Testläufe</CardTitle>
          <CardDescription>Schneller Vergleich mehrerer Runs hintereinander.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length === 0 ? <p className="text-sm text-muted-foreground">Noch kein Verlauf vorhanden.</p> : null}
          {history.map((row) => (
            <div key={row.id} className="rounded-md border border-border/70 p-3 text-sm">
              <p className="font-medium">Run {row.at}</p>
              <p className="text-muted-foreground">
                Batterie {row.output.battery.recommendedCapacityAh} Ah · Solar {row.output.solar.requiredWp} Wp ·
                Wechselrichter {row.output.inverter.recommendedW} W
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
