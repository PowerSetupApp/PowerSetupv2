"use client";

import { AdminMediaModal } from "@/components/admin/admin-media-modal";
import { AdminProductFilterField } from "@/components/admin/admin-product-filter-field";
import { AdminSpecsOptimizeButton } from "@/components/admin/admin-specs-optimize-button";
import type { AdminProductFormState } from "@/components/admin/use-admin-product-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/ui/simple-select";
import { Textarea } from "@/components/ui/textarea";
import { formatAdminPriceEUR } from "@/lib/admin/format-admin";

type Props = {
  form: AdminProductFormState;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
};

export function AdminProductFormFields({ form, categories, brands }: Props) {
  const selectStyles =
    "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
  const categoryName = categories.find((c) => c.id === form.categoryId)?.name ?? null;

  return (
    <>
      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Grunddaten</CardTitle>
          <CardDescription>Name, Kategorie, Preis und Sichtbarkeit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" value={form.name} onChange={(e) => form.setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-cat">Kategorie</Label>
            <SimpleSelect
              id="p-cat"
              value={form.categoryId}
              onValueChange={(v) => void form.changeCategory(v)}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              triggerClassName={selectStyles}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-price">Preis</Label>
              <Input
                id="p-price"
                value={form.priceStr}
                onChange={(e) => form.setPriceStr(e.target.value)}
                inputMode="decimal"
                placeholder="z. B. 17,99"
              />
              <p className="text-xs text-muted-foreground">
                Anzeige:{" "}
                {formatAdminPriceEUR(
                  form.priceStr.trim() === "" ? null : Number.parseFloat(form.priceStr.replace(",", ".")) || null,
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-icon">Icon (Emoji)</Label>
              <Input id="p-icon" value={form.icon} onChange={(e) => form.setIcon(e.target.value)} placeholder="z. B. 🔋" />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border"
              checked={form.isActive}
              onChange={(e) => form.setIsActive(e.target.checked)}
            />
            Produkt ist aktiv
          </label>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Filter-Werte</CardTitle>
          <CardDescription>Abhängig von der gewählten Kategorie</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!form.brandFilter ? (
            <div className="space-y-2">
              <Label htmlFor="p-brand">Marke</Label>
              <SimpleSelect
                id="p-brand"
                value={form.brandId ?? ""}
                onValueChange={(v) => form.setBrandId(v || null)}
                emptyOptionLabel="Keine Marke"
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
                triggerClassName={selectStyles}
              />
            </div>
          ) : null}
          {form.filters.map((f) => (
            <AdminProductFilterField
              key={f.id}
              filter={f}
              value={form.filterValues[f.key]}
              onChange={(v) => form.updateFilter(f.key, v, f.type)}
              brands={brands}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Bild &amp; Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-img">Produktbild (URL)</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="p-img"
                value={form.imageUrl}
                onChange={(e) => form.setImageUrl(e.target.value)}
                placeholder="https://…"
              />
              <AdminMediaModal onSelect={(url) => form.setImageUrl(url)} triggerLabel="Aus Mediathek" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-aff">Amazon-Link</Label>
            <Input
              id="p-aff"
              value={form.affiliateUrl}
              onChange={(e) => form.setAffiliateUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-asin">ASIN</Label>
            <Input id="p-asin" value={form.asin} onChange={(e) => form.setAsin(e.target.value)} className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Technische Spezifikationen</CardTitle>
              <CardDescription>Freitext / Markdown; optional per KI kürzen</CardDescription>
            </div>
            <AdminSpecsOptimizeButton
              text={form.specs}
              categoryName={categoryName}
              onOptimized={(next) => form.setSpecs(next)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Textarea value={form.specs} onChange={(e) => form.setSpecs(e.target.value)} rows={14} className="font-mono text-xs" />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Beschreibung</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={form.description} onChange={(e) => form.setDescription(e.target.value)} rows={4} />
        </CardContent>
      </Card>
    </>
  );
}
