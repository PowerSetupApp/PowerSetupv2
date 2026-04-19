import * as z from "zod";

import { getPrisma } from "@/lib/db/client";
import { CREDIT_PACKAGES, parseCreditPackageId } from "@/lib/payments/packages";
import { paypalCreateOrder } from "@/lib/payments/paypal-rest";

const bodySchema = z.object({
  resultId: z.uuid(),
  packageId: z.string().min(1),
});

function appBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (u) return u;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const { resultId, packageId } = bodySchema.parse(json);
    const pkgId = parseCreditPackageId(packageId);
    if (!pkgId) {
      return Response.json({ error: "Unbekanntes Paket" }, { status: 400 });
    }
    const pkg = CREDIT_PACKAGES[pkgId];

    const prisma = getPrisma();
    const row = await prisma.result.findUnique({
      where: { id: resultId },
      select: { id: true },
    });
    if (!row) {
      return Response.json({ error: "Result nicht gefunden" }, { status: 404 });
    }

    const base = appBaseUrl();
    const customId = `${resultId}:${pkg.id}`;
    const { id, approveUrl } = await paypalCreateOrder({
      pkg,
      customId,
      returnUrl: `${base}/result/${resultId}?payment=return`,
      cancelUrl: `${base}/result/${resultId}?payment=cancel`,
    });

    return Response.json({ orderId: id, approveUrl });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: "Ungültige Eingaben" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "PayPal-Fehler";
    if (process.env.NODE_ENV !== "test") {
      console.error("[api/payments/create]", e);
    }
    return Response.json({ error: msg }, { status: 502 });
  }
}
