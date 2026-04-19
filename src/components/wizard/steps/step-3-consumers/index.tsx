"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CardSelection } from "@/components/ui/card-selection";
import {
  wizardCallout,
  wizardCatalogScrollRegion,
  wizardSectionLabel,
} from "@/components/wizard/wizard-surfaces";
import { cn } from "@/lib/utils";
import { WizardStepHeader } from "@/components/wizard/wizard-step-header";
import type { Consumer } from "@/lib/algorithm/types";
import type { WizardConsumerTemplate } from "@/lib/db/queries/wizard-consumer-templates";
import { groupConsumerTemplatesByCategory } from "@/lib/wizard/group-consumer-templates";
import { useWizardStore } from "@/store/wizard";

import { CatalogCategoryBlock } from "./catalog-category-block";
import { ConsumerCard } from "./consumer-card";
import { consumerFromTemplate, defaultConsumer, newConsumerId } from "./consumers-helpers";
import {
  SECTION_SIMULTANEOUS_230,
  SIMULTANEOUS_230_HELPER,
  SIMULTANEOUS_LOAD_CARDS,
} from "./simultaneous-load-options";

const ID_SIMULTANEOUS_230 = "step3-consumers-simultaneous-230";

export interface Step3ConsumersProps {
  templates?: WizardConsumerTemplate[];
  /** Server: Katalog konnte nicht geladen werden (z. B. DB nicht erreichbar). */
  catalogError?: string | null;
}

export function Step3Consumers({ templates = [], catalogError = null }: Step3ConsumersProps) {
  const input = useWizardStore((s) => s.input);
  const patchInput = useWizardStore((s) => s.patchInput);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const soleConsumer = input.consumers.length === 1;
  const isExpanded = (id: string) => soleConsumer || expandedIds.has(id);

  const toggleExpanded = (id: string) => {
    if (soleConsumer) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pruneExpandedIds = (idsInList: Set<string>) => {
    setExpandedIds((prev) => new Set([...prev].filter((id) => idsInList.has(id))));
  };

  const updateConsumer = (id: string, patch: Partial<Consumer>) => {
    patchInput({
      consumers: input.consumers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const removeConsumer = (id: string) => {
    const nextList = input.consumers.filter((c) => c.id !== id);
    patchInput({ consumers: nextList });
    pruneExpandedIds(new Set(nextList.map((c) => c.id)));
  };

  const duplicateConsumer = (c: Consumer) => {
    const clone: Consumer = { ...c, id: newConsumerId() };
    patchInput({ consumers: [...input.consumers, clone] });
  };

  const addFromTemplate = (t: WizardConsumerTemplate) => {
    const next = consumerFromTemplate(t, input.systemVoltage);
    patchInput({ consumers: [...input.consumers, next] });
  };

  const addManualConsumer = () => {
    const next = defaultConsumer(input.systemVoltage);
    patchInput({ consumers: [...input.consumers, next] });
    // Nach dem ersten Eintrag ist die Karte ohnehin immer offen (`soleConsumer`).
    if (input.consumers.length >= 1) {
      setExpandedIds(new Set([next.id]));
    }
  };

  const groups = groupConsumerTemplatesByCategory(templates);
  const has230Consumers = input.consumers.some((c) => c.voltage === 230);

  return (
    <div className="flex flex-col gap-6">
      <WizardStepHeader
        title="Verbraucher"
        description="Wähle Geräte aus dem Katalog oder füge eigene Verbraucher hinzu."
      />
      <p className={wizardCallout()}>
        Unter „Deine Verbraucher“ weiter unten: Katalog-Geräte einzeln anpassen (Leistung, Nutzung/Tag) und bei Bedarf manuell ergänzen.
      </p>
      {templates.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className={wizardSectionLabel()}>Katalog nach Kategorie</p>
          <div className={wizardCatalogScrollRegion()}>
            <div className="px-3 pb-2 pt-1 sm:px-4">
              {groups.map((g) => (
                <CatalogCategoryBlock
                  key={g.categoryId}
                  group={g}
                  consumers={input.consumers}
                  onAddTemplate={addFromTemplate}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            wizardCallout(),
            catalogError
              ? "border-l-destructive/50 bg-destructive/5 text-destructive-foreground"
              : "border-l-amber-500/40 bg-amber-500/[0.06] text-foreground",
          )}
          role="status"
        >
          {catalogError ? (
            <>
              <p className="font-medium text-foreground">Katalog konnte nicht geladen werden.</p>
              <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {catalogError}
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">Keine Einträge im Katalog</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Dieser Schritt listet nur <strong className="text-foreground">aktive Verbrauchergeräte</strong> aus dem
                Admin-Bereich{" "}
                <Link href="/admin/consumer-devices" className="font-medium text-primary underline-offset-2 hover:underline">
                  Verbrauchergeräte
                </Link>{" "}
                (nicht die Produkt-Übersicht oder andere Dashboard-Zahlen). Jede Zeile dort muss den Status{" "}
                <strong className="text-foreground">Aktiv</strong> haben, damit sie hier erscheint.
              </p>
            </>
          )}
        </div>
      )}
      <div
        className={cn(
          "flex flex-col gap-3",
          templates.length > 0 && "border-t border-border/60 pt-5",
        )}
      >
        <p className={wizardSectionLabel("mb-0 text-foreground")}>Deine Verbraucher</p>
        {input.consumers.map((c) => (
          <ConsumerCard
            key={c.id}
            systemVoltage={input.systemVoltage}
            consumer={c}
            expanded={isExpanded(c.id)}
            collapseDisabled={soleConsumer}
            onToggleExpanded={() => toggleExpanded(c.id)}
            onUpdate={(patch) => updateConsumer(c.id, patch)}
            onRemove={() => removeConsumer(c.id)}
            onDuplicate={() => duplicateConsumer(c)}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-12 min-h-12 w-full rounded-xl sm:w-auto"
        onClick={addManualConsumer}
      >
        Verbraucher hinzufügen
      </Button>
      {has230Consumers ? (
        <section className="space-y-3" aria-labelledby={ID_SIMULTANEOUS_230}>
          <h3 id={ID_SIMULTANEOUS_230} className={wizardSectionLabel()}>
            {SECTION_SIMULTANEOUS_230}
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{SIMULTANEOUS_230_HELPER}</p>
          <CardSelection
            labelId={ID_SIMULTANEOUS_230}
            options={SIMULTANEOUS_LOAD_CARDS}
            value={input.simultaneousLoad}
            onChange={(simultaneousLoad) => patchInput({ simultaneousLoad })}
            columns={3}
          />
        </section>
      ) : null}
    </div>
  );
}
