"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Save } from "lucide-react";

import {
  adminCatalogCreateCategoryAction,
  adminCatalogUpdateCategoryAction,
} from "@/lib/admin/catalog-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Initial = {
  id?: string;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
};

type Props = { initial?: Initial };

export function AdminCategoryForm({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);

  function submit() {
    setError(null);
    setSuccess(null);
    const payload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      icon: icon.trim() || null,
      sortOrder,
    };
    startTransition(async () => {
      if (initial?.id) {
        const res = await adminCatalogUpdateCategoryAction({ id: initial.id, ...payload });
        if (!res.ok) {
          setError(res.message);
          return;
        }
        setSuccess("Gespeichert.");
        router.refresh();
        return;
      }
      const res = await adminCatalogCreateCategoryAction(payload);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push(`/admin/categories/${res.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p> : null}

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Stammdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-slug">Slug</Label>
            <Input id="c-slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono" placeholder="z. B. batterien" />
            <p className="text-xs text-muted-foreground">Nur Kleinbuchstaben, Ziffern und Bindestriche.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-icon">Icon (Emoji)</Label>
              <Input id="c-icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-sort">Sortierung</Label>
              <Input
                id="c-sort"
                type="number"
                value={String(sortOrder)}
                onChange={(e) => setSortOrder(Number.parseInt(e.target.value || "0", 10) || 0)}
                inputMode="numeric"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={pending} onClick={() => submit()}>
          <Save className="mr-2 size-4" aria-hidden />
          {pending ? "Speichern…" : "Speichern"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/categories">Abbrechen</Link>
        </Button>
      </div>
    </div>
  );
}
