"use client";

import {
  adminCatalogDeleteBrandAction,
  adminCatalogDeleteCategoryAction,
  adminCatalogDeleteConsumerCategoryAction,
  adminCatalogDeleteConsumerDeviceAction,
  adminCatalogDeleteProductAction,
} from "@/lib/admin/catalog-actions";
import type { AdminCatalogMutationResult } from "@/lib/db/queries/admin-catalog-mutations";

export type AdminCatalogRowKind =
  | "product"
  | "productCategory"
  | "brand"
  | "consumerCategory"
  | "consumerDevice";

export async function runAdminCatalogDelete(
  kind: AdminCatalogRowKind,
  id: string,
): Promise<AdminCatalogMutationResult> {
  switch (kind) {
    case "product":
      return adminCatalogDeleteProductAction(id);
    case "productCategory":
      return adminCatalogDeleteCategoryAction(id);
    case "brand":
      return adminCatalogDeleteBrandAction(id);
    case "consumerCategory":
      return adminCatalogDeleteConsumerCategoryAction(id);
    case "consumerDevice":
      return adminCatalogDeleteConsumerDeviceAction(id);
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unexpected catalog kind: ${_exhaustive}`);
    }
  }
}
