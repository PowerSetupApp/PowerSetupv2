"use client";

import { useMemo, useState } from "react";

import { adminCatalogListCategoryFiltersAction } from "@/lib/admin/catalog-actions";
import type { AdminCategoryFilterEditorRow } from "@/lib/db/queries/admin-catalog-read";

export type AdminProductFormInitial = {
  name: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  affiliateUrl: string | null;
  asin: string | null;
  price: number | null;
  categoryId: string;
  specs: string;
  isActive: boolean;
  brandId: string | null;
  filterValues: Record<string, unknown> | null;
  filters: AdminCategoryFilterEditorRow[];
};

export type AdminProductFormState = ReturnType<typeof useAdminProductForm>;

export function useAdminProductForm(initial: AdminProductFormInitial) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [icon, setIcon] = useState(initial.icon ?? "");
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? "");
  const [affiliateUrl, setAffiliateUrl] = useState(initial.affiliateUrl ?? "");
  const [asin, setAsin] = useState(initial.asin ?? "");
  const [priceStr, setPriceStr] = useState(initial.price != null ? String(initial.price) : "");
  const [specs, setSpecs] = useState(initial.specs);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [filters, setFilters] = useState<AdminCategoryFilterEditorRow[]>(initial.filters);
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>(initial.filterValues ?? {});
  const [brandId, setBrandId] = useState<string | null>(initial.brandId);
  const [error, setError] = useState<string | null>(null);

  const brandFilter = useMemo(() => filters.find((f) => f.type.toLowerCase() === "brand"), [filters]);

  async function changeCategory(nextCategoryId: string): Promise<void> {
    setCategoryId(nextCategoryId);
    setFilterValues({});
    setBrandId(null);
    const res = await adminCatalogListCategoryFiltersAction(nextCategoryId);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setFilters(res.data);
    setError(null);
  }

  function updateFilter(key: string, value: unknown, type: string): void {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    if (type.toLowerCase() === "brand") {
      setBrandId(typeof value === "string" && value.length > 0 ? value : null);
    }
  }

  function buildPayload(): {
    ok: true;
    data: {
      name: string;
      description: string | null;
      icon: string | null;
      imageUrl: string | null;
      affiliateUrl: string | null;
      asin: string | null;
      price: number | null;
      categoryId: string;
      specs: string;
      isActive: boolean;
      brandId: string | null;
      filterValues: Record<string, unknown>;
    };
  } | { ok: false; message: string } {
    const priceParsed = priceStr.trim() === "" ? null : Number.parseFloat(priceStr.replace(",", "."));
    if (priceStr.trim() !== "" && (priceParsed === null || Number.isNaN(priceParsed))) {
      return { ok: false, message: "Preis ist keine gültige Zahl." };
    }
    const resolvedBrandId = brandFilter
      ? typeof filterValues[brandFilter.key] === "string"
        ? ((filterValues[brandFilter.key] as string) || null)
        : null
      : brandId;

    return {
      ok: true,
      data: {
        name: name.trim(),
        description: description.trim() || null,
        icon: icon.trim() || null,
        imageUrl: imageUrl.trim() || null,
        affiliateUrl: affiliateUrl.trim() || null,
        asin: asin.trim() || null,
        price: priceParsed,
        categoryId,
        specs,
        isActive,
        brandId: resolvedBrandId,
        filterValues,
      },
    };
  }

  return {
    name, setName,
    description, setDescription,
    icon, setIcon,
    imageUrl, setImageUrl,
    affiliateUrl, setAffiliateUrl,
    asin, setAsin,
    priceStr, setPriceStr,
    specs, setSpecs,
    isActive, setIsActive,
    categoryId, filters, filterValues, brandId, brandFilter,
    error, setError,
    changeCategory,
    updateFilter,
    setBrandId,
    buildPayload,
  };
}
