import { NextResponse } from "next/server";

import { optimizeSpecsText } from "@/lib/admin/ai-specs";
import { adminSpecsOptimizeSchema } from "@/lib/schemas/admin-specs-optimize";

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Ungültiges JSON." }, { status: 400 });
  }

  const parsed = adminSpecsOptimizeSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ungültige Eingabe.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  try {
    const result = await optimizeSpecsText(parsed.data.text, parsed.data.categoryName);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[admin/optimize-specs] failed", err);
    const message = err instanceof Error ? err.message : "AI-Aufruf fehlgeschlagen.";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}
