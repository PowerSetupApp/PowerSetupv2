import { describe, expect, it } from "vitest";

import { createTokenBucketLimiter } from "./token-bucket";

describe("createTokenBucketLimiter", () => {
  it("rejects invalid configuration", () => {
    expect(() => createTokenBucketLimiter({ capacity: 0, refillPerSecond: 1 })).toThrow();
    expect(() => createTokenBucketLimiter({ capacity: 1, refillPerSecond: 0 })).toThrow();
  });

  it("permits burst up to capacity and then throttles", () => {
    const t = 0;
    const limiter = createTokenBucketLimiter({
      capacity: 3,
      refillPerSecond: 1,
      now: () => t,
    });

    expect(limiter.consume("k").ok).toBe(true);
    expect(limiter.consume("k").ok).toBe(true);
    expect(limiter.consume("k").ok).toBe(true);
    const denied = limiter.consume("k");
    expect(denied.ok).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
    expect(denied.remaining).toBe(0);
  });

  it("refills tokens over time", () => {
    let t = 0;
    const limiter = createTokenBucketLimiter({
      capacity: 2,
      refillPerSecond: 2,
      now: () => t,
    });
    limiter.consume("x");
    limiter.consume("x");
    expect(limiter.consume("x").ok).toBe(false);
    t += 1000;
    expect(limiter.consume("x").ok).toBe(true);
  });

  it("isolates buckets per key", () => {
    const t = 0;
    const limiter = createTokenBucketLimiter({
      capacity: 1,
      refillPerSecond: 1,
      now: () => t,
    });
    expect(limiter.consume("a").ok).toBe(true);
    expect(limiter.consume("a").ok).toBe(false);
    expect(limiter.consume("b").ok).toBe(true);
  });
});
