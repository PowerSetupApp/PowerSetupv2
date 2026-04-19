"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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

export function AdminBrandAddDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="mr-2 size-4" aria-hidden />
          Marke hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Marke erstellen</DialogTitle>
          <DialogDescription>Lege eine neue Marke an, die im Wizard zur Auswahl steht.</DialogDescription>
        </DialogHeader>
        <AdminBrandDialogForm
          mode="create"
          initial={{ name: "", types: [], isActive: true, showInPreferences: true }}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
