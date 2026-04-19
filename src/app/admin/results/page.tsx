import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { StreamingFallback } from "@/components/streaming-fallback";
import { listAdminResultsLast90Days, type AdminResultRow } from "@/lib/db/queries/admin-results";

export default function AdminResultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Ergebnisse &amp; Kosten</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Letzte 90 Tage inkl. Token-Zähler und geschätzter Bruttokosten.
        </p>
      </div>

      <Suspense fallback={<StreamingFallback />}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  await connection();
  const res = await listAdminResultsLast90Days();

  if (!res.ok) return <AdminDbUnavailableBanner message={res.message} />;

  if (res.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Keine Ergebnisse in den letzten 90 Tagen.</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{res.data.length}</span> Ergebnisse
      </p>
      <div className="overflow-x-auto rounded-2xl border border-border/70">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-border/70 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Erstellt</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Modell</th>
              <th className="px-4 py-3 font-medium">Tokens (in / out)</th>
              <th className="px-4 py-3 font-medium">Kosten</th>
              <th className="w-px px-2 py-3 text-right font-medium">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-card/90">
            {res.data.map((r) => (
              <ResultRow key={r.id} row={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultRow({ row }: { row: AdminResultRow }) {
  const created = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(row.createdAt);
  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3 font-mono text-xs text-foreground">{created}</td>
      <td className="px-4 py-3 text-xs">{row.generationStatus}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{row.aiModel ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {row.inputTokens ?? "—"} / {row.outputTokens ?? "—"}
      </td>
      <td className="px-4 py-3 text-xs">
        {row.costCents === null ? "—" : formatCents(row.costCents)}
      </td>
      <td className="px-2 py-3 text-right">
        <Link
          href={`/result/${row.id}`}
          className="text-xs font-medium text-primary hover:underline"
          prefetch={false}
        >
          Öffnen
        </Link>
      </td>
    </tr>
  );
}

function formatCents(cents: number): string {
  const eur = cents / 100;
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(eur);
}
