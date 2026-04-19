"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Save } from "lucide-react";

import { AdminProductFormFields } from "@/components/admin/admin-product-form-fields";
import { useAdminProductForm } from "@/components/admin/use-admin-product-form";
import { adminCatalogUpdateProductAction } from "@/lib/admin/catalog-actions";
import type { AdminProductEditorPayload } from "@/lib/db/queries/admin-catalog-read";
import { Button } from "@/components/ui/button";

type Props = { initial: AdminProductEditorPayload };

export function AdminProductEditForm({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);

  const form = useAdminProductForm({
    name: initial.name,
    description: initial.description,
    icon: initial.icon,
    imageUrl: initial.imageUrl,
    affiliateUrl: initial.affiliateUrl,
    asin: initial.asin,
    price: initial.price,
    categoryId: initial.categoryId,
    specs: initial.specs,
    isActive: initial.isActive,
    brandId: initial.brandId,
    filterValues: initial.filterValues,
    filters: initial.category.filters,
  });

  function submit() {
    form.setError(null);
    setSuccess(null);
    const payload = form.buildPayload();
    if (!payload.ok) {
      form.setError(payload.message);
      return;
    }
    startTransition(async () => {
      const res = await adminCatalogUpdateProductAction({ id: initial.id, ...payload.data });
      if (!res.ok) {
        form.setError(res.message);
        return;
      }
      setSuccess("Gespeichert.");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Produkt bearbeiten</h1>
          <p className="mt-1 text-sm text-muted-foreground">{form.name || "—"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.affiliateUrl.trim() ? (
            <Button asChild variant="outline" size="sm">
              <a href={form.affiliateUrl.trim()} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 size-4" aria-hidden />
                Amazon
              </a>
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/products">Zur Liste</Link>
          </Button>
        </div>
      </div>

      {form.error ? <p className="text-sm text-destructive">{form.error}</p> : null}
      {success ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p> : null}

      <AdminProductFormFields form={form} categories={initial.categories} brands={initial.brands} />

      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={pending} onClick={() => submit()}>
          <Save className="mr-2 size-4" aria-hidden />
          {pending ? "Speichern…" : "Speichern"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">Abbrechen</Link>
        </Button>
      </div>
    </div>
  );
}
