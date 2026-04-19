"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Save } from "lucide-react";

import {
  adminCatalogCreateConsumerCategoryAction,
  adminCatalogUpdateConsumerCategoryAction,
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

export function AdminConsumerCategoryForm({ initial }: Props) {
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
        const res = await adminCatalogUpdateConsumerCategoryAction({ id: initial.id, ...payload });
        if (!res.ok) {
          setError(res.message);
          return;
        }
        setSuccess("Gespeichert.");
        router.refresh();
        return;
      }
      const res = await adminCatalogCreateConsumerCategoryAction(payload);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push(`/admin/consumer-categories/${res.id}`);
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
            <Label htmlFor="cc-name">Name</Label>
            <Input id="cc-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cc-slug">Slug</Label>
            <Input
              id="cc-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="font-mono"
              placeholder="z. B. kueche"
            />
            <p className="text-xs text-muted-foreground">Nur Kleinbuchstaben, Ziffern und Bindestriche.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cc-icon">Icon (Emoji)</Label>
              <Input id="cc-icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-sort">Sortierung</Label>
              <Input
                id="cc-sort"
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
          <Link href="/admin/consumer-categories">Abbrechen</Link>
        </Button>
      </div>
    </div>
  );
}
