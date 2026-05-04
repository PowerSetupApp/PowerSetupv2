"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";

import { importProductFromAmazonAction } from "@/lib/admin/catalog-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/ui/simple-select";

type Props = {
  categories: { id: string; name: string }[];
};

export function AdminProductImportDialog({ categories }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"idle" | "fetch" | "analyze" | "save">("idle");

  const selectStyles =
    "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

  async function runImport(mode: "api" | "scrape") {
    if (!categoryId || !input.trim()) return;
    setBusy(true);
    setError(null);
    setPhase("fetch");
    try {
      if (mode === "scrape") {
        await new Promise((r) => setTimeout(r, 400));
      } else {
        await new Promise((r) => setTimeout(r, 200));
      }
      setPhase("analyze");
      const res = await importProductFromAmazonAction({ asinOrUrl: input.trim(), categoryId, mode });
      if (!res.ok) {
        setError(res.message);
        setPhase("idle");
        return;
      }
      setPhase("save");
      await new Promise((r) => setTimeout(r, 200));
      setOpen(false);
      setInput("");
      setPhase("idle");
      const base = `/admin/products/${res.productId}`;
      const url = res.suggestedBrandName
        ? `${base}?suggestedBrand=${encodeURIComponent(res.suggestedBrandName)}`
        : base;
      router.push(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import fehlgeschlagen.");
      setPhase("idle");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
          setPhase("idle");
          setInput("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Download className="mr-2 size-4" aria-hidden />
          Amazon-Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Produkt von Amazon importieren</DialogTitle>
          <DialogDescription>
            Wähle die Kategorie und gib eine ASIN oder eine amazon.de-Produkt-URL ein. Stammdaten und Filter werden per
            KI befüllt. Ohne API-Zugang: „Scrape (Backup)“.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="imp-cat">Kategorie</Label>
            {categories.length === 0 ? (
              <p id="imp-cat" className="text-sm text-muted-foreground">
                Keine Kategorien vorhanden.
              </p>
            ) : (
              <SimpleSelect
                id="imp-cat"
                value={categoryId}
                onValueChange={setCategoryId}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                triggerClassName={selectStyles}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="imp-in">ASIN oder Amazon-URL</Label>
            <Input
              id="imp-in"
              placeholder="B08XYZ1234 oder https://www.amazon.de/…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              API: Amazon Creators API (Zugangsdaten in der Umgebung). Scraping: Fallback ohne API (CAPTCHA möglich).
              Test mit <code className="text-foreground">USE_MOCK_AMAZON=true</code> und ASIN B075NQQRPD / B09LIONBAT /
              B08VICINV2.
            </p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {busy ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              <span>
                {phase === "fetch" ? "Amazon-Daten abrufen…" : null}
                {phase === "analyze" ? "KI extrahiert Produktdaten…" : null}
                {phase === "save" ? "Produkt wird gespeichert…" : null}
              </span>
            </div>
          ) : null}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !input.trim() || !categoryId}
              onClick={() => void runImport("scrape")}
              title="Ohne Amazon-API: HTML-Seite laden (kann blockiert werden)"
            >
              Scrape (Backup)
            </Button>
          </div>
          <Button
            type="button"
            disabled={busy || !input.trim() || !categoryId}
            onClick={() => void runImport("api")}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Importieren…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" aria-hidden />
                Importieren (API)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
