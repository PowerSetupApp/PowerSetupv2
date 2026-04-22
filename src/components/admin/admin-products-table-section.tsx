"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, RefreshCw } from "lucide-react";

import type { AdminProductCategoryRow, AdminProductListRow } from "@/lib/db/queries/admin-catalog-read";
import { formatAdminDateShort, formatAdminPriceEUR } from "@/lib/admin/format-admin";
import { AdminCatalogRowActions } from "@/components/admin/admin-catalog-row-actions";
import { AdminReadonlyBadge } from "@/components/admin/admin-readonly-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/ui/simple-select";

type Props = {
  rows: AdminProductListRow[];
  categories: AdminProductCategoryRow[];
};

function rowMatchesCompletenessFilters(
  r: AdminProductListRow,
  incompleteFiltersOnly: boolean,
  listingGapsOnly: boolean,
  algorithmSpecGapsOnly: boolean,
): boolean {
  const any = incompleteFiltersOnly || listingGapsOnly || algorithmSpecGapsOnly;
  if (!any) return true;
  return (
    (incompleteFiltersOnly && r.incompleteFilterValues) ||
    (listingGapsOnly && r.missingListingMeta) ||
    (algorithmSpecGapsOnly && r.missingAlgorithmSpec)
  );
}

export function AdminProductsTableSection({ rows, categories }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [incompleteFiltersOnly, setIncompleteFiltersOnly] = useState(false);
  const [listingGapsOnly, setListingGapsOnly] = useState(false);
  const [algorithmSpecGapsOnly, setAlgorithmSpecGapsOnly] = useState(false);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (!rowMatchesCompletenessFilters(r, incompleteFiltersOnly, listingGapsOnly, algorithmSpecGapsOnly)) {
        return false;
      }
      if (categoryId !== "all" && r.categoryId !== categoryId) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        if (!r.name.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [rows, categoryId, q, incompleteFiltersOnly, listingGapsOnly, algorithmSpecGapsOnly]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col flex-wrap gap-3 lg:flex-row lg:items-end">
        <div className="min-w-[12rem] flex-1 space-y-1.5">
          <Label htmlFor="admin-prod-search">Suchen</Label>
          <Input id="admin-prod-search" placeholder="Suchen…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="min-w-[12rem] space-y-1.5">
          <Label htmlFor="admin-prod-cat">Kategorie</Label>
          <SimpleSelect
            id="admin-prod-cat"
            value={categoryId}
            onValueChange={setCategoryId}
            options={[
              { value: "all", label: "Alle Kategorien" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            triggerClassName="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>
        <CompletenessFilterGroup
          incompleteFiltersOnly={incompleteFiltersOnly}
          setIncompleteFiltersOnly={setIncompleteFiltersOnly}
          listingGapsOnly={listingGapsOnly}
          setListingGapsOnly={setListingGapsOnly}
          algorithmSpecGapsOnly={algorithmSpecGapsOnly}
          setAlgorithmSpecGapsOnly={setAlgorithmSpecGapsOnly}
        />
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => router.refresh()}>
          <RefreshCw className="mr-2 size-4" aria-hidden />
          Sichtbare aktualisieren ({filtered.length})
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/70">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-border/70 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Produkt</th>
              <th className="px-4 py-3 font-medium">Kategorie</th>
              <th className="px-4 py-3 font-medium text-right">Preis</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="w-px px-2 py-3 text-right font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-card/90">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="max-w-[22rem] px-4 py-2">
                  <div className="flex min-w-0 items-start gap-3">
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Produkt-URLs beliebig
                      <img
                        src={r.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                        className="mt-0.5 size-10 shrink-0 rounded-lg border border-border/60 bg-muted/40 object-contain"
                      />
                    ) : (
                      <span
                        className="mt-0.5 block size-10 shrink-0 rounded-lg border border-dashed border-border/50 bg-muted/25"
                        title="Kein Produktfoto"
                        aria-hidden
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground" title={r.name}>
                        {r.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatAdminDateShort(new Date(r.updatedAt))}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <AdminReadonlyBadge variant="category">{r.categoryName}</AdminReadonlyBadge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatAdminPriceEUR(r.price)}</td>
                <td className="px-4 py-3 align-middle">
                  <AdminReadonlyBadge variant={r.isActive ? "active" : "inactive"}>
                    {r.isActive ? "Aktiv" : "Inaktiv"}
                  </AdminReadonlyBadge>
                </td>
                <td className="px-2 py-2 align-middle">
                  <AdminCatalogRowActions
                    kind="product"
                    id={r.id}
                    name={r.name}
                    editHref={`/admin/products/${r.id}`}
                    entityLabel="Produkt"
                    productPreviewId={r.id}
                    amazonUrl={r.affiliateUrl}
                    previewRows={[]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Keine Einträge für die aktuelle Filterung.</p> : null}
    </div>
  );
}

function CompletenessFilterGroup({
  incompleteFiltersOnly,
  setIncompleteFiltersOnly,
  listingGapsOnly,
  setListingGapsOnly,
  algorithmSpecGapsOnly,
  setAlgorithmSpecGapsOnly,
}: {
  incompleteFiltersOnly: boolean;
  setIncompleteFiltersOnly: (v: boolean) => void;
  listingGapsOnly: boolean;
  setListingGapsOnly: (v: boolean) => void;
  algorithmSpecGapsOnly: boolean;
  setAlgorithmSpecGapsOnly: (v: boolean) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 pb-2 lg:max-w-xl lg:pb-3">
      <p className="text-xs font-medium text-muted-foreground">Lücken (mehrere möglich, ODER-Verknüpfung)</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label
          className="flex cursor-pointer items-center gap-2 text-sm"
          title="Fehlende oder leere CategoryFilter-Werte (Schlüssel brand zählt nicht), wie in PS-7."
        >
          <input
            type="checkbox"
            className="size-4 shrink-0 rounded border"
            checked={incompleteFiltersOnly}
            onChange={(e) => setIncompleteFiltersOnly(e.target.checked)}
          />
          <Filter className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          Unvollständige Filter-Werte
        </label>
        <label
          className="flex cursor-pointer items-center gap-2 text-sm"
          title="Kein Produktfoto oder kein Preis hinterlegt."
        >
          <input
            type="checkbox"
            className="size-4 shrink-0 rounded border"
            checked={listingGapsOnly}
            onChange={(e) => setListingGapsOnly(e.target.checked)}
          />
          Ohne Foto oder Preis
        </label>
        <label
          className="flex cursor-pointer items-center gap-2 text-sm"
          title="Wie „Katalogabdeckung“: in Wechselrichter-/Solar-/Kabel-/Shore-Charger-Kategorien fehlen powerW, currentA oder crossSectionMm2."
        >
          <input
            type="checkbox"
            className="size-4 shrink-0 rounded border"
            checked={algorithmSpecGapsOnly}
            onChange={(e) => setAlgorithmSpecGapsOnly(e.target.checked)}
          />
          Ohne Algorithmus-Spec
        </label>
      </div>
    </div>
  );
}
