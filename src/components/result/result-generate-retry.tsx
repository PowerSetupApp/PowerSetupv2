"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export interface ResultGeneratePanelProps {
  resultId: string;
  /**
   * Server-seitiger Status beim Rendering. Steuert das UI-Verhalten:
   *   - `idle`/`pending` → automatisch (re)starten + polling
   *   - `failed` → Fehlermeldung anzeigen, „Erneut versuchen" Button
   */
  initialStatus: "idle" | "pending" | "failed";
  initialError: string | null;
}

const POLL_INTERVAL_MS = 2500;

export function ResultGenerateRetry({ resultId, initialStatus, initialError }: ResultGeneratePanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "pending" | "failed">(initialStatus);
  const [message, setMessage] = useState(initialError ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // React Compiler verbietet Zugriffe auf eine Variable „vor" der Deklaration
  // (hier durch die rekursive `setTimeout(trigger)`-Selbstreferenz). Wir lösen
  // das, indem wir die aktuelle `trigger`-Implementation in einem Ref halten
  // und aus dem Timer aufrufen; damit bleibt der `useCallback`-Body
  // immutable bzgl. Deklarationsreihenfolge.
  const triggerRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const trigger = useCallback(async () => {
    setStatus("pending");
    setMessage("");
    try {
      const res = await fetch(`/api/generate/${resultId}`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { error?: string; status?: string };
      if (res.status === 429) {
        setMessage(body.error ?? "Zu viele Anfragen. Bitte kurz warten.");
        setStatus("failed");
        return;
      }
      if (!res.ok) {
        setMessage(body.error ?? "Berechnung fehlgeschlagen");
        setStatus("failed");
        return;
      }
      if (body.status === "succeeded") {
        router.refresh();
        return;
      }
      // `already-pending` oder `pending` → erneut pollen
      timerRef.current = setTimeout(() => void triggerRef.current(), POLL_INTERVAL_MS);
    } catch {
      setMessage("Netzwerkfehler. Bitte erneut versuchen.");
      setStatus("failed");
    }
  }, [resultId, router]);

  useEffect(() => {
    triggerRef.current = trigger;
  }, [trigger]);

  useEffect(() => {
    if (initialStatus === "idle" || initialStatus === "pending") {
      // Asynchron anstoßen — `trigger()` ruft `setStatus` synchron auf und
      // würde ein Effect-State-Cascade auslösen (React-Compiler-Warnung).
      const handle = setTimeout(() => void triggerRef.current(), 0);
      return () => {
        clearTimeout(handle);
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [initialStatus]);

  if (status === "pending") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">Deine Empfehlung wird berechnet …</p>
        <p className="mt-1">Das dauert meist unter einer Minute.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm">
      <p className="font-medium text-destructive">{message || "Berechnung nicht möglich."}</p>
      <Button
        type="button"
        className="mt-4 h-11 rounded-xl"
        onClick={() => void trigger()}
      >
        Erneut versuchen
      </Button>
    </div>
  );
}
