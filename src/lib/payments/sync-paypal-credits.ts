import { grantCreditsFromPurchase } from "@/lib/db/queries/credits";

import { CREDIT_PACKAGES, parseCreditPackageId } from "./packages";
import { paypalCaptureOrder, paypalGetOrder } from "./paypal-rest";

/**
 * Nach erfolgreicher Zahlung: Credits idempotent auf `Result` buchen.
 * `expectedResultId` muss mit `custom_id` der Order übereinstimmen (`resultId:packageId`).
 */
export async function syncCreditsFromPayPalOrder(
  orderId: string,
  expectedResultId: string,
): Promise<{ granted: boolean; balance: number }> {
  let order = await paypalGetOrder(orderId);
  if (order.status === "APPROVED") {
    order = await paypalCaptureOrder(orderId);
  }
  if (order.status !== "COMPLETED") {
    throw new Error(`PayPal-Order nicht abgeschlossen (Status: ${order.status ?? "?"})`);
  }

  const customId = order.purchase_units?.[0]?.custom_id ?? "";
  const [resultId, packageIdRaw] = customId.split(":");
  if (!resultId || !packageIdRaw || resultId !== expectedResultId) {
    throw new Error("Order passt nicht zur Result-UUID");
  }

  const pkgId = parseCreditPackageId(packageIdRaw);
  if (!pkgId) throw new Error("Unbekanntes Credit-Paket");
  const pkg = CREDIT_PACKAGES[pkgId];

  return grantCreditsFromPurchase({
    resultId,
    paypalOrderId: orderId,
    paypalStatus: "COMPLETED",
    packageType: pkg.id,
    credits: pkg.credits,
    amount: pkg.amount,
    currency: pkg.currency,
  });
}
