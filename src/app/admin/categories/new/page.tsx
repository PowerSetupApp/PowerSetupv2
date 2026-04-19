import { AdminCategoryForm } from "@/components/admin/admin-category-form";

export default function AdminCategoryNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Neue Produktkategorie</h1>
        <p className="mt-2 text-sm text-muted-foreground">Stammdaten anlegen; Filter folgen nach dem Anlegen.</p>
      </div>
      <AdminCategoryForm />
    </div>
  );
}
