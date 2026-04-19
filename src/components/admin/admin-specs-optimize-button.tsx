"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  text: string;
  categoryName: string | null;
  onOptimized: (next: string) => void;
};

export function AdminSpecsOptimizeButton({ text, categoryName, onOptimized }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (text.trim().length === 0) {
      setError("Text leer — nichts zu optimieren.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/optimize-specs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, categoryName }),
      });
      const json = (await res.json()) as { text?: string; message?: string };
      if (!res.ok) {
        setError(json.message ?? "Optimierung fehlgeschlagen.");
        return;
      }
      if (json.text) onOptimized(json.text);
    } catch {
      setError("Optimierung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void run()}>
        <Sparkles className="mr-2 size-4" aria-hidden />
        {busy ? "Optimiere…" : "Mit KI optimieren"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
