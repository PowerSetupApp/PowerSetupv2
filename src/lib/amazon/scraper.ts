import * as cheerio from "cheerio";

import { extractAsinFromAmazonInput } from "@/lib/amazon/asin";
import type { AmazonItem } from "@/lib/amazon/types";

function absolutizeImageSrc(src: string | undefined, pageUrl: string): string | undefined {
  if (!src?.trim()) return undefined;
  const t = src.trim();
  if (t.startsWith("data:")) return undefined;
  try {
    if (t.startsWith("//")) return new URL(`https:${t}`).href;
    if (t.startsWith("/")) return new URL(t, pageUrl).href;
    return new URL(t).href;
  } catch {
    return undefined;
  }
}

/** `data-a-dynamic-image` maps image URLs to [width, height]; pick largest area. */
function pickLargestImageFromDynamicAttr(jsonStr: string, pageUrl: string): string | undefined {
  try {
    const json = JSON.parse(jsonStr) as Record<string, unknown>;
    let bestUrl: string | undefined;
    let bestArea = 0;
    for (const [u, dims] of Object.entries(json)) {
      if (typeof u !== "string" || !u.startsWith("http")) continue;
      const abs = absolutizeImageSrc(u, pageUrl);
      if (!abs) continue;
      let w = 0;
      let h = 0;
      if (Array.isArray(dims) && dims.length >= 2) {
        w = Number(dims[0]) || 0;
        h = Number(dims[1]) || 0;
      }
      const area = w * h || 1;
      if (area >= bestArea) {
        bestArea = area;
        bestUrl = abs;
      }
    }
    return bestUrl;
  } catch {
    return undefined;
  }
}

type CheerioLoaded = ReturnType<typeof cheerio.load>;

function stripAmazonMetaTitleSuffix(raw: string): string {
  return raw
    .replace(/\s*:\s*Amazon\.(de|com|co\.uk|fr|it|es|nl|se|pl|at|ca|jp|in|com\.mx|com\.br)\b.*$/i, "")
    .replace(/\s*–\s*Amazon\.(de|com)\b.*$/i, "")
    .replace(/\s*-\s*Amazon\.(de|com)\b.*$/i, "")
    .trim();
}

/**
 * Produkttitel: Amazon wechselt regelmäßig das Markup; mehrere Selektoren + og:title.
 */
function extractProductTitle($: CheerioLoaded): string {
  const tryText = (s: string | undefined | null): string | undefined => {
    const t = s?.replace(/\s+/g, " ").trim();
    if (!t || t.length < 2) return undefined;
    const lower = t.toLowerCase();
    if (lower === "amazon.de" || lower.startsWith("amazon.de:")) return undefined;
    if (lower.includes("robot check") || lower.includes("captcha")) return undefined;
    return t;
  };

  const fromSelectors: string[] = [
    "#productTitle",
    "span#productTitle",
    "#title #productTitle",
    "#title span.a-size-large",
    "#title .a-size-large",
    "#titleSection #productTitle",
    "#titleSection h1",
    "h1#title",
    "#centerCol #productTitle",
    "div#titleContainer h1",
    "h1.a-size-large.a-spacing-none",
    "h1.a-size-large",
  ];

  for (const sel of fromSelectors) {
    const t = tryText($(sel).first().text());
    if (t) return t;
  }

  const og = tryText(stripAmazonMetaTitleSuffix($('meta[property="og:title"]').attr("content") ?? ""));
  if (og) return og;

  const tw = $('meta[name="twitter:title"]').attr("content");
  const ttw = tryText(stripAmazonMetaTitleSuffix(tw ?? ""));
  if (ttw) return ttw;

  return "";
}

function extractMainProductImage($: CheerioLoaded, pageUrl: string): string | undefined {
  const fromImg = (sel: string): string | undefined => {
    const el = $(sel).first();
    const dyn = el.attr("data-a-dynamic-image");
    if (dyn) {
      const fromDyn = pickLargestImageFromDynamicAttr(dyn, pageUrl);
      if (fromDyn) return fromDyn;
    }
    const src = el.attr("src");
    return absolutizeImageSrc(src, pageUrl);
  };

  return (
    fromImg("#landingImage") ||
    fromImg("#imgBlkFront") ||
    fromImg("#main-image") ||
    (() => {
      const el = $('img[data-a-dynamic-image]').first();
      const dyn = el.attr("data-a-dynamic-image");
      if (dyn) return pickLargestImageFromDynamicAttr(dyn, pageUrl);
      return absolutizeImageSrc(el.attr("src"), pageUrl);
    })()
  );
}

function collectTechnicalRows($: CheerioLoaded): Array<{ name: string; value: string }> {
  const out: Array<{ name: string; value: string }> = [];
  const seen = new Set<string>();

  const push = (name: string, value: string) => {
    const n = name.trim();
    const v = value.replace(/\s+/g, " ").trim();
    if (!n || !v) return;
    const key = `${n.toLowerCase()}|${v.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ name: n, value: v });
  };

  const rowSelectors = [
    "#productDetails_techSpec_section_1 tr",
    "#productDetails_techSpec_section_2 tr",
    "#productDetails_detailBullets_sections1 tr",
    "#prodDetails tr",
    "table.prodDetTable tr",
    "#productFactsDesktopExpander tr",
    "#productOverview_feature_div table tr",
    "#detailBullets_feature_div table tr",
    "#productDetails_db_sections tr",
  ];

  for (const sel of rowSelectors) {
    $(sel).each((_, el) => {
      const row = $(el);
      const th = row.find("th").first().text().trim();
      const td = row.find("td").first().text().trim();
      if (th && td) {
        push(th, td);
        return;
      }
      const dt = row.find("dt").first().text().trim();
      const dd = row.find("dd").first().text().trim();
      if (dt && dd) push(dt, dd);
    });
  }

  return out;
}

function collectFeatures($: CheerioLoaded): string[] {
  const features: string[] = [];
  const seen = new Set<string>();

  const push = (text: string) => {
    const t = text.replace(/\s+/g, " ").trim();
    if (t.length < 2 || seen.has(t)) return;
    seen.add(t);
    features.push(t);
  };

  const selectors = [
    "#feature-bullets li span.a-list-item",
    "#featurebullets_feature_div li span",
    "#feature-bullets_feature_div li span",
    "#feature-bullets ul li span",
  ];

  for (const sel of selectors) {
    $(sel).each((_, el) => {
      push($(el).text());
    });
  }

  return features;
}

function buildScrapeContextText($: CheerioLoaded, tech: Array<{ name: string; value: string }>): string {
  const parts: string[] = [];

  const desc = $("#productDescription_feature_div, #productDescription")
    .find("p")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .join("\n\n");
  if (desc) parts.push(`Produktbeschreibung:\n${desc.slice(0, 6000)}`);

  if (tech.length) {
    const lines = tech.map((r) => `${r.name}: ${r.value}`).join("\n");
    parts.push(`Technische Daten / Merkmale (aus der Produktseite):\n${lines.slice(0, 8000)}`);
  }

  return parts.join("\n\n").slice(0, 12000);
}

/**
 * Scrapes amazon.de product HTML into {@link AmazonItem} for the AI extractor.
 */
export async function scrapeAmazonProduct(urlOrAsin: string): Promise<AmazonItem | null> {
  const asin = extractAsinFromAmazonInput(urlOrAsin);
  if (!asin) {
    throw new Error("ASIN konnte aus der Eingabe nicht ermittelt werden.");
  }

  const url = `https://www.amazon.de/dp/${asin}`;

  const delay = Math.floor(Math.random() * 1000) + 500;
  await new Promise((r) => setTimeout(r, delay));

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
  });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error(
        "Amazon hat den Zugriff blockiert (CAPTCHA/Bot-Schutz). Bitte später erneut versuchen oder einen anderen Link nutzen.",
      );
    }
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Amazon antwortete mit HTTP ${response.status}.`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const pageTitle = $("title").text();
  if (pageTitle.includes("Robot Check") || pageTitle.includes("CAPTCHA")) {
    throw new Error("Amazon CAPTCHA erkannt.");
  }
  const bodyText = html.slice(0, 8000).toLowerCase();
  if (bodyText.includes("geben sie die zeichen") || bodyText.includes("type the characters you see")) {
    throw new Error("Amazon CAPTCHA erkannt (Zeicheneingabe).");
  }

  const productTitle = extractProductTitle($);
  if (!productTitle) {
    throw new Error(
      "Scraping fehlgeschlagen: Kein Produkttitel gefunden. (Vermutlich Bot-Schutz oder abweichendes Seitenlayout. Alternativ „API“-Modus in der App nutzen, siehe Amazon Creators API.)",
    );
  }

  const brandText =
    $("#bylineInfo").text().trim() ||
    $("#bylineInfo_feature_div").text().trim() ||
    $("[data-csa-c-content-id='abyProductBrandDesktopFeatureBullets']").text().trim();
  const brand = brandText
    .replace("Besuchen Sie den", "")
    .replace("-Store", "")
    .replace("Marke:", "")
    .trim();

  let priceAmount = 0;
  const priceWhole = $(".a-price-whole").first().text().replace(/[^0-9]/g, "");
  const priceFraction = $(".a-price-fraction").first().text().replace(/[^0-9]/g, "");
  if (priceWhole) {
    priceAmount = Number.parseFloat(`${priceWhole}.${priceFraction || "00"}`);
  } else {
    const rawPrice = $("#price_inside_buybox").text() || $(".a-color-price").first().text();
    const match = rawPrice.match(/([0-9]+)[.,]([0-9]{2})/);
    if (match) {
      priceAmount = Number.parseFloat(`${match[1]}.${match[2]}`);
    }
  }

  const features = collectFeatures($);
  const technicalDetails = collectTechnicalRows($);
  const scrapeContextText = buildScrapeContextText($, technicalDetails);

  const mainImage = extractMainProductImage($, url);

  const item: AmazonItem = {
    asin,
    detailPageUrl: url,
    scrapeContextText: scrapeContextText || undefined,
    itemInfo: {
      title: { displayValue: productTitle },
      byLineInfo: { brand: { displayValue: brand } },
      features: { displayValues: features },
      technicalInfo: { technicalDetails },
      productInfo: {},
    },
    images: {
      primary: {
        large: { url: mainImage },
      },
    },
    offers: {
      listings: [
        {
          price: {
            amount: priceAmount,
            currency: "EUR",
            displayAmount: `${priceAmount.toFixed(2)} €`,
          },
          availability: { message: "In Stock" },
        },
      ],
    },
  };

  return item;
}
