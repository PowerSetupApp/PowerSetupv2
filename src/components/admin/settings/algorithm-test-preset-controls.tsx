"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import {
  createAlgorithmTestUserPresetAction,
  deleteAlgorithmTestUserPresetAction,
  getAlgorithmTestPresetByIdAction,
  listAlgorithmTestPresetsAction,
  updateAlgorithmTestUserPresetAction,
} from "@/app/admin/settings/actions";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/ui/simple-select";
import type { AlgorithmInput } from "@/lib/algorithm/types";
import type { AlgorithmTestPresetListItem } from "@/lib/db/queries/admin-algorithm-test-presets";
import { algorithmInputSchema } from "@/lib/schemas/wizard-input";

export type AlgorithmTestPresetControlsProps = {
  formInput: AlgorithmInput;
  disabled: boolean;
  onApplyPreset: (input: AlgorithmInput) => void;
  onError: (message: string | null) => void;
};

export function AlgorithmTestPresetControls({
  formInput,
  disabled,
  onApplyPreset,
  onError,
}: AlgorithmTestPresetControlsProps) {
  const [presets, setPresets] = useState<AlgorithmTestPresetListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const refresh = useCallback(async () => {
    setLoadingList(true);
    try {
      const rows = await listAlgorithmTestPresetsAction();
      setPresets(rows);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleApply = async () => {
    if (!selectedPresetId) return;
    setBusy(true);
    onError(null);
    try {
      const row = await getAlgorithmTestPresetByIdAction(selectedPresetId);
      if (!row) {
        onError("Preset nicht gefunden.");
        return;
      }
      const parsed = algorithmInputSchema.safeParse(row.formData);
      if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join(" · ");
        onError(msg || "Preset-Daten ungültig.");
        return;
      }
      onApplyPreset(parsed.data as AlgorithmInput);
      onError(null);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    setBusy(true);
    onError(null);
    try {
      const res = await createAlgorithmTestUserPresetAction({
        name: newName,
        description: newDescription || null,
        formData: formInput,
      });
      if (!res.ok) {
        onError(res.message);
        return;
      }
      setSaveOpen(false);
      setNewName("");
      setNewDescription("");
      await refresh();
      setSelectedPresetId(res.preset.id);
      onError(null);
    } finally {
      setBusy(false);
    }
  };

  const handleOverwrite = async () => {
    if (!selectedPresetId) return;
    setBusy(true);
    onError(null);
    try {
      const res = await updateAlgorithmTestUserPresetAction(selectedPresetId, { formData: formInput });
      if (!res.ok) {
        onError(res.message);
        return;
      }
      onError(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPresetId) return;
    setBusy(true);
    onError(null);
    try {
      const res = await deleteAlgorithmTestUserPresetAction(selectedPresetId);
      if (!res.ok) {
        onError(res.message);
        return;
      }
      setDeleteOpen(false);
      setSelectedPresetId("");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border/80 bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Bookmark className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <h4 className="text-sm font-semibold text-foreground">Nutzer-Presets</h4>
        {loadingList ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden /> : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Lege realistische Szenarien (Bordnetz, Quellen, Verbraucher, Dach …) als Preset ab. „Zufällige Filter“ ändert
        danach nur noch Reiseverhalten, Autarkie, Kabel usw.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[220px] flex-1 space-y-2">
          <Label htmlFor="at-preset-select">Preset</Label>
          <SimpleSelect
            id="at-preset-select"
            value={selectedPresetId}
            onValueChange={setSelectedPresetId}
            emptyOptionLabel="— auswählen —"
            options={presets.map((p) => ({
              value: p.id,
              label: p.description ? `${p.name} (${p.description})` : p.name,
            }))}
            disabled={disabled || busy || loadingList}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={disabled || busy || !selectedPresetId} onClick={() => void handleApply()}>
            Übernehmen
          </Button>
          <Button type="button" variant="outline" disabled={disabled || busy} onClick={() => setSaveOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Neues Preset
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || busy || !selectedPresetId}
            onClick={() => void handleOverwrite()}
          >
            <Pencil className="size-4" aria-hidden />
            Auswahl überschreiben
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={disabled || busy || !selectedPresetId}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden />
            Löschen
          </Button>
        </div>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Nutzer-Preset</DialogTitle>
            <DialogDescription>Speichert die aktuellen Testeingaben als wiederverwendbares Szenario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="at-preset-name">Name</Label>
              <Input
                id="at-preset-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="z. B. Familie 12 V, Wochenend-Camper"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="at-preset-desc">Kurzbeschreibung (optional)</Label>
              <Input
                id="at-preset-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Interne Notiz"
                disabled={busy}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)} disabled={busy}>
              Abbrechen
            </Button>
            <Button type="button" onClick={() => void handleCreate()} disabled={busy || !newName.trim()}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Preset löschen?</AlertDialogTitle>
            <AlertDialogDescription>Dieser Eintrag wird dauerhaft entfernt.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Abbrechen</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={busy} onClick={() => void handleDelete()}>
              Löschen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
