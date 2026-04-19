"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";

import { adminCatalogUpsertBrandMappingAction } from "@/lib/admin/catalog-actions";
import type { AdminBrandFilterCategoryRow } from "@/lib/db/queries/admin-catalog-read";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  groups: AdminBrandFilterCategoryRow[];
  productCategories: { id: string; name: string; slug: string }[];
};

export function AdminBrandCategoryMapping({ groups, productCategories }: Props) {
  const [state, setState] = useState<AdminBrandFilterCategoryRow[]>(() => [...groups]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (state.length === 0) {
    return (
      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Kategorien-Zuordnung für Marken-Präferenzen</CardTitle>
          <CardDescription>Noch keine Wizard-Gruppen definiert.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  function toggle(key: string, slug: string) {
    setState((prev) =>
      prev.map((g) =>
        g.key === key
          ? {
              ...g,
              categorySlugs: g.categorySlugs.includes(slug)
                ? g.categorySlugs.filter((s) => s !== slug)
                : [...g.categorySlugs, slug],
            }
          : g,
      ),
    );
  }

  function saveGroup(key: string) {
    setError(null);
    setSuccess(null);
    const g = state.find((x) => x.key === key);
    if (!g) return;
    startTransition(async () => {
      const res = await adminCatalogUpsertBrandMappingAction(g);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setSuccess(`"${g.label}" gespeichert.`);
    });
  }

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Kategorien-Zuordnung für Marken-Präferenzen</CardTitle>
        <CardDescription>
          Welche Produktkategorien gehören zu welcher Wizard-Gruppe? Im Wizard erscheinen nur Marken mit aktiven
          Produkten in mindestens einer zugeordneten Kategorie.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p> : null}

        {state.map((g) => (
          <div key={g.key} className="rounded-xl border border-border/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">{g.label}</p>
                <p className="text-xs text-muted-foreground">Key: {g.key}</p>
              </div>
              <Button type="button" size="sm" disabled={pending} onClick={() => saveGroup(g.key)}>
                <Save className="mr-1.5 size-4" aria-hidden />
                Speichern
              </Button>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {productCategories.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border"
                      checked={g.categorySlugs.includes(c.slug)}
                      onChange={() => toggle(g.key, c.slug)}
                    />
                    <span>{c.name}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{c.slug}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
