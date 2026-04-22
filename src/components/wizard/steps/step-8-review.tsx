"use client";

import { useCallback, useMemo, useState } from "react";
import { Step8DebugFab } from "@/components/wizard/steps/step-8-debug-fab";
import { Step8PreviewBlock } from "@/components/wizard/steps/step-8-preview-block";
import { Step8SolarBatteryCard } from "@/components/wizard/steps/step-8-solar-battery-card";
import type { Step8PreviewStatus } from "@/components/wizard/steps/use-step8-export-json";
import { useStep8ExportJson } from "@/components/wizard/steps/use-step8-export-json";
import { useWizardStep8CanonicalPreviews } from "@/components/wizard/steps/use-wizard-step8-canonical-previews";
import { useWizardStep8DebugTrace } from "@/components/wizard/steps/use-wizard-step8-debug-trace";
import { WizardStepHeader } from "@/components/wizard/wizard-step-header";
import { wizardCallout, wizardInsetPanel } from "@/components/wizard/wizard-surfaces";
import { topUpCoversDailyWh } from "@/lib/wizard/top-up-covers-daily";
import { cn } from "@/lib/utils";
import { isWizardCompleteForSubmission } from "@/lib/wizard/validation";
import { useWizardStore } from "@/store/wizard";
import type { AlgorithmOutput } from "@/lib/algorithm/types";

const AUTARKY_TOPUP_NOTE =
  "Bei deinen aktuellen Energiequellen deckt die Einspeisung (Solar/Lichtmaschine) bereits den Tagesbedarf — " +
  "die Batterie-Mindestgröße (1-Tages-Reserve ohne Nachschub) gilt unabhängig von den Autarkie-Tagen in Schritt 5. " +
  "Mehr Verbraucher in Schritt 3 oder weniger Nachschub in Schritt 2 machen den Effekt der Autarkie-Tage wieder sichtbar.";

function newBagId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `bag-${Date.now()}`;
}

export function Step8Review() {
  const input = useWizardStore((s) => s.input);
  const patchInput = useWizardStore((s) => s.patchInput);
  const [solarBranchOutput, setSolarBranchOutput] = useState<AlgorithmOutput | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [hardFloorBinding, setHardFloorBinding] = useState(false);

  const canSubmit = isWizardCompleteForSubmission(input);
  const canonical = useWizardStep8CanonicalPreviews(input, canSubmit);
  const hasSolar = input.energySources.includes("solar");

  const displayOutput = useMemo(() => {
    if (canonical.kind !== "ok") return null;
    if (!hasSolar) return canonical.rawBase;
    return solarBranchOutput;
  }, [canonical, hasSolar, solarBranchOutput]);

  const previewLoading =
    canonical.kind === "loading" ||
    (canonical.kind === "ok" && hasSolar && solarBranchOutput === null);

  const exportPreviewStatus: Step8PreviewStatus = useMemo(() => {
    if (previewLoading) return "loading";
    if (canonical.kind === "error") return "error";
    return "idle";
  }, [previewLoading, canonical.kind]);

  const previewError = canonical.kind === "error" ? canonical.message : undefined;

  const canonicalResetKey = useMemo(() => {
    if (canonical.kind === "ok") return JSON.stringify(canonical.canonicalInput);
    return canonical.kind;
  }, [canonical]);

  const handleDisplayOutput = useCallback((o: AlgorithmOutput | null) => {
    setSolarBranchOutput(o);
  }, []);

  const debugState = useWizardStep8DebugTrace(input, debugOpen && canSubmit);

  const exportJson = useStep8ExportJson(
    input,
    displayOutput,
    exportPreviewStatus,
    previewError,
    debugState,
  );

  const topUpCovers = useMemo(() => topUpCoversDailyWh(input), [input]);

  const addBag200 = useCallback(() => {
    patchInput({
      solarBags: [...input.solarBags, { id: newBagId(), power: 200 }],
    });
  }, [input.solarBags, patchInput]);

  const showAutarkyNote = canSubmit && (topUpCovers === true || (hardFloorBinding && hasSolar));

  return (
    <div className="relative flex flex-col gap-6 pb-4">
      <WizardStepHeader
        title="Übersicht"
        description="Prüfe Solar, Batterie und Kabel. Entwickler-Tools (JSON, Zwischenwerte) erreichst du über das Symbol unten rechts."
      />
      <dl className={cn(wizardInsetPanel(), "grid gap-4 text-sm sm:grid-cols-2")}>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Bordspannung</dt>
          <dd className="font-semibold text-foreground">{input.systemVoltage} V</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Energie</dt>
          <dd className="text-right font-semibold text-foreground">
            {input.energySources.join(", ") || "—"}
          </dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Verbraucher</dt>
          <dd className="font-semibold text-foreground">{input.consumers.length} Gerät(e)</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Autarkie</dt>
          <dd className="font-semibold text-foreground">
            {input.autarchyDays === 999 ? "Maximum" : `${input.autarchyDays} Tage`}
          </dd>
        </div>
      </dl>

      <Step8SolarBatteryCard
        key={canonicalResetKey}
        input={input}
        patchInput={patchInput}
        canonical={canonical}
        canSubmit={canSubmit}
        onDisplayOutput={handleDisplayOutput}
        onHardFloorBinding={setHardFloorBinding}
      />

      <Step8PreviewBlock
        loading={previewLoading}
        error={canonical.kind === "error" ? canonical.message : null}
        output={displayOutput}
        onAddBag200={addBag200}
      />

      {showAutarkyNote ? <p className={wizardCallout()}>{AUTARKY_TOPUP_NOTE}</p> : null}

      {!canSubmit ? (
        <p className="text-sm text-muted-foreground">
          Bitte alle Pflichtschritte ausfüllen (z. B. Energiequellen, Verbraucher, positive Kabellängen).
        </p>
      ) : null}

      {canSubmit ? (
        <Step8DebugFab
          canSubmit={canSubmit}
          debugOpen={debugOpen}
          onDebugOpenChange={setDebugOpen}
          debugState={debugState}
          exportJson={exportJson}
        />
      ) : null}
    </div>
  );
}
