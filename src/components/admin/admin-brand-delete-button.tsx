"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { adminCatalogDeleteBrandAction } from "@/lib/admin/catalog-actions";
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

type Props = { id: string; name: string };

export function AdminBrandDeleteButton({ id, name }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await adminCatalogDeleteBrandAction(id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 text-destructive hover:text-destructive"
          title="Löschen"
        >
          <Trash2 className="size-4" aria-hidden />
          <span className="sr-only">Löschen: {name}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Marke löschen?</AlertDialogTitle>
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
