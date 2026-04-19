"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

import { AdminMediaManager } from "@/components/admin/admin-media-manager";
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
  onSelect: (url: string) => void;
  triggerLabel?: string;
};

export function AdminMediaModal({ onSelect, triggerLabel = "Mediathek" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ImageIcon className="mr-2 size-4" aria-hidden />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bild aus Mediathek wählen</DialogTitle>
          <DialogDescription>Lade ein neues Bild hoch oder wähle ein bestehendes aus.</DialogDescription>
        </DialogHeader>
        <AdminMediaManager
          selectable
          onSelect={(b) => {
            onSelect(b.url);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
