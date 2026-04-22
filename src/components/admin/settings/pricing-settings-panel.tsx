"use client";

import {
  loadModelPricingAction,
  refreshModelPricingFromProviderAction,
  saveModelPricingRowAction,
} from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Row = Awaited<ReturnType<typeof loadModelPricingAction>>[number];

export function PricingSettingsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<"openai" | "google" | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await loadModelPricingAction());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateLocal = (modelId: string, field: "inputPrice" | "outputPrice", value: number) => {
    setRows((prev) => prev.map((r) => (r.modelId === modelId ? { ...r, [field]: value } : r)));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  const openai = rows.filter((r) => r.provider === "openai");
  const google = rows.filter((r) => r.provider === "google");

  return (
    <div className="space-y-6">
      {syncNotice ? (
        <p className="rounded-md border border-border/80 bg-muted/40 px-3 py-2 text-sm text-foreground" role="status">
          {syncNotice}
        </p>
      ) : null}
      <ProviderCard
        title="OpenAI Modellpreise"
        rows={openai}
        busy={busy}
        syncing={syncing === "openai"}
        onSync={async () => {
          setSyncing("openai");
          try {
            const { count, failed } = await refreshModelPricingFromProviderAction("openai");
            await load();
            setSyncNotice(
              failed > 0
                ? `${count} Preise aktualisiert (${failed} fehlgeschlagen).`
                : `${count} Preise aktualisiert.`,
            );
          } finally {
            setSyncing(null);
          }
        }}
        onSaveRow={async (r) => {
          setBusy(r.modelId);
          try {
            await saveModelPricingRowAction(r.modelId, r.inputPrice, r.outputPrice);
            await load();
          } finally {
            setBusy(null);
          }
        }}
        onChange={updateLocal}
      />
      <ProviderCard
        title="Google Gemini Modellpreise"
        rows={google}
        busy={busy}
        syncing={syncing === "google"}
        onSync={async () => {
          setSyncing("google");
          try {
            const { count, failed } = await refreshModelPricingFromProviderAction("google");
            await load();
            setSyncNotice(
              failed > 0
                ? `${count} Preise aktualisiert (${failed} fehlgeschlagen).`
                : `${count} Preise aktualisiert.`,
            );
          } finally {
            setSyncing(null);
          }
        }}
        onSaveRow={async (r) => {
          setBusy(r.modelId);
          try {
            await saveModelPricingRowAction(r.modelId, r.inputPrice, r.outputPrice);
            await load();
          } finally {
            setBusy(null);
          }
        }}
        onChange={updateLocal}
      />
    </div>
  );
}

function ProviderCard({
  title,
  rows,
  busy,
  syncing,
  onSync,
  onSaveRow,
  onChange,
}: {
  title: string;
  rows: Row[];
  busy: string | null;
  syncing: boolean;
  onSync: () => Promise<void>;
  onSaveRow: (r: Row) => Promise<void>;
  onChange: (modelId: string, field: "inputPrice" | "outputPrice", value: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>USD je 1M Tokens (Input / Output).</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void onSync()} disabled={syncing}>
          {syncing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Preise aktualisieren
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Einträge — „Preise aktualisieren“ ausführen.</p>
        ) : (
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-muted-foreground">
                <th className="py-2 pr-2 font-medium">Modell</th>
                <th className="py-2 pr-2 font-medium">Input</th>
                <th className="py-2 pr-2 font-medium">Output</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.modelId} className="border-b border-border/40">
                  <td className="py-2 pr-2">
                    <div className="font-medium">{r.displayName ?? r.modelId}</div>
                    <div className="text-xs text-muted-foreground">{r.modelId}</div>
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      className="h-8 w-24"
                      type="number"
                      step="0.0001"
                      value={r.inputPrice}
                      onChange={(e) => onChange(r.modelId, "inputPrice", Number.parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      className="h-8 w-24"
                      type="number"
                      step="0.0001"
                      value={r.outputPrice}
                      onChange={(e) => onChange(r.modelId, "outputPrice", Number.parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-2">
                    <Button type="button" size="sm" variant="secondary" disabled={busy === r.modelId} onClick={() => void onSaveRow(r)}>
                      {busy === r.modelId ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Speichern"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
