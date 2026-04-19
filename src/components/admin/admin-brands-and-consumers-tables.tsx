import { AdminBrandEditDialog } from "@/components/admin/admin-brand-edit-dialog";
import { AdminBrandDeleteButton } from "@/components/admin/admin-brand-delete-button";
import { AdminCatalogRowActions } from "@/components/admin/admin-catalog-row-actions";
import type {
  AdminConsumerCategoryRow,
  AdminConsumerDeviceRow,
} from "@/lib/db/queries/admin-catalog-read";

import { AdminReadonlyBadge } from "./admin-readonly-badge";

export type AdminBrandsTableRow = {
  id: string;
  name: string;
  isActive: boolean;
  showInPreferences: boolean;
  types: string[];
};

type BrandsProps = { rows: AdminBrandsTableRow[] };

export function AdminBrandsTable({ rows }: BrandsProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-border/70 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Typen</th>
            <th className="px-4 py-3 font-medium">Wizard</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="w-px px-2 py-3 text-right font-medium">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 bg-card/90">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
              <td className="px-4 py-3">
                {r.types.length === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {r.types.map((t) => (
                      <AdminReadonlyBadge key={t} variant="neutral">
                        {t}
                      </AdminReadonlyBadge>
                    ))}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <AdminReadonlyBadge variant={r.showInPreferences ? "active" : "neutral"}>
                  {r.showInPreferences ? "Im Wizard" : "Ausgeblendet"}
                </AdminReadonlyBadge>
              </td>
              <td className="px-4 py-3">
                <AdminReadonlyBadge variant={r.isActive ? "active" : "inactive"}>
                  {r.isActive ? "Aktiv" : "Inaktiv"}
                </AdminReadonlyBadge>
              </td>
              <td className="px-2 py-2 align-middle">
                <div className="flex justify-end gap-0.5">
                  <AdminBrandEditDialog
                    id={r.id}
                    name={r.name}
                    types={r.types}
                    isActive={r.isActive}
                    showInPreferences={r.showInPreferences}
                  />
                  <AdminBrandDeleteButton id={r.id} name={r.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ConsumerCategoriesProps = { rows: AdminConsumerCategoryRow[] };

export function AdminConsumerCategoriesTable({ rows }: ConsumerCategoriesProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <table className="w-full min-w-[38rem] text-left text-sm">
        <thead className="border-b border-border/70 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium text-right">Geräte</th>
            <th className="px-4 py-3 font-medium text-right">Sortierung</th>
            <th className="w-px px-2 py-3 text-right font-medium">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 bg-card/90">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.slug}</td>
              <td className="px-4 py-3 text-right tabular-nums">{r.deviceCount}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.sortOrder}</td>
              <td className="px-2 py-2 align-middle">
                <AdminCatalogRowActions
                  kind="consumerCategory"
                  id={r.id}
                  name={r.name}
                  editHref={`/admin/consumer-categories/${r.id}`}
                  entityLabel="Verbraucher-Kategorie"
                  previewRows={[
                    { label: "Name", value: r.name },
                    { label: "Slug", value: r.slug },
                    { label: "Geräte", value: String(r.deviceCount) },
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

type ConsumerDevicesProps = { rows: AdminConsumerDeviceRow[] };

export function AdminConsumerDevicesTable({ rows }: ConsumerDevicesProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <table className="w-full min-w-[48rem] text-left text-sm">
        <thead className="border-b border-border/70 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Kategorie</th>
            <th className="px-4 py-3 font-medium text-right">Standard W</th>
            <th className="px-4 py-3 font-medium">System</th>
            <th className="px-4 py-3 font-medium">Merkmale</th>
            <th className="w-px px-2 py-3 text-right font-medium">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 bg-card/90">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="max-w-[12rem] truncate px-4 py-3 font-medium text-foreground" title={r.name}>
                {r.name}
              </td>
              <td className="px-4 py-3 align-middle">
                <AdminReadonlyBadge variant="category">{r.categoryName}</AdminReadonlyBadge>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{r.defaultPower}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.defaultVoltage}</td>
              <td className="px-4 py-3">
                <span className="flex flex-wrap gap-1">
                  {r.isFeatured ? (
                    <AdminReadonlyBadge variant="neutral">Featured</AdminReadonlyBadge>
                  ) : null}
                  <AdminReadonlyBadge variant={r.isActive ? "active" : "inactive"}>
                    {r.isActive ? "Aktiv" : "Inaktiv"}
                  </AdminReadonlyBadge>
                </span>
              </td>
              <td className="px-2 py-2 align-middle">
                <AdminCatalogRowActions
                  kind="consumerDevice"
                  id={r.id}
                  name={r.name}
                  editHref={`/admin/consumer-devices/${r.id}`}
                  entityLabel="Verbraucher-Gerät"
                  previewRows={[
                    { label: "Name", value: r.name },
                    { label: "Kategorie", value: r.categoryName },
                    { label: "Standard W", value: String(r.defaultPower) },
                    { label: "System", value: r.defaultVoltage },
                    { label: "Sortierung", value: String(r.sortOrder) },
                    { label: "Featured", value: r.isFeatured ? "Ja" : "Nein" },
                    { label: "Status", value: r.isActive ? "Aktiv" : "Inaktiv" },
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
