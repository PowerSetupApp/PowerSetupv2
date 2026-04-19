"use client";

import { useEffect, useState } from "react";

import { adminCatalogGetProductPreviewAction } from "@/lib/admin/catalog-actions";
import type { AdminProductPreviewRow } from "@/lib/db/queries/admin-catalog-read";

export function useAdminProductViewDialog(productPreviewId: string | undefined) {
  const [viewOpen, setViewOpen] = useState(false);
  const [productPreviewLoading, setProductPreviewLoading] = useState(false);
  const [productPreviewError, setProductPreviewError] = useState<string | null>(null);
  const [productPreviewData, setProductPreviewData] = useState<AdminProductPreviewRow | null>(null);

  useEffect(() => {
    if (!viewOpen || !productPreviewId) return;

    let cancelled = false;

    adminCatalogGetProductPreviewAction(productPreviewId).then(
      (res) => {
        if (cancelled) return;
        setProductPreviewLoading(false);
        if (!res.ok) {
          setProductPreviewError(res.message);
          return;
        }
        setProductPreviewData(res.data);
      },
      (err: unknown) => {
        if (cancelled) return;
        setProductPreviewLoading(false);
        setProductPreviewError(
          err instanceof Error ? err.message : "Laden fehlgeschlagen",
        );
      },
    );

    return () => {
      cancelled = true;
    };
  }, [viewOpen, productPreviewId]);

  function openViewDialog() {
    setViewOpen(true);
    if (!productPreviewId) {
      setProductPreviewLoading(false);
      setProductPreviewError(null);
      setProductPreviewData(null);
      return;
    }
    setProductPreviewLoading(true);
    setProductPreviewError(null);
    setProductPreviewData(null);
  }

  function onViewOpenChange(next: boolean) {
    setViewOpen(next);
    if (!next) {
      setProductPreviewLoading(false);
      setProductPreviewError(null);
      setProductPreviewData(null);
    }
  }

  return {
    viewOpen,
    openViewDialog,
    onViewOpenChange,
    productPreviewLoading,
    productPreviewError,
    productPreviewData,
  };
}
