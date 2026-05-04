import {
  ApiClient,
  GetItemsRequestContent,
  GetItemsResource,
  TypedDefaultApi,
} from "amazon-creators-api";

import type { AmazonItem } from "@/lib/amazon/types";

function creatorsItemResources(): string[] {
  const r = new GetItemsResource() as unknown as Record<string, string>;
  return [
    r["images.primary.large"]!,
    r["images.primary.medium"]!,
    r["itemInfo.title"]!,
    r["itemInfo.byLineInfo"]!,
    r["itemInfo.features"]!,
    r["itemInfo.technicalInfo"]!,
    r["itemInfo.productInfo"]!,
    r["itemInfo.classifications"]!,
    r["offersV2.listings.price"]!,
    r["offersV2.listings.availability"]!,
  ];
}

/**
 * Amazon Creators API (OAuth-Client über `amazon-creators-api`).
 * Partner-Tag: Admin-DB bevorzugt, sonst `AMAZON_PARTNER_TAG`.
 */
export async function fetchAmazonItemViaCreatorsApi(
  asin: string,
  partnerTagFromSettings: string,
): Promise<AmazonItem | null> {
  const clientId = process.env.AMAZON_CLIENT_ID?.trim();
  const clientSecret = process.env.AMAZON_CLIENT_SECRET?.trim();
  const envTag = process.env.AMAZON_PARTNER_TAG?.trim();
  const partnerTag = partnerTagFromSettings.trim() || envTag || "";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Amazon API: AMAZON_CLIENT_ID und AMAZON_CLIENT_SECRET müssen in der Umgebung gesetzt sein.",
    );
  }
  if (!partnerTag) {
    throw new Error(
      "Amazon API: Partner-Tag fehlt (Admin „Amazon“ oder Umgebungsvariable AMAZON_PARTNER_TAG).",
    );
  }

  const apiClient = new ApiClient();
  apiClient.credentialId = clientId;
  apiClient.credentialSecret = clientSecret;
  apiClient.version = "2.2";

  const api = new TypedDefaultApi(apiClient);
  const normalizedAsin = asin.toUpperCase().trim();
  const request = new GetItemsRequestContent(partnerTag, [normalizedAsin]);
  request.resources = creatorsItemResources() as unknown as InstanceType<typeof GetItemsResource>[];

  const marketplace = "www.amazon.de";
  const response = await api.getItems(marketplace, request);
  const items = response.itemsResult?.items;
  if (!items?.length) {
    return null;
  }

  const first = items[0];
  return JSON.parse(JSON.stringify(first)) as AmazonItem;
}
