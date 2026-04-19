import type { CreditPackageDef } from "./packages";

function apiBase(): string {
  return process.env.PAYPAL_API_BASE?.trim() || "https://api-m.sandbox.paypal.com";
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} ist nicht gesetzt`);
  return v;
}

async function paypalAccessToken(): Promise<string> {
  const id = requireEnv("PAYPAL_CLIENT_ID");
  const secret = requireEnv("PAYPAL_CLIENT_SECRET");
  const tokenUrl = `${apiBase()}/v1/oauth2/token`;
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`PayPal OAuth fehlgeschlagen (${res.status}): ${t.slice(0, 400)}`);
  }
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("PayPal OAuth: kein access_token");
  return body.access_token;
}

async function paypalJson<T>(path: string, init: RequestInit): Promise<T> {
  const token = await paypalAccessToken();
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal API ${path} (${res.status}): ${text.slice(0, 600)}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export type PayPalCreateOrderResult = {
  id: string;
  approveUrl: string;
};

export async function paypalCreateOrder(params: {
  pkg: CreditPackageDef;
  returnUrl: string;
  cancelUrl: string;
  customId: string;
}): Promise<PayPalCreateOrderResult> {
  const order = await paypalJson<{
    id: string;
    links?: { href: string; rel: string; method?: string }[];
  }>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: params.pkg.currency, value: params.pkg.amount },
          custom_id: params.customId,
          description: `PowerSetup Credits (${params.pkg.label})`,
        },
      ],
      application_context: {
        brand_name: "PowerSetup",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        shipping_preference: "NO_SHIPPING",
      },
    }),
  });

  const approve = order.links?.find((l) => l.rel === "approve" && l.method === "GET");
  if (!approve?.href) throw new Error("PayPal: kein approve-Link in Order-Antwort");
  return { id: order.id, approveUrl: approve.href };
}

export type PayPalOrderDetails = {
  id: string;
  status?: string;
  purchase_units?: { custom_id?: string }[];
};

export async function paypalGetOrder(orderId: string): Promise<PayPalOrderDetails> {
  return paypalJson<PayPalOrderDetails>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
  });
}

export async function paypalCaptureOrder(orderId: string): Promise<PayPalOrderDetails> {
  return paypalJson<PayPalOrderDetails>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
