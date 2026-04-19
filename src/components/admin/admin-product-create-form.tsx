"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { AdminProductFormFields } from "@/components/admin/admin-product-form-fields";
import { useAdminProductForm } from "@/components/admin/use-admin-product-form";
import { adminCatalogCreateProductAction } from "@/lib/admin/catalog-actions";
import type { AdminCategoryFilterEditorRow } from "@/lib/db/queries/admin-catalog-read";
import { Button } from "@/components/ui/button";

type Props = {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  initialCategoryId: string;
  initialFilters: AdminCategoryFilterEditorRow[];
};

export function AdminProductCreateForm({ categories, brands, initialCategoryId, initialFilters }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useAdminProductForm({
    name: "",
    description: null,
    icon: null,
    imageUrl: null,
    affiliateUrl: null,
    asin: null,
    price: null,
    categoryId: initialCategoryId,
    specs: "",
    isActive: true,
    brandId: null,
    filterValues: {},
    filters: initialFilters,
  });

  const [success, setSuccess] = useState<string | null>(null);

  function submit() {
    form.setError(null);
    setSuccess(null);
    const payload = form.buildPayload();
    if (!payload.ok) {
      form.setError(payload.message);
      return;
    }
    if (payload.data.name.length === 0) {
      form.setError("Name erforderlich.");
      return;
    }
    startTransition(async () => {
      const res = await adminCatalogCreateProductAction(payload.data);
      if (!res.ok) {
        form.setError(res.message);
        return;
      }
      setSuccess("Angelegt.");
      router.push(`/admin/products/${res.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Neues Produkt</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stammdaten, Filter, Bild und Specs anlegen.</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/products">Zur Liste</Link>
        </Button>
      </div>

      {form.error ? <p className="text-sm text-destructive">{form.error}</p> : null}
      {success ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p> : null}

      <AdminProductFormFields form={form} categories={categories} brands={brands} />

      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={pending} onClick={() => submit()}>
          <Plus className="mr-2 size-4" aria-hidden />
          {pending ? "Anlegen…" : "Anlegen"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">Abbrechen</Link>
        </Button>
      </div>
    </div>
  );
}
