"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ExternalLink, MoreVertical, Pencil, Eye, Trash2 } from "lucide-react";

import { AdminProductPreviewPanel } from "@/components/admin/admin-product-preview-panel";
import {
  runAdminCatalogDelete,
  type AdminCatalogRowKind,
} from "@/components/admin/admin-catalog-delete-dispatcher";
import { useAdminProductViewDialog } from "@/components/admin/use-admin-product-view-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type AdminCatalogRowPreviewRow = { label: string; value: string };

export type { AdminCatalogRowKind };

type Props = {
  kind: AdminCatalogRowKind;
  id: string;
  name: string;
  editHref: string;
  previewRows: AdminCatalogRowPreviewRow[];
  entityLabel: string;
  productPreviewId?: string;
  /** Nur Produkte: Amazon-Affiliate-Link für Icon + Menüeintrag */
  amazonUrl?: string | null;
};

export function AdminCatalogRowActions({
  kind,
  id,
  name,
  editHref,
  previewRows,
  entityLabel,
  productPreviewId,
  amazonUrl,
}: Props) {
  const router = useRouter();
  const {
    viewOpen,
    openViewDialog,
    onViewOpenChange,
    productPreviewLoading,
    productPreviewError,
    productPreviewData,
  } = useAdminProductViewDialog(productPreviewId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasPreview = Boolean(productPreviewId) || previewRows.length > 0;
  const amazon = amazonUrl?.trim() ?? "";

  async function handleDelete() {
    setDeleteBusy(true);
    setActionError(null);
    const res = await runAdminCatalogDelete(kind, id);
    setDeleteBusy(false);
    if (!res.ok) {
      setActionError(res.message);
      return;
    }
    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end gap-0.5">
        {amazon ? (
          <Button asChild variant="ghost" size="icon" className="size-9" title="Bei Amazon ansehen">
            <a href={amazon} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" aria-hidden />
              <span className="sr-only">Bei Amazon ansehen: {name}</span>
            </a>
          </Button>
        ) : null}
        <Button asChild variant="ghost" size="icon" className="size-9" title="Bearbeiten">
          <Link href={editHref}>
            <Pencil className="size-4" aria-hidden />
            <span className="sr-only">Bearbeiten: {name}</span>
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="size-9" title="Weitere Aktionen">
              <MoreVertical className="size-4" aria-hidden />
              <span className="sr-only">Weitere Aktionen: {name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {hasPreview ? (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  queueMicrotask(() => void openViewDialog());
                }}
              >
                <Eye className="size-4" aria-hidden />
                Ansehen
              </DropdownMenuItem>
            ) : null}
            {amazon ? (
              <DropdownMenuItem asChild>
                <a href={amazon} target="_blank" rel="noopener noreferrer" className="flex cursor-default items-center gap-2">
                  <ExternalLink className="size-4" aria-hidden />
                  Bei Amazon ansehen
                </a>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <Link href={editHref} className="flex cursor-default items-center gap-2">
                <Pencil className="size-4" aria-hidden />
                Bearbeiten
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                setActionError(null);
                queueMicrotask(() => setDeleteOpen(true));
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={viewOpen} onOpenChange={onViewOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{entityLabel} ansehen</DialogTitle>
          </DialogHeader>
          {productPreviewId ? (
            <AdminProductPreviewPanel
              loading={productPreviewLoading}
              errorMessage={productPreviewError}
              data={productPreviewData}
            />
          ) : (
            <dl className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-2 text-sm">
              {previewRows.map((row) => (
                <React.Fragment key={row.label}>
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="min-w-0 break-words text-foreground">{row.value}</dd>
                </React.Fragment>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{entityLabel} löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{name}“ wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Abbrechen</AlertDialogCancel>
            <Button variant="destructive" disabled={deleteBusy} onClick={() => void handleDelete()}>
              {deleteBusy ? "Löschen…" : "Löschen"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
