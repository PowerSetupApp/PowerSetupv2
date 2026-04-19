import { exportAdminDomain } from "@/lib/db/queries/admin-catalog-io";
import { isAdminExportDomain } from "@/lib/schemas/admin-catalog-json";

const FILENAME: Record<string, string> = {
  products: "products.json",
  brands: "brands.json",
  "brand-filter-categories": "brand-filter-categories.json",
  categories: "categories.json",
  "consumer-categories": "consumer-categories.json",
  "consumer-devices": "consumer-devices.json",
  "system-settings": "system-settings.json",
  "algorithm-settings": "algorithm-settings.json",
  "model-pricing": "model-pricing.json",
  "prompt-versions": "prompt-versions.json",
};

/**
 * Verhindert versehentliches Abfließen von API-Keys via Direkt-Link.
 * Secrets dürfen nur exportiert werden, wenn **beide** Opt-ins vorliegen:
 *   - Query-Param `?includeSecrets=1` (UI-intent)
 *   - Header `X-Include-Secrets: 1` (programmatischer intent → kann nicht
 *     durch bloßes Tab-Öffnen eines URL-Links passieren)
 * Zusätzlich wird jeder Secret-Export geloggt.
 */
function isIncludeSecrets(request: Request, url: URL): boolean {
  const queryOk = url.searchParams.get("includeSecrets") === "1";
  const headerOk = request.headers.get("x-include-secrets") === "1";
  return queryOk && headerOk;
}

function auditSecretExport(request: Request, domain: string): void {
  const actor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  console.warn(
    JSON.stringify({
      event: "admin.export.includeSecrets",
      domain,
      actor,
      ts: new Date().toISOString(),
    }),
  );
}

export async function GET(request: Request, ctx: { params: Promise<{ domain: string }> }) {
  const { domain } = await ctx.params;
  if (!isAdminExportDomain(domain)) {
    return Response.json({ error: "Unbekannte Domain" }, { status: 404 });
  }
  const url = new URL(request.url);
  const includeSecrets = isIncludeSecrets(request, url);
  if (url.searchParams.get("includeSecrets") === "1" && !includeSecrets) {
    return Response.json(
      { error: "Secret-Export benötigt zusätzlich Header `X-Include-Secrets: 1`" },
      { status: 400 },
    );
  }
  if (includeSecrets) auditSecretExport(request, domain);
  try {
    const payload = await exportAdminDomain(domain, { includeSecrets });
    const name = FILENAME[domain] ?? `${domain}.json`;
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Export fehlgeschlagen";
    return Response.json({ error: msg }, { status: 500 });
  }
}
