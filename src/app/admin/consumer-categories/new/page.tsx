import { AdminConsumerCategoryForm } from "@/components/admin/admin-consumer-category-form";

export default function AdminConsumerCategoryNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Neue Verbraucher-Kategorie</h1>
        <p className="mt-2 text-sm text-muted-foreground">Gruppe für Verbraucher-Geräte im Wizard.</p>
      </div>
      <AdminConsumerCategoryForm />
    </div>
  );
}
