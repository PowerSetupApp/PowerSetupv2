import { buildProductPreviewFilterRows, type ProductPreviewFilterRow } from "@/lib/admin/product-preview-filters";
import { readFromDatabase, type DbReadResult } from "@/lib/db/prisma-errors";
import { getPrisma } from "@/lib/db/client";
import { decimalToNumber } from "@/lib/money";

/** Produktkategorien (Wizard-Katalog), nur Lesen. */
export type AdminProductCategoryRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
};

export type AdminProductListRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  affiliateUrl: string | null;
  price: number | null;
  isActive: boolean;
  updatedAt: Date;
};

/** Kategorie + Filter-Definitionen für das Produkt-Editor-Formular. */
export type AdminCategoryFilterEditorRow = {
  id: string;
  key: string;
  name: string;
  type: string;
  unit: string | null;
  options: string[];
  sortOrder: number;
};

export type AdminProductEditorPayload = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  affiliateUrl: string | null;
  asin: string | null;
  price: number | null;
  categoryId: string;
  specs: string;
  isActive: boolean;
  brandId: string | null;
  filterValues: Record<string, unknown> | null;
  category: { id: string; name: string; filters: AdminCategoryFilterEditorRow[] };
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
};

/** Felder für die Admin-Vorschau (Eye-Dialog), ohne interne JSON-Riesenmengen. */
export type AdminProductPreviewRow = {
  id: string;
  name: string;
  categoryName: string;
  price: number | null;
  isActive: boolean;
  updatedAt: Date;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  affiliateUrl: string | null;
  asin: string | null;
  specsExcerpt: string;
  /** `null` wenn keine Marke verknüpft (UI: „Keine Marke“). */
  brandName: string | null;
  filterRows: ProductPreviewFilterRow[];
};

export type AdminBrandListRow = {
  id: string;
  name: string;
  isActive: boolean;
  showInPreferences: boolean;
};

export type AdminConsumerCategoryRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  deviceCount: number;
};

export type AdminConsumerDeviceRow = {
  id: string;
  name: string;
  categoryName: string;
  defaultPower: number;
  defaultVoltage: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

export async function listAdminProductCategories(): Promise<DbReadResult<AdminProductCategoryRow[]>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sortOrder: r.sortOrder,
      productCount: r._count.products,
    }));
  });
}

const SPECS_PREVIEW_MAX = 1200;

export async function getAdminProductPreviewById(id: string): Promise<DbReadResult<AdminProductPreviewRow | null>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const r = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
        updatedAt: true,
        description: true,
        icon: true,
        imageUrl: true,
        affiliateUrl: true,
        asin: true,
        specs: true,
        filterValues: true,
        brand: { select: { name: true } },
        category: {
          select: {
            name: true,
            filters: {
              orderBy: { sortOrder: "asc" },
              select: { key: true, name: true, type: true, unit: true, sortOrder: true },
            },
          },
        },
      },
    });
    if (!r) return null;
    const specs = r.specs ?? "";
    const specsExcerpt = specs.length <= SPECS_PREVIEW_MAX ? specs : `${specs.slice(0, SPECS_PREVIEW_MAX)}…`;
    const filterRows = buildProductPreviewFilterRows(r.filterValues, r.category.filters);
    return {
      id: r.id,
      name: r.name,
      categoryName: r.category.name,
      price: decimalToNumber(r.price),
      isActive: r.isActive,
      updatedAt: r.updatedAt,
      description: r.description,
      icon: r.icon,
      imageUrl: r.imageUrl,
      affiliateUrl: r.affiliateUrl,
      asin: r.asin,
      specsExcerpt,
      brandName: r.brand?.name ?? null,
      filterRows,
    };
  });
}

export async function listAdminProducts(): Promise<DbReadResult<AdminProductListRow[]>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
        categoryId: true,
        affiliateUrl: true,
        price: true,
        isActive: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
      // Kein verschachteltes orderBy über Relation (treibt mit driver adapter + manchen DBs zu „Invalid invocation“).
      orderBy: { name: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      imageUrl: r.imageUrl,
      categoryId: r.categoryId,
      categoryName: r.category.name,
      affiliateUrl: r.affiliateUrl,
      price: decimalToNumber(r.price),
      isActive: r.isActive,
      updatedAt: r.updatedAt,
    }));
  });
}

export async function getAdminProductForEditorById(id: string): Promise<DbReadResult<AdminProductEditorPayload | null>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const [product, categories, brands] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          imageUrl: true,
          affiliateUrl: true,
          asin: true,
          price: true,
          categoryId: true,
          specs: true,
          isActive: true,
          brandId: true,
          filterValues: true,
          category: {
            select: {
              id: true,
              name: true,
              filters: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  key: true,
                  name: true,
                  type: true,
                  unit: true,
                  options: true,
                  sortOrder: true,
                },
              },
            },
          },
        },
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
    if (!product) return null;

    const rawFv = product.filterValues;
    const filterValues: Record<string, unknown> =
      rawFv !== null && typeof rawFv === "object" && !Array.isArray(rawFv) ? { ...(rawFv as Record<string, unknown>) } : {};

    const brandFilter = product.category.filters.find((f) => f.type.toLowerCase() === "brand");
    if (brandFilter && product.brandId && filterValues[brandFilter.key] === undefined) {
      filterValues[brandFilter.key] = product.brandId;
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      icon: product.icon,
      imageUrl: product.imageUrl,
      affiliateUrl: product.affiliateUrl,
      asin: product.asin,
      price: decimalToNumber(product.price),
      categoryId: product.categoryId,
      specs: product.specs,
      isActive: product.isActive,
      brandId: product.brandId,
      filterValues,
      category: {
        id: product.category.id,
        name: product.category.name,
        filters: product.category.filters.map((f) => ({
          id: f.id,
          key: f.key,
          name: f.name,
          type: f.type,
          unit: f.unit,
          options: f.options ?? [],
          sortOrder: f.sortOrder,
        })),
      },
      categories,
      brands,
    };
  });
}

export async function listAdminCategoryFiltersByCategoryId(
  categoryId: string,
): Promise<DbReadResult<AdminCategoryFilterEditorRow[]>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.categoryFilter.findMany({
      where: { categoryId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        key: true,
        name: true,
        type: true,
        unit: true,
        options: true,
        sortOrder: true,
      },
    });
    return rows.map((f) => ({
      id: f.id,
      key: f.key,
      name: f.name,
      type: f.type,
      unit: f.unit,
      options: f.options ?? [],
      sortOrder: f.sortOrder,
    }));
  });
}

export async function listAdminBrands(): Promise<DbReadResult<AdminBrandListRow[]>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        showInPreferences: true,
      },
      orderBy: { name: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      isActive: r.isActive,
      showInPreferences: r.showInPreferences,
    }));
  });
}

export async function listAdminConsumerCategories(): Promise<DbReadResult<AdminConsumerCategoryRow[]>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.consumerCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        _count: { select: { devices: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sortOrder: r.sortOrder,
      deviceCount: r._count.devices,
    }));
  });
}

export type AdminCategoryEditorPayload = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  filters: AdminCategoryFilterEditorRow[];
};

export async function getAdminCategoryForEditorById(
  id: string,
): Promise<DbReadResult<AdminCategoryEditorPayload | null>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const r = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        sortOrder: true,
        filters: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            key: true,
            name: true,
            type: true,
            unit: true,
            options: true,
            sortOrder: true,
          },
        },
      },
    });
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      icon: r.icon,
      sortOrder: r.sortOrder,
      filters: r.filters.map((f) => ({
        id: f.id,
        key: f.key,
        name: f.name,
        type: f.type,
        unit: f.unit,
        options: f.options ?? [],
        sortOrder: f.sortOrder,
      })),
    };
  });
}

export type AdminConsumerCategoryEditorPayload = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
};

export async function getAdminConsumerCategoryForEditorById(
  id: string,
): Promise<DbReadResult<AdminConsumerCategoryEditorPayload | null>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const r = await prisma.consumerCategory.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, icon: true, sortOrder: true },
    });
    return r ? r : null;
  });
}

export type AdminConsumerDeviceEditorPayload = {
  id: string;
  name: string;
  categoryId: string;
  icon: string | null;
  defaultPower: number;
  defaultVoltage: string;
  defaultHoursPerDay: number;
  stepHours: number;
  showHoursField: boolean;
  showFixedOption: boolean;
  isCooling: boolean;
  keywords: string[];
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  averageLoadPercent: number | null;
};

export async function getAdminConsumerDeviceForEditorById(
  id: string,
): Promise<DbReadResult<AdminConsumerDeviceEditorPayload | null>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const r = await prisma.consumerDevice.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        categoryId: true,
        icon: true,
        defaultPower: true,
        defaultVoltage: true,
        defaultHoursPerDay: true,
        stepHours: true,
        showHoursField: true,
        showFixedOption: true,
        isCooling: true,
        keywords: true,
        sortOrder: true,
        isActive: true,
        isFeatured: true,
        averageLoadPercent: true,
      },
    });
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      categoryId: r.categoryId,
      icon: r.icon,
      defaultPower: r.defaultPower,
      defaultVoltage: r.defaultVoltage,
      defaultHoursPerDay: r.defaultHoursPerDay,
      stepHours: r.stepHours,
      showHoursField: r.showHoursField,
      showFixedOption: r.showFixedOption,
      isCooling: r.isCooling,
      keywords: r.keywords ?? [],
      sortOrder: r.sortOrder,
      isActive: r.isActive,
      isFeatured: r.isFeatured,
      averageLoadPercent: r.averageLoadPercent,
    };
  });
}

export type AdminBrandFilterCategoryRow = {
  key: string;
  label: string;
  categorySlugs: string[];
  sortOrder: number;
};

export async function listAdminBrandFilterCategories(): Promise<DbReadResult<AdminBrandFilterCategoryRow[]>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.brandFilterCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: { key: true, label: true, categorySlugs: true, sortOrder: true },
    });
    return rows.map((r) => ({
      key: r.key,
      label: r.label,
      categorySlugs: r.categorySlugs ?? [],
      sortOrder: r.sortOrder,
    }));
  });
}

export async function getAdminBrandById(
  id: string,
): Promise<DbReadResult<(AdminBrandListRow & { types: string[] }) | null>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const r = await prisma.brand.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        types: true,
        isActive: true,
        showInPreferences: true,
      },
    });
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      types: r.types ?? [],
      isActive: r.isActive,
      showInPreferences: r.showInPreferences,
    };
  });
}

export async function listAdminProductCategoriesForSelect(): Promise<
  DbReadResult<{ id: string; name: string; slug: string }[]>
> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows;
  });
}

export async function listAdminConsumerDevices(): Promise<DbReadResult<AdminConsumerDeviceRow[]>> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.consumerDevice.findMany({
      select: {
        id: true,
        name: true,
        defaultPower: true,
        defaultVoltage: true,
        isActive: true,
        isFeatured: true,
        sortOrder: true,
        category: { select: { name: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      categoryName: r.category.name,
      defaultPower: r.defaultPower,
      defaultVoltage: r.defaultVoltage,
      isActive: r.isActive,
      isFeatured: r.isFeatured,
      sortOrder: r.sortOrder,
    }));
  });
}
