import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { scrapeAmazonProduct } from "@/lib/amazon/scraper";

describe("scrapeAmazonProduct (HTML parsing)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.spyOn(globalThis, "setTimeout").mockImplementation((fn: TimerHandler) => {
      if (typeof fn === "function") (fn as () => void)();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("absolutizes protocol-relative image and collects tech + features", async () => {
    const html = `<!DOCTYPE html><html><head><title>Amazon.de</title></head><body>
      <span id="productTitle">MPPT Laderegler 100/20</span>
      <a id="bylineInfo">Marke: Victron Energy</a>
      <span class="a-price-whole">189,</span><span class="a-price-fraction">99</span>
      <img id="landingImage" src="//m.media-amazon.com/images/I/41dummy._AC_SL500_.jpg" alt="x" />
      <table id="productDetails_techSpec_section_1">
        <tr><th>Maximaler Ladestrom</th><td>20 Ampere</td></tr>
        <tr><th>Maximale PV-Spannung</th><td>100 Volt</td></tr>
      </table>
      <div id="feature-bullets_feature_div">
        <ul class="a-unordered-list a-vertical a-spacing-mini">
          <li><span class="a-list-item">Ultra-schnelles MPPT</span></li>
          <li><span class="a-list-item">Bluetooth integriert</span></li>
        </ul>
      </div>
      <div id="productDescription_feature_div"><p>Leistungsstarker Solarladeregler für 12V und 24V.</p></div>
    </body></html>`;

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    }) as unknown as typeof fetch;

    const item = await scrapeAmazonProduct("B075NQQRPD");
    expect(item).not.toBeNull();
    expect(item!.images?.primary?.large?.url).toBe("https://m.media-amazon.com/images/I/41dummy._AC_SL500_.jpg");
    expect(item!.itemInfo?.technicalInfo?.technicalDetails?.length).toBeGreaterThanOrEqual(2);
    expect(item!.itemInfo?.features?.displayValues?.length).toBeGreaterThanOrEqual(2);
    expect(item!.scrapeContextText).toContain("Produktbeschreibung");
    expect(item!.scrapeContextText).toContain("Technische Daten");
  });

  it("picks largest URL from data-a-dynamic-image", async () => {
    const dyn = JSON.stringify({
      "https://m.media-amazon.com/images/I/small.jpg": [100, 100],
      "https://m.media-amazon.com/images/I/large.jpg": [1000, 1000],
    });
    const attr = dyn.replace(/"/g, "&quot;");
    const html = `<!DOCTYPE html><html><head><title>x</title></head><body>
      <span id="productTitle">Produkt Titel Lang Genug</span>
      <span id="bylineInfo">Marke: X</span>
      <span class="a-price-whole">1,</span><span class="a-price-fraction">00</span>
      <img id="landingImage" data-a-dynamic-image="${attr}" />
    </body></html>`;

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    }) as unknown as typeof fetch;

    const item = await scrapeAmazonProduct("B09LIONBAT");
    expect(item?.images?.primary?.large?.url).toBe("https://m.media-amazon.com/images/I/large.jpg");
  });

  it("falls back to og:title when #productTitle is missing", async () => {
    const html = `<!DOCTYPE html><html><head>
      <meta property="og:title" content="ECO-WORTHY Test Akku 12V : Amazon.de" />
      <title>Amazon.de</title>
    </head><body>
      <span id="bylineInfo">Marke: Test</span>
      <span class="a-price-whole">99,</span><span class="a-price-fraction">00</span>
      <img id="landingImage" src="https://m.media-amazon.com/images/I/41x._AC_SL500_.jpg" />
    </body></html>`;

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    }) as unknown as typeof fetch;

    const item = await scrapeAmazonProduct("B075NQQRPD");
    expect(item?.itemInfo?.title?.displayValue).toBe("ECO-WORTHY Test Akku 12V");
  });
});
