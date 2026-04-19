import { createTokenBucketLimiter, type RateLimiter } from "./token-bucket";

/**
 * Globaler Limiter für `POST /api/generate/[id]` — schützt AI-Kosten vor
 * Replay/Brute-Force eines Ergebnis-Links. Default: 5 Requests / Minute,
 * Burst 10 pro Schlüssel.
 */
let generateLimiter: RateLimiter | null = null;
let pdfLimiter: RateLimiter | null = null;

export function getGenerateLimiter(): RateLimiter {
  if (!generateLimiter) {
    generateLimiter = createTokenBucketLimiter({ capacity: 10, refillPerSecond: 5 / 60 });
  }
  return generateLimiter;
}

export function getPdfSchematicLimiter(): RateLimiter {
  if (!pdfLimiter) {
    pdfLimiter = createTokenBucketLimiter({ capacity: 5, refillPerSecond: 3 / 60 });
  }
  return pdfLimiter;
}

/** Testhilfe — muss in Vitests aufgerufen werden, um Zustand nicht zu lecken. */
export function __resetRateLimitersForTest(): void {
  generateLimiter = null;
  pdfLimiter = null;
}

export { createTokenBucketLimiter } from "./token-bucket";
export type { RateLimiter, RateLimitDecision } from "./token-bucket";
