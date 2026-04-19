import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { describe, expect, it } from "vitest";

import { mapAdminCatalogDeleteError } from "./admin-catalog-mutations";

describe("mapAdminCatalogDeleteError", () => {
  it("maps P2025 to not-found message", () => {
    const err = new PrismaClientKnownRequestError("x", { code: "P2025", clientVersion: "t", meta: {} });
    expect(mapAdminCatalogDeleteError("Die Marke", err)).toContain("nicht gefunden");
  });

  it("maps P2003 to foreign-key message", () => {
    const err = new PrismaClientKnownRequestError("x", { code: "P2003", clientVersion: "t", meta: {} });
    expect(mapAdminCatalogDeleteError("Die Kategorie", err)).toContain("verweisen");
  });

  it("falls back for unknown errors", () => {
    expect(mapAdminCatalogDeleteError("Das Produkt", new Error("boom"))).toContain("konnte nicht gelöscht werden");
  });
});
