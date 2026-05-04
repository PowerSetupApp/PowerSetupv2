/**
 * Amazon Creators API / scraper payload shape (aligned with legacy app + extractor).
 */

export interface AmazonItem {
  asin: string;
  detailPageUrl?: string;
  itemInfo?: AmazonItemInfo;
  images?: AmazonImages;
  offers?: AmazonOffers;
  /**
   * Scraper-only: extra plain text for the AI extractor (product description + tables),
   * not persisted on `Product`.
   */
  scrapeContextText?: string;
}

export interface AmazonItemInfo {
  title?: { displayValue?: string };
  byLineInfo?: {
    brand?: { displayValue?: string };
    manufacturer?: { displayValue?: string };
  };
  features?: { displayValues?: string[] };
  productInfo?: {
    itemDimensions?: {
      height?: { displayValue?: number; unit?: string };
      length?: { displayValue?: number; unit?: string };
      width?: { displayValue?: number; unit?: string };
      weight?: { displayValue?: number; unit?: string };
    };
  };
  technicalInfo?: {
    technicalDetails?: Array<{ name?: string; value?: string }>;
  };
  classifications?: {
    productGroup?: { displayValue?: string };
  };
}

export interface AmazonImages {
  primary?: {
    large?: { url?: string; height?: number; width?: number };
    medium?: { url?: string };
  };
}

export interface AmazonOffers {
  listings?: Array<{
    price?: { displayAmount?: string; amount?: number; currency?: string };
    availability?: { message?: string; type?: string };
  }>;
}

export type AmazonFetchMode = "api" | "scrape";
