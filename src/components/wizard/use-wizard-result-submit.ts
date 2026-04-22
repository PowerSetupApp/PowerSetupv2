"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { AlgorithmInput } from "@/lib/algorithm/types";
import { isWizardCompleteForSubmission } from "@/lib/wizard/validation";

export function useWizardResultSubmit(input: AlgorithmInput) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = isWizardCompleteForSubmission(input);

  const submit = useCallback(() => {
    setError(null);
    setPending(true);
    void (async () => {
      try {
        const res = await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData: input }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          id?: string;
          error?: string;
          detail?: string;
        };
        if (!res.ok) {
          const base = body.error ?? "Speichern fehlgeschlagen";
          const withDetail =
            typeof body.detail === "string" && body.detail.length > 0
              ? `${base}: ${body.detail}`
              : base;
          setError(`${withDetail} (${res.status})`);
          return;
        }
        if (!body.id) {
          setError("Ungültige Server-Antwort");
          return;
        }
        router.push(`/result/${body.id}`);
      } catch (e) {
        const msg =
          e instanceof Error && e.message === "Failed to fetch"
            ? "Keine Verbindung zum Server (Failed to fetch). Häufig wenn der Dev-Server blockiert kompiliert oder überlastet ist — kurz warten oder `npm run dev` neu starten."
            : e instanceof Error && e.message
              ? e.message
              : "Netzwerkfehler";
        setError(msg);
      } finally {
        setPending(false);
      }
    })();
  }, [input, router]);

  return { submit, pending, error, canSubmit };
}
