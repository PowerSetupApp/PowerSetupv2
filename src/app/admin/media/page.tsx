import { AdminMediaManager } from "@/components/admin/admin-media-manager";

export default function AdminMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Mediathek</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bilder für Produkte. PNG, JPEG oder WebP, max. 5&nbsp;MiB pro Datei.
        </p>
      </div>
      <AdminMediaManager />
    </div>
  );
}
