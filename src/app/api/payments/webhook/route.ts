import { paypalGetOrder } from "@/lib/payments/paypal-rest";
import { syncCreditsFromPayPalOrder } from "@/lib/payments/sync-paypal-credits";

type Json = Record<string, unknown>;

function readOrderId(payload: Json): string | null {
  const resource = payload.resource as Json | undefined;
  if (!resource) return null;
  const rt = typeof payload.resource_type === "string" ? payload.resource_type : "";
  if (rt === "checkout-order" && typeof resource.id === "string") return resource.id;
  const sup = resource.supplementary_data as Json | undefined;
  const related = sup?.related_ids as Json | undefined;
  const oid = related?.order_id;
  return typeof oid === "string" ? oid : null;
}

/**
 * PayPal Webhook — idempotent über `grantCreditsFromPurchase` innerhalb von `syncCreditsFromPayPalOrder`.
 */
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const payload = JSON.parse(raw) as Json;
    const eventType = typeof payload.event_type === "string" ? payload.event_type : "";

    if (!eventType.includes("PAYMENT.CAPTURE.COMPLETED") && !eventType.includes("CHECKOUT.ORDER.APPROVED")) {
      return new Response("ignored", { status: 200 });
    }

    const orderId = readOrderId(payload);
    if (!orderId) {
      return new Response("no-order", { status: 200 });
    }

    const order = await paypalGetOrder(orderId);
    const customId = order.purchase_units?.[0]?.custom_id ?? "";
    const resultId = customId.split(":")[0];
    if (!resultId || resultId.length < 32) {
      return new Response("bad-custom", { status: 200 });
    }

    await syncCreditsFromPayPalOrder(orderId, resultId);
  } catch (e) {
    if (process.env.NODE_ENV !== "test") {
      console.error("[api/payments/webhook]", e);
    }
  }
  return new Response("ok", { status: 200 });
}
