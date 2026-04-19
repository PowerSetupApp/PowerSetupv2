"use client";

import type { AlgorithmSettings } from "@/generated/prisma/client";
import { dodFractionToPercent, dodPercentToFraction } from "@/lib/admin/algorithm-display";
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
import { Battery, Cable, Settings2, Snowflake, Sparkles, Sun, Zap } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const highlightClass =
  "inline-flex max-w-[min(100%,28rem)] cursor-pointer items-center break-all border border-blue-200 bg-blue-100 px-1.5 py-0.5 align-baseline text-sm font-semibold text-blue-700 transition-colors [overflow-wrap:anywhere] rounded-md hover:bg-blue-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:outline-none dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800";

type OnFieldChange = (key: string, value: string | number) => void;

type FlowInputKind = "dod" | "int" | "float" | "string";

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
  return v == null ? "" : String(v);
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
  parseCommit: (draft: string) => string | number | null;
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
          {inputKind === "string" ? (
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} className="font-mono text-sm" />
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
 * (see algorithm-flow-coverage.test.ts). Keys: FLOW_NARRATIVE_KEYS_USED
 */
export const FLOW_NARRATIVE_KEYS_USED = [
  "dodLifepo4",
  "dodAgm",
  "dodGel",
  "sunHoursSummer",
  "sunHoursAllYear",
  "sunHoursWinter",
  "locationGermanyAlps",
  "locationSouthernEurope",
  "locationScandinavia",
  "locationEastern",
  "locationVaries",
  "wpPerM2Rigid",
  "wpPerM2Flexible",
  "cloudyYieldFactor",
  "cloudyYieldFactorSummer",
  "cloudyYieldFactorWinter",
  "recommendedSolarYieldFactor",
  "solarSafetyFactor",
  "solarSystemEfficiency",
  "maxPortableWp",
  "roofUtilizationFactor",
  "roofOrientationFactor",
  "portableOrientationFactor",
  "standingDaysShort",
  "standingDaysMedium",
  "standingDaysLong",
  "maxBackupDays",
  "batterySafetyFactor",
  "simultaneousLow",
  "simultaneousModerate",
  "simultaneousHigh",
  "alternatorStandard",
  "alternatorEnhanced",
  "boosterEfficiency",
  "alternatorDriveHours",
  "chargerTimeHoursSlow",
  "chargerTimeHoursNormal",
  "chargerTimeHoursFast",
  "chargerAbsorptionOverhead",
  "inverterClasses",
  "chargerClasses",
  "solarControllerClasses",
  "cableSizes",
  "voltageDropCritical",
  "voltageDropNormal",
  "voltageDropSolar",
  "copperResistivity",
  "dutyCycleCompressor",
  "dutyCycleAbsorber",
  "minPreselectionScore",
  "productSelectionMode",
  "reasonGenerationMode",
] as const;

export function AlgorithmFlowNarrative({ settings, onFieldChange }: AlgorithmFlowNarrativeProps) {
  const s = settings;

  const dod = useCallback(
    (key: "dodLifepo4" | "dodAgm" | "dodGel", title: string) => (
      <FlowEdit
        fieldKey={key}
        dialogTitle={title}
        inputKind="dod"
        displayText={`${dodFractionToPercent(num(s, key))}%`}
        settings={s}
        getDraft={(st) => String(dodFractionToPercent(num(st, key)))}
        parseCommit={(d) => {
          const n = Number.parseFloat(d.replace(",", "."));
          if (!Number.isFinite(n)) return null;
          return dodPercentToFraction(n);
        }}
        onApply={onFieldChange}
      />
    ),
    [onFieldChange, s],
  );

  const intField = useCallback(
    (key: string, title: string, suffix: string) => (
      <FlowEdit
        fieldKey={key}
        dialogTitle={title}
        inputKind="int"
        displayText={`${Math.round(num(s, key))}${suffix}`}
        settings={s}
        getDraft={(st) => String(Math.round(num(st, key)))}
        parseCommit={(d) => {
          const n = Number.parseInt(d, 10);
          return Number.isFinite(n) ? n : null;
        }}
        onApply={onFieldChange}
      />
    ),
    [onFieldChange, s],
  );

  const floatField = useCallback(
    (key: string, title: string, displayFn: (n: number) => string) => (
      <FlowEdit
        fieldKey={key}
        dialogTitle={title}
        inputKind="float"
        displayText={displayFn(num(s, key))}
        settings={s}
        getDraft={(st) => String(num(st, key)).replace(",", ".")}
        parseCommit={(d) => {
          const n = Number.parseFloat(d.replace(",", "."));
          return Number.isFinite(n) ? n : null;
        }}
        onApply={onFieldChange}
      />
    ),
    [onFieldChange, s],
  );

  const stringField = useCallback(
    (key: string, title: string, shortLabel: string) => {
      const full = str(s, key);
      const display = full.length > 36 ? `${full.slice(0, 34)}…` : full || "—";
      return (
        <FlowEdit
          fieldKey={key}
          dialogTitle={title}
          inputKind="string"
          displayText={full ? display : shortLabel}
          settings={s}
          getDraft={(st) => str(st, key)}
          parseCommit={(d) => d}
          onApply={onFieldChange}
        />
      );
    },
    [onFieldChange, s],
  );

  const sectionTitleClass = "mb-2 flex items-center gap-2 text-base font-semibold text-foreground";
  const proseClass = "text-base leading-relaxed text-foreground";

  const fmtX = (n: number) => `${n}×`;
  const fmtH = (n: number) => `${n}h`;
  const fmtWp = (n: number) => `${Math.round(n)} Wp/m²`;
  const fmtPctFromFactor = (n: number) => `${Math.round(n * 100)}%`;
  const fmtCloud = (n: number) => `${Math.round(n * 100)}%`;
  const fmtSolarRec = (n: number) => `${n.toFixed(2)}×`;
  const fmtDuty = (n: number) => `${Math.round(n * 100)}%`;
  const fmtMm2List = (full: string) => (full.length > 32 ? `${full.slice(0, 30)}…` : full);
  const fmtDaysFloat = (n: number) =>
    `${Number.isInteger(n) || Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : n.toFixed(1)} Tage`;

  const cableDisplay = useMemo(() => fmtMm2List(str(s, "cableSizes")), [s]);

  return (
    <Card className="border-blue-200 bg-muted/40 dark:border-blue-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden>🤖</span>
          Algorithm-Check
        </CardTitle>
        <CardDescription>
          So würde der Algorithmus aktuell mit diesen Werten rechnen (Klicke auf Werte zum Bearbeiten):
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-base leading-relaxed">
        <div>
          <h4 className={sectionTitleClass}>
            <Settings2 className="size-4 shrink-0" aria-hidden />
            Dimensionierung &amp; Puffer
          </h4>
          <p className={proseClass}>
            Bei der <strong>Batterieberechnung</strong> unterscheiden wir zwischen Typen: Aus einer <strong>LiFePO₄-Batterie</strong>{" "}
            entnehmen wir bis zu {dod("dodLifepo4", "LiFePO₄ Entladetiefe (%)")}, während wir bei <strong>AGM</strong> nur{" "}
            {dod("dodAgm", "AGM Entladetiefe (%)")} und bei <strong>Gel</strong> {dod("dodGel", "Gel Entladetiefe (%)")} der
            Nennkapazität einplanen, um die Lebensdauer zu schützen.
          </p>
        </div>

        <div>
          <h4 className={sectionTitleClass}>
            <Sun className="size-4 shrink-0" aria-hidden />
            Solar-Ertrag
          </h4>
          <p className={proseClass}>
            Für die Solarberechnung nehmen wir an, dass ein Panel im Sommer durchschnittlich{" "}
            {floatField("sunHoursSummer", "Sonnenstunden Sommer", fmtH)} volle Leistung bringt, ganzjährig{" "}
            {floatField("sunHoursAllYear", "Sonnenstunden ganzjährig", fmtH)} und im Winterfokus{" "}
            {floatField("sunHoursWinter", "Sonnenstunden Winter", fmtH)}.             Diese Werte werden je nach Winterstandort
            gewichtet: Deutschland/Alpen {floatField("locationGermanyAlps", "Faktor DE/Alpen", fmtX)}, Südeuropa{" "}
            {floatField("locationSouthernEurope", "Faktor Südeuropa", fmtX)}, Skandinavien{" "}
            {floatField("locationScandinavia", "Faktor Skandinavien", fmtX)}, Osteuropa{" "}
            {floatField("locationEastern", "Faktor Osteuropa", fmtX)}, variierendes Reisegebiet{" "}
            {floatField("locationVaries", "Faktor variiert", fmtX)}.
          </p>
          <p className={`${proseClass} mt-2`}>
            Die Modulleistung kalkulieren wir mit {floatField("wpPerM2Rigid", "Wp/m² starr", fmtWp)} für starre und{" "}
            {floatField("wpPerM2Flexible", "Wp/m² flexibel", fmtWp)} für flexible Module. An bewölkten Tagen rechnen wir
            pauschal mit {floatField("cloudyYieldFactor", "Bewölkt-Faktor", fmtCloud)} des normalen Ertrags (Basis), im{" "}
            <strong>Sommer</strong> mit {floatField("cloudyYieldFactorSummer", "Bewölkt-Faktor Sommer", fmtCloud)}, im{" "}
            <strong>Winter</strong> nur {floatField("cloudyYieldFactorWinter", "Bewölkt-Faktor Winter", fmtCloud)}. Für
            die Empfehlung nutzen wir einen Solar-Puffer von{" "}
            {floatField("recommendedSolarYieldFactor", "Solar-Puffer (×)", fmtSolarRec)} und einen System-Wirkungsgrad
            von {floatField("solarSystemEfficiency", "System-Wirkungsgrad", fmtPctFromFactor)} (MPPT-Verluste, Verkabelung). Der{" "}
            <strong>Solar-Laderegler</strong> wird mit einem Sicherheitsfaktor von{" "}
            {floatField("solarSafetyFactor", "Regler-Sicherheitsfaktor", fmtX)} dimensioniert. Portable Solartaschen
            deckeln wir auf {intField("maxPortableWp", "Max. Solartasche (Wp)", " Wp")}.
          </p>
          <p className={`${proseClass} mt-2`}>
            Zusätzlich berücksichtigen wir, dass man nie 100&nbsp;% der Dachfläche belegen kann (
            {floatField("roofUtilizationFactor", "Dach-Auslastung", fmtPctFromFactor)} nutzbare Fläche). Fest verbaute Module
            verlieren Leistung durch schlechtere Ausrichtung ({floatField("roofOrientationFactor", "Dach-Orientierung (×)", fmtX)}), während
            mobile Solartaschen oft günstiger ausgerichtet werden können ({floatField("portableOrientationFactor", "Taschen-Orientierung (×)", fmtX)}).
          </p>
        </div>

        <div>
          <h4 className={sectionTitleClass}>
            <Battery className="size-4 shrink-0" aria-hidden />
            Autarkie &amp; Standzeit
          </h4>
          <p className={proseClass}>
            „Kurz“ steht für {floatField("standingDaysShort", "Standzeit kurz (Tage)", fmtDaysFloat)}, „Mittel“ für{" "}
            {floatField("standingDaysMedium", "Standzeit mittel (Tage)", fmtDaysFloat)} und „Lang“ für{" "}
            {floatField("standingDaysLong", "Standzeit lang (Tage)", fmtDaysFloat)} ohne Fahren. Auch bei langem Autarkie-Wunsch
            deckeln wir die reine Batterie-Reserve (ohne Solar/LiMa) auf maximal{" "}
            {floatField("maxBackupDays", "Max. Backup-Tage", fmtDaysFloat)}. Die
            berechnete Kapazität multiplizieren wir mit {floatField("batterySafetyFactor", "Batterie-Sicherheitsfaktor", fmtX)}.
          </p>
          <p className={`${proseClass} mt-2`}>
            <strong>Gleichzeitigkeit:</strong> Der Algorithmus wählt immer das Maximum aus (Gesamtlast × Faktor) oder dem
            stärksten Einzelverbraucher; zusätzlich werden 10&nbsp;% Sicherheitspuffer addiert. Faktoren: wenig Last{" "}
            {floatField("simultaneousLow", "Gleichzeitigkeit wenig", fmtX)}, moderat {floatField("simultaneousModerate", "Gleichzeitigkeit moderat", fmtX)}, viele
            Geräte parallel {floatField("simultaneousHigh", "Gleichzeitigkeit hoch", fmtX)}.
          </p>
        </div>

        <div>
          <h4 className={sectionTitleClass}>
            <Zap className="size-4 shrink-0" aria-hidden />
            Technik: Booster, Landstrom, Komponentenklassen
          </h4>
          <p className={proseClass}>
            Den <strong>Ladebooster</strong> wählen wir nach Lichtmaschine: Standard-LiMa{" "}
            {intField("alternatorStandard", "Standard-LiMa (A)", " A")}, verstärkte LiMa{" "}
            {intField("alternatorEnhanced", "Verstärkte LiMa (A)", " A")}. Als Wirkungsgrad setzen wir{" "}
            {floatField("boosterEfficiency", "Booster-Wirkungsgrad", fmtPctFromFactor)} an; pro Tag rechnen wir mit{" "}
            {floatField("alternatorDriveHours", "Fahrzeit pro Tag", fmtH)} Fahrzeit (für die tägliche LiMa-Ladeenergie).
          </p>
          <p className={`${proseClass} mt-2`}>
            <strong>Landstrom:</strong> Ziel-Ladezeit „Langsam“ {floatField("chargerTimeHoursSlow", "Landstrom langsam (h)", fmtH)}, „Normal“{" "}
            {floatField("chargerTimeHoursNormal", "Landstrom normal (h)", fmtH)}, „Schnell“ {floatField("chargerTimeHoursFast", "Landstrom schnell (h)", fmtH)} (Kapazität × DoD × (1 + Absorption-Overhead) ÷ Zielzeit ≈ Ladestrom). Absorption-Overhead{" "}
            {floatField("chargerAbsorptionOverhead", "Absorption-Overhead", (v) => `${Math.round(v * 100)} %`)} puffert die Konstantspannungs-Phase.
          </p>
          <p className={`${proseClass} mt-2`}>
            <strong>Komponentenklassen</strong> (kommasepariert): Wechselrichter {stringField("inverterClasses", "Wechselrichter-Klassen (W)", "WR-Klassen")},{" "}
            Batterieladegeräte {stringField("chargerClasses", "Ladegeräte-Klassen (A)", "Ladegerät-Klassen")}, Solar-Laderegler{" "}
            {stringField("solarControllerClasses", "Solar-Regler-Klassen (A)", "MPPT-Klassen")}.
          </p>
        </div>

        <div>
          <h4 className={sectionTitleClass}>
            <Cable className="size-4 shrink-0" aria-hidden />
            Kabel &amp; Sicherheiten
          </h4>
          <p className={proseClass}>
            Zulässige Kabelquerschnitte (mm², Liste): {stringField("cableSizes", "Kabelquerschnitte (mm²)", cableDisplay || "Kabel mm²")}.{" "}
            <strong>Spannungsabfall:</strong> kritisch am Wechselrichter maximal{" "}
            {floatField("voltageDropCritical", "Spannungsabfall kritisch (%)", (n) => `${n}%`)}, normal{" "}
            {floatField("voltageDropNormal", "Spannungsabfall normal (%)", (n) => `${n}%`)}, PV-Strang{" "}
            {floatField("voltageDropSolar", "Spannungsabfall Solar (%)", (n) => `${n}%`)}. Kupfer-Widerstand ρ ={" "}
            {floatField("copperResistivity", "Kupfer ρ (Ω·mm²/m)", (n) => String(n))} Ω·mm²/m.
          </p>
        </div>

        <div>
          <h4 className={sectionTitleClass}>
            <Snowflake className="size-4 shrink-0" aria-hidden />
            Kühlung, KI-Grenze &amp; Recommendation Engine
          </h4>
          <p className={proseClass}>
            <strong>Kühlgeräte:</strong> angenommener Duty-Cycle Kompressor {floatField("dutyCycleCompressor", "Duty Kompressor", fmtDuty)}, Absorber{" "}
            {floatField("dutyCycleAbsorber", "Duty Absorber", fmtDuty)}. <strong>KI-Vorauswahl:</strong> Mindest-Match-Score{" "}
            {intField("minPreselectionScore", "Min. Match-Score", " /100")} (nur darüber gelangen Produkte in die KI-Auswahl).
          </p>
          <p className={`${proseClass} mt-2 flex flex-wrap items-center gap-x-1 gap-y-1`}>
            <Sparkles className="size-4 shrink-0 text-muted-foreground" aria-hidden />
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
