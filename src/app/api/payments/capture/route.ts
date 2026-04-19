import * as z from "zod";

import { syncCreditsFromPayPalOrder } from "@/lib/payments/sync-paypal-credits";

const bodySchema = z.object({
  resultId: z.uuid(),
  orderId: z.string().min(10).max(120),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const { resultId, orderId } = bodySchema.parse(json);
    const out = await syncCreditsFromPayPalOrder(orderId, resultId);
    return Response.json(out);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: "Ungültige Eingaben" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "Capture fehlgeschlagen";
    if (process.env.NODE_ENV !== "test") {
      console.error("[api/payments/capture]", e);
    }
    return Response.json({ error: msg }, { status: 502 });
  }
}
