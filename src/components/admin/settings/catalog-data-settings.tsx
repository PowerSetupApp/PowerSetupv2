"use client";

import { importCatalogJsonAction } from "@/app/admin/settings/actions";
import type { AdminExportDomain } from "@/lib/schemas/admin-catalog-json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const DOMAINS: { id: AdminExportDomain; title: string; hint?: string }[] = [
  { id: "consumer-categories", title: "Verbraucher-Kategorien" },
  { id: "consumer-devices", title: "Verbraucher-Geräte" },
  { id: "categories", title: "Produktkategorien (+ Filter)" },
  { id: "brands", title: "Marken" },
  { id: "brand-filter-categories", title: "Marken-Filter (Wizard)" },
  { id: "products", title: "Produkte" },
  { id: "system-settings", title: "System-Einstellungen (Key/Value)", hint: "API-Keys optional exportieren." },
  { id: "algorithm-settings", title: "Algorithmus (eine Zeile)" },
  { id: "model-pricing", title: "Modell-Preise" },
  { id: "prompt-versions", title: "Prompt-Versionen", hint: "Import ersetzt alle Zeilen in dieser Tabelle." },
];

export function CatalogDataSettings() {
  const [includeSecrets, setIncludeSecrets] = useState(false);
  const [busy, setBusy] = useState<AdminExportDomain | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import-Reihenfolge</CardTitle>
          <CardDescription>
            Bei leerer Ziel-DB oder komplettem Restore: zuerst Verbraucher-Kategorien, dann Verbraucher-Geräte, dann
            Produktkategorien, Marken, Marken-Filter, zuletzt Produkte. Konfiguration (System, Algorithmus, Preise,
            Prompts) nach Bedarf.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/80 bg-muted/30 px-4 py-3 text-sm">
        <Label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={includeSecrets} onChange={(e) => setIncludeSecrets(e.target.checked)} />
          API-Keys in system-settings.json exportieren
        </Label>
      </div>

      {message ? (
        <p className="rounded-md border border-border/80 bg-card px-3 py-2 text-sm text-foreground" role="status">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {DOMAINS.map((d) => (
          <Card key={d.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{d.title}</CardTitle>
              {d.hint ? <CardDescription>{d.hint}</CardDescription> : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <a
                    href={`/api/admin/export/${d.id}${d.id === "system-settings" && includeSecrets ? "?includeSecrets=1" : ""}`}
                    download
                  >
                    JSON herunterladen
                  </a>
                </Button>
              </div>
              <DomainImport
                domain={d.id}
                isImporting={busy === d.id}
                inputsLocked={busy !== null}
                onBusy={(b) => setBusy(b ? d.id : null)}
                onMessage={setMessage}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DomainImport({
  domain,
  isImporting,
  inputsLocked,
  onBusy,
  onMessage,
}: {
  domain: AdminExportDomain;
  isImporting: boolean;
  inputsLocked: boolean;
  onBusy: (busy: boolean) => void;
  onMessage: (m: string | null) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">JSON importieren</Label>
      <Input
        type="file"
        accept="application/json,.json"
        disabled={inputsLocked}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setFileName(file.name);
          onBusy(true);
          onMessage(null);
          try {
            const text = await file.text();
            const result = await importCatalogJsonAction(domain, text);
            onMessage(`${domain}: ${result.imported} Datensätze importiert.`);
          } catch (err) {
            onMessage(`${domain}: ${err instanceof Error ? err.message : "Fehler"}`);
          } finally {
            onBusy(false);
          }
        }}
      />
      {fileName ? <p className="text-xs text-muted-foreground">Zuletzt: {fileName}</p> : null}
      {isImporting ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Import läuft…
        </p>
      ) : null}
    </div>
  );
}
