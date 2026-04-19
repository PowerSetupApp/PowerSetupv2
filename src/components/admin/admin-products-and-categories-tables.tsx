import { AdminCatalogRowActions } from "@/components/admin/admin-catalog-row-actions";
import type { AdminProductCategoryRow } from "@/lib/db/queries/admin-catalog-read";

type ProductCategoriesProps = { rows: AdminProductCategoryRow[] };

export function AdminProductCategoriesTable({ rows }: ProductCategoriesProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b border-border/70 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium text-right">Produkte</th>
            <th className="px-4 py-3 font-medium text-right">Sortierung</th>
            <th className="w-px px-2 py-3 text-right font-medium">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 bg-card/90">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.slug}</td>
              <td className="px-4 py-3 text-right tabular-nums">{r.productCount}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.sortOrder}</td>
              <td className="px-2 py-2 align-middle">
                <AdminCatalogRowActions
                  kind="productCategory"
                  id={r.id}
                  name={r.name}
                  editHref={`/admin/categories/${r.id}`}
                  entityLabel="Produktkategorie"
                  previewRows={[
                    { label: "Name", value: r.name },
                    { label: "Slug", value: r.slug },
                    { label: "Produkte", value: String(r.productCount) },
                    { label: "Sortierung", value: String(r.sortOrder) },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
