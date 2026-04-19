"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { RefreshCw, Trash2, UploadCloud } from "lucide-react";

import type { AdminMediaBlob } from "@/lib/db/queries/admin-media";
import { adminMediaDeleteAction, adminMediaListAction } from "@/lib/admin/media-actions";
import {
  ADMIN_MEDIA_ALLOWED_MIME,
  ADMIN_MEDIA_MAX_BYTES,
} from "@/lib/schemas/admin-media-upload";
import { Button } from "@/components/ui/button";

type Props = {
  onSelect?: (blob: AdminMediaBlob) => void;
  selectable?: boolean;
};

export function AdminMediaManager({ onSelect, selectable = false }: Props) {
  const [blobs, setBlobs] = useState<AdminMediaBlob[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(() => {
    startTransition(async () => {
      const res = await adminMediaListAction();
      if (!res.ok) {
        setBlobs([]);
        setError(res.message);
        return;
      }
      setBlobs(res.blobs);
      setError(null);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFile(file: File) {
    setNotice(null);
    setError(null);
    if (!(ADMIN_MEDIA_ALLOWED_MIME as readonly string[]).includes(file.type)) {
      setError("Nur PNG, JPEG oder WebP.");
      return;
    }
    if (file.size > ADMIN_MEDIA_MAX_BYTES) {
      setError(`Datei ist zu groß (max ${Math.round(ADMIN_MEDIA_MAX_BYTES / (1024 * 1024))} MiB).`);
      return;
    }

    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    try {
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: form });
      const json = (await res.json()) as { url?: string; message?: string };
      if (!res.ok) {
        setError(json.message ?? "Upload fehlgeschlagen.");
        return;
      }
      setNotice("Hochgeladen.");
      load();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(url: string) {
    setNotice(null);
    setError(null);
    const res = await adminMediaDeleteAction(url);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setNotice("Gelöscht.");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept={ADMIN_MEDIA_ALLOWED_MIME.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <UploadCloud className="mr-2 size-4" aria-hidden />
          {uploading ? "Lade hoch…" : "Hochladen"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={pending}>
          <RefreshCw className="mr-2 size-4" aria-hidden />
          Aktualisieren
        </Button>
        <p className="text-xs text-muted-foreground">
          Erlaubt: PNG/JPEG/WebP bis {Math.round(ADMIN_MEDIA_MAX_BYTES / (1024 * 1024))} MiB.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{notice}</p> : null}

      {blobs === null ? (
        <p className="text-sm text-muted-foreground">Lade Dateien…</p>
      ) : blobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Dateien vorhanden.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {blobs.map((b) => (
            <li
              key={b.url}
              className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card/80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Blob-URLs aus Vercel, nicht durch next/image optimierbar */}
              <img
                src={b.url}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
              <div className="flex items-center justify-between gap-2 p-2 text-xs">
                <span className="min-w-0 truncate" title={b.pathname}>
                  {b.pathname.split("/").pop()}
                </span>
                <div className="flex shrink-0 gap-1">
                  {selectable ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => onSelect?.(b)}>
                      Wählen
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:text-destructive"
                    title="Löschen"
                    onClick={() => void handleDelete(b.url)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
