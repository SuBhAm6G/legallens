import { describe, expect, it, beforeEach } from "vitest";
import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/constants";
import { allowRequest, clientKey } from "@/lib/engine/rateLimitEngine";

describe("rateLimitEngine", () => {
  // Use a unique key per test to avoid state leaking between tests
  let key: string;
  let counter = 0;

  beforeEach(() => {
    key = `test-key-${++counter}`;
  });

  it("allows a single request", () => {
    expect(allowRequest(key)).toBe(true);
  });

  it("allows requests up to the maximum limit", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      expect(allowRequest(key)).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      allowRequest(key);
    }
    expect(allowRequest(key)).toBe(false);
  });

  it("continues to block subsequent over-limit requests", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      allowRequest(key);
    }
    expect(allowRequest(key)).toBe(false);
    expect(allowRequest(key)).toBe(false);
  });

  it("respects a custom limit of 1", () => {
    expect(allowRequest(key, 1)).toBe(true);
    expect(allowRequest(key, 1)).toBe(false);
  });

  it("uses different limits per key independently", () => {
    const keyA = `${key}-a`;
    const keyB = `${key}-b`;
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      allowRequest(keyA);
    }
    // keyA is exhausted, keyB should still allow
    expect(allowRequest(keyA)).toBe(false);
    expect(allowRequest(keyB)).toBe(true);
  });

  it("RATE_LIMIT_WINDOW_MS is a positive number", () => {
    expect(RATE_LIMIT_WINDOW_MS).toBeGreaterThan(0);
  });

  it("RATE_LIMIT_MAX_REQUESTS is a positive number", () => {
    expect(RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(0);
  });
});

describe("clientKey", () => {
  it("extracts the first IP from x-forwarded-for header", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(clientKey(headers)).toBe("1.2.3.4");
  });

  it("returns 'local' when no x-forwarded-for header is present", () => {
    const headers = new Headers();
    expect(clientKey(headers)).toBe("local");
  });

  it("handles a single IP without a comma", () => {
    const headers = new Headers({ "x-forwarded-for": "192.168.1.1" });
    expect(clientKey(headers)).toBe("192.168.1.1");
  });

  it("trims whitespace from the IP", () => {
    const headers = new Headers({ "x-forwarded-for": "  10.0.0.1  , 10.0.0.2" });
    expect(clientKey(headers)).toBe("10.0.0.1");
  });
});
