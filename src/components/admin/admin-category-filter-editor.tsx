"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import {
  adminCatalogCreateCategoryFilterAction,
  adminCatalogDeleteCategoryFilterAction,
  adminCatalogUpdateCategoryFilterAction,
} from "@/lib/admin/catalog-actions";
import type { AdminCategoryFilterEditorRow } from "@/lib/db/queries/admin-catalog-read";
import { CATEGORY_FILTER_TYPES, type CategoryFilterType } from "@/lib/schemas/admin-category";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/ui/simple-select";

type Props = {
  categoryId: string;
  initial: AdminCategoryFilterEditorRow[];
};

type DraftFilter = {
  id: string | null;
  key: string;
  name: string;
  type: CategoryFilterType;
  unit: string;
  options: string;
  sortOrder: number;
};

function toDraft(row: AdminCategoryFilterEditorRow): DraftFilter {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    type: (CATEGORY_FILTER_TYPES as readonly string[]).includes(row.type)
      ? (row.type as CategoryFilterType)
      : "text",
    unit: row.unit ?? "",
    options: (row.options ?? []).join("\n"),
    sortOrder: row.sortOrder,
  };
}

function emptyDraft(sortOrder: number): DraftFilter {
  return { id: null, key: "", name: "", type: "text", unit: "", options: "", sortOrder };
}

export function AdminCategoryFilterEditor({ categoryId, initial }: Props) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftFilter[]>(initial.map(toDraft));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateDraft(idx: number, patch: Partial<DraftFilter>) {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function addDraft() {
    setDrafts((prev) => [...prev, emptyDraft(prev.length)]);
  }

  function removeDraft(idx: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save(idx: number) {
    setError(null);
    const d = drafts[idx];
    const options = d.options.split("\n").map((o) => o.trim()).filter(Boolean);
    const payload = {
      categoryId,
      key: d.key.trim(),
      name: d.name.trim(),
      type: d.type,
      unit: d.unit.trim() || null,
      options,
      sortOrder: d.sortOrder,
    };
    startTransition(async () => {
      if (d.id) {
        const res = await adminCatalogUpdateCategoryFilterAction({ id: d.id, ...payload });
        if (!res.ok) {
          setError(res.message);
          return;
        }
        router.refresh();
        return;
      }
      const res = await adminCatalogCreateCategoryFilterAction(payload);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    });
  }

  async function remove(idx: number) {
    const d = drafts[idx];
    if (!d.id) {
      removeDraft(idx);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await adminCatalogDeleteCategoryFilterAction(d.id as string, categoryId);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      removeDraft(idx);
      router.refresh();
    });
  }

  const selectStyles =
    "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-lg">Filter</CardTitle>
          <CardDescription>Definition der Filterfelder für diese Kategorie.</CardDescription>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addDraft}>
          <Plus className="mr-2 size-4" aria-hidden />
          Filter hinzufügen
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Filter.</p>
        ) : null}
        {drafts.map((d, idx) => (
          <div key={`${d.id ?? "new"}-${idx}`} className="rounded-xl border border-border/70 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Key</Label>
                <Input value={d.key} onChange={(e) => updateDraft(idx, { key: e.target.value })} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Anzeigename</Label>
                <Input value={d.name} onChange={(e) => updateDraft(idx, { name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`cat-filter-type-${d.id ?? "new"}-${idx}`}>Typ</Label>
                <SimpleSelect
                  id={`cat-filter-type-${d.id ?? "new"}-${idx}`}
                  value={d.type}
                  onValueChange={(v) => updateDraft(idx, { type: v as CategoryFilterType })}
                  options={CATEGORY_FILTER_TYPES.map((t) => ({ value: t, label: t }))}
                  triggerClassName={selectStyles}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Einheit (optional)</Label>
                <Input value={d.unit} onChange={(e) => updateDraft(idx, { unit: e.target.value })} placeholder="z. B. W, A" />
              </div>
              <div className="space-y-1.5">
                <Label>Sortierung</Label>
                <Input
                  type="number"
                  value={String(d.sortOrder)}
                  onChange={(e) => updateDraft(idx, { sortOrder: Number.parseInt(e.target.value || "0", 10) || 0 })}
                  inputMode="numeric"
                />
              </div>
              {(d.type === "select" || d.type === "multiselect") ? (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Optionen (eine je Zeile)</Label>
                  <textarea
                    rows={4}
                    value={d.options}
                    onChange={(e) => updateDraft(idx, { options: e.target.value })}
                    className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  />
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={pending} onClick={() => void save(idx)}>
                <Save className="mr-1.5 size-4" aria-hidden />
                {d.id ? "Speichern" : "Anlegen"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={pending}
                onClick={() => void remove(idx)}
              >
                <Trash2 className="mr-1.5 size-4" aria-hidden />
                {d.id ? "Löschen" : "Verwerfen"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
