/**
 * Kleiner In-Memory Token-Bucket-Rate-Limiter.
 *
 * **Absichtlich minimal**: läuft pro Serverprozess (kein Cluster-Share). Für
 * Production mit mehreren Instanzen durch Upstash/Redis o. Ä. austauschen.
 * Schnittstelle `RateLimiter` bleibt dabei identisch.
 */

export interface RateLimitDecision {
  ok: boolean;
  /** Sekunden bis zum nächsten freien Token (0, wenn `ok`). */
  retryAfterSeconds: number;
  /** Aktuelle Token-Menge im Bucket nach dem `consume`. */
  remaining: number;
}

export interface RateLimiter {
  consume(key: string): RateLimitDecision;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export interface TokenBucketOptions {
  /** Max. Tokens pro Bucket (= „Burst“). */
  capacity: number;
  /** Nachfüllrate in Tokens pro Sekunde. */
  refillPerSecond: number;
  /** Optional injizierbarer Zeitgeber (für Tests). */
  now?: () => number;
}

export function createTokenBucketLimiter(opts: TokenBucketOptions): RateLimiter {
  const { capacity, refillPerSecond } = opts;
  if (capacity <= 0 || refillPerSecond <= 0) {
    throw new Error("capacity and refillPerSecond must be positive");
  }
  const now = opts.now ?? Date.now;
  const buckets = new Map<string, Bucket>();

  return {
    consume(key: string): RateLimitDecision {
      const ts = now();
      const existing = buckets.get(key);
      const bucket: Bucket = existing
        ? refill(existing, ts, capacity, refillPerSecond)
        : { tokens: capacity, updatedAt: ts };

      if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        buckets.set(key, bucket);
        return { ok: true, retryAfterSeconds: 0, remaining: Math.floor(bucket.tokens) };
      }

      const missing = 1 - bucket.tokens;
      const retryAfterSeconds = Math.ceil(missing / refillPerSecond);
      buckets.set(key, bucket);
      return { ok: false, retryAfterSeconds, remaining: 0 };
    },
  };
}

function refill(
  bucket: Bucket,
  nowMs: number,
  capacity: number,
  refillPerSecond: number,
): Bucket {
  const elapsedSeconds = Math.max(0, (nowMs - bucket.updatedAt) / 1000);
  const tokens = Math.min(capacity, bucket.tokens + elapsedSeconds * refillPerSecond);
  return { tokens, updatedAt: nowMs };
}
