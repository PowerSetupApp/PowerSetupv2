const DEFAULT_PARTNER_TAG = "rasenrobote07-21";

/**
 * Ersetzt (oder ergänzt) `tag=` in Amazon-Affiliate-URLs.
 *
 * Vorher wurde ein bestehender `tag=` nicht überschrieben — dadurch landeten
 * „fremde" Partner-Tags aus importierten Links unbemerkt in Produktlinks und
 * wir verloren Provisionen. Jetzt wird der eigene Tag garantiert gesetzt.
 *
 * @param explicitTag Wenn gesetzt (z. B. aus Admin-DB), hat Vorrang vor `AMAZON_PARTNER_TAG`.
 */
export function applyAmazonPartnerTag(
  url: string | null | undefined,
  explicitTag?: string | null,
): string | null {
  if (!url?.trim()) return null;
  const fromExplicit = explicitTag?.trim();
  const tag = (fromExplicit && fromExplicit.length > 0
    ? fromExplicit
    : (process.env.AMAZON_PARTNER_TAG ?? DEFAULT_PARTNER_TAG)
  ).trim();
  try {
    const parsed = new URL(url.trim());
    parsed.searchParams.set("tag", tag);
    return parsed.toString();
  } catch {
    // Kein valides absolutes URL-Format (z. B. relativer Pfad) — unverändert zurückgeben.
    return url.trim();
  }
}
