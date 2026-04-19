"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";

import { AdminBrandDialogForm } from "@/components/admin/admin-brand-dialog-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  id: string;
  name: string;
  types: string[];
  isActive: boolean;
  showInPreferences: boolean;
};

export function AdminBrandEditDialog(props: Props) {
  const [open, setOpen] = useState(false);
  // startTransition is not needed here; state lives in the dialog form.
  useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-9" title="Bearbeiten">
          <Pencil className="size-4" aria-hidden />
          <span className="sr-only">Bearbeiten: {props.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marke bearbeiten</DialogTitle>
          <DialogDescription>Stammdaten der Marke aktualisieren.</DialogDescription>
        </DialogHeader>
        <AdminBrandDialogForm
          mode="update"
          initial={{
            id: props.id,
            name: props.name,
            types: props.types,
            isActive: props.isActive,
            showInPreferences: props.showInPreferences,
          }}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
