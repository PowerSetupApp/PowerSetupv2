import { EMOJI_TO_ICON_KEY } from "@/lib/icons/consumer-icon-map";
import { isIconKey, type IconKey } from "@/lib/icons/icon-keys";

const DEFAULT_FALLBACK: IconKey = "plug-zap";

/**
 * Converts legacy emoji or validates an existing key.
 * Unknown values → null (caller may use {@link DEFAULT_FALLBACK} when rendering).
 */
export function normalizeIconKey(raw: string | null | undefined): IconKey | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (isIconKey(trimmed)) return trimmed;
  const fromEmoji = EMOJI_TO_ICON_KEY[trimmed];
  if (fromEmoji) return fromEmoji;
  return null;
}

export function normalizeIconKeyOrFallback(raw: string | null | undefined): IconKey {
  return normalizeIconKey(raw) ?? DEFAULT_FALLBACK;
}
