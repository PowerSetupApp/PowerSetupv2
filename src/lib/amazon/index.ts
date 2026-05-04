import { fetchAmazonItemViaCreatorsApi } from "@/lib/amazon/api";
import { fetchMockAmazonItem } from "@/lib/amazon/mock";
import { scrapeAmazonProduct } from "@/lib/amazon/scraper";
import type { AmazonFetchMode, AmazonItem } from "@/lib/amazon/types";

export type { AmazonFetchMode, AmazonItem } from "@/lib/amazon/types";
export { extractAsinFromAmazonInput } from "@/lib/amazon/asin";
export { scrapeAmazonProduct } from "@/lib/amazon/scraper";

function isMockAmazonMode(): boolean {
  const v = process.env.USE_MOCK_AMAZON?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/**
 * Lädt Rohdaten für den Amazon-Import.
 * `USE_MOCK_AMAZON=true` → feste Test-ASINs (siehe `mock.ts`).
 */
export async function fetchAmazonItem(
  asin: string,
  mode: AmazonFetchMode,
  partnerTagForApi: string,
): Promise<AmazonItem | null> {
  if (isMockAmazonMode()) {
    return fetchMockAmazonItem(asin);
  }
  if (mode === "scrape") {
    return scrapeAmazonProduct(asin);
  }
  return fetchAmazonItemViaCreatorsApi(asin, partnerTagForApi);
}
