"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { adminCatalogDeleteProductAction } from "@/lib/admin/catalog-actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = {
  id: string;
  name: string;
  /** After successful delete, go to product list (edit page); default true */
  redirectToList?: boolean;
};

export function AdminProductDeleteButton({ id, name, redirectToList = true }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await adminCatalogDeleteProductAction(id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setOpen(false);
      if (redirectToList) {
        router.push("/admin/products");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="border-destructive/50 text-destructive">
          <Trash2 className="mr-2 size-4" aria-hidden />
          Produkt löschen
          <span className="sr-only">: {name}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Produkt löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            „{name}“ wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Abbrechen</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={() => run()}>
            {pending ? "Löschen…" : "Löschen"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
