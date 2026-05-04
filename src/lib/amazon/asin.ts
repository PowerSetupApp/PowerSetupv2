/**
 * Extracts ASIN from an Amazon URL or returns the input if it is already an ASIN.
 */
export function extractAsinFromAmazonInput(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Z0-9]{10}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const match = trimmed.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}
