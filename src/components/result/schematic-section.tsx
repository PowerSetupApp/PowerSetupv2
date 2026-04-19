"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CreditPackageId } from "@/lib/payments/packages";
import { CREDIT_PACKAGES } from "@/lib/payments/packages";

export interface SchematicSectionProps {
  resultId: string;
  creditBalance: number;
  pdfUrl: string | null;
  ready: boolean;
}

export function SchematicSection({ resultId, creditBalance: initialBalance, pdfUrl: initialPdfUrl, ready }: SchematicSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState(initialBalance);
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [payBusy, setPayBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureIfNeeded = useCallback(async () => {
    const payment = searchParams.get("payment");
    const orderId = searchParams.get("token");
    if (payment !== "return" || !orderId) return;
    setError(null);
    setPayBusy(true);
    try {
      const res = await fetch("/api/payments/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId, orderId }),
      });
      const body = (await res.json().catch(() => ({}))) as { balance?: number; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Zahlung konnte nicht bestätigt werden");
        return;
      }
      if (typeof body.balance === "number") setBalance(body.balance);
      router.replace(`/result/${resultId}`, { scroll: false });
    } catch {
      setError("Netzwerkfehler bei der Zahlungsbestätigung");
    } finally {
      setPayBusy(false);
    }
  }, [resultId, router, searchParams]);

  useEffect(() => {
    void captureIfNeeded();
  }, [captureIfNeeded]);

  const startPayPal = async (packageId: CreditPackageId) => {
    setError(null);
    setPayBusy(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId, packageId }),
      });
      const body = (await res.json().catch(() => ({}))) as { approveUrl?: string; error?: string };
      if (!res.ok || !body.approveUrl) {
        setError(body.error ?? "PayPal konnte nicht gestartet werden");
        return;
      }
      window.location.href = body.approveUrl;
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setPayBusy(false);
    }
  };

  const generatePdf = async () => {
    setError(null);
    setPdfBusy(true);
    try {
      const res = await fetch(`/api/pdf/${resultId}`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        setError(body.error ?? "PDF-Erstellung fehlgeschlagen");
        return;
      }
      setPdfUrl(body.url);
      setBalance((b) => Math.max(0, b - 1));
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setPdfBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <section className="rounded-2xl border border-border/70 bg-muted/10 p-5">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Schaltplan (PDF)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        KI-gestützter Planungsentwurf auf Basis deiner Eingaben und Empfehlungen — kein Ersatz für Prüfung durch
        Elektrofachkraft. Ein Download verbraucht{" "}
        <span className="font-medium text-foreground">1 Credit</span> (nach Kauf).
      </p>
      <p className="mt-2 text-xs text-muted-foreground">Credits für dieses Ergebnis: {balance}</p>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-4 flex flex-col gap-3">
        {pdfUrl ? (
          <Button asChild variant="default" className="h-11 w-full rounded-xl sm:w-auto">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              PDF öffnen
            </a>
          </Button>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {(Object.keys(CREDIT_PACKAGES) as CreditPackageId[]).map((id) => {
                const p = CREDIT_PACKAGES[id];
                return (
                  <Button
                    key={id}
                    type="button"
                    variant="secondary"
                    disabled={payBusy}
                    className="h-11 rounded-xl"
                    onClick={() => void startPayPal(id)}
                  >
                    {p.label}: {p.credits}× — {p.amount} {p.currency}
                  </Button>
                );
              })}
            </div>
            <Button
              type="button"
              variant="default"
              disabled={pdfBusy || balance < 1 || payBusy}
              className="h-11 rounded-xl"
              onClick={() => void generatePdf()}
            >
              {pdfBusy ? "PDF wird erstellt …" : "Schaltplan als PDF erzeugen (1 Credit)"}
            </Button>
          </>
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Später: getrennte Varianten für Einsteiger und Profis. Aktuell wird die Profi-Variante aus dem Datenmodell
        verwendet (<code className="rounded bg-muted px-1 py-0.5 text-[10px]">schematicVariant</code>).
      </p>
    </section>
  );
}
