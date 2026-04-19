import { AdminSettingsTabs } from "@/components/admin/settings/settings-tabs";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Einstellungen</h1>
        <p className="mt-2 text-sm text-muted-foreground">System, KI, Algorithmus, Preise, Amazon und JSON-Import/Export.</p>
      </div>
      <AdminSettingsTabs />
    </div>
  );
}
