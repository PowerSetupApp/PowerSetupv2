import { importAdminDomain } from "@/lib/db/queries/admin-catalog-io";
import { isAdminExportDomain } from "@/lib/schemas/admin-catalog-json";
import * as z from "zod";

export async function POST(request: Request, ctx: { params: Promise<{ domain: string }> }) {
  const { domain } = await ctx.params;
  if (!isAdminExportDomain(domain)) {
    return Response.json({ error: "Unbekannte Domain" }, { status: 404 });
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Ungültiges JSON" }, { status: 400 });
  }
  try {
    const result = await importAdminDomain(domain, raw);
    return Response.json({ ok: true, imported: result.imported });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: e.flatten(), issues: e.issues }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "Import fehlgeschlagen";
    return Response.json({ error: msg }, { status: 400 });
  }
}
