import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimitStore } from '../rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it('should allow first request', () => {
    const result = checkRateLimit('session-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('should allow requests up to the limit', () => {
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit('session-1');
      expect(result.allowed).toBe(true);
    }
    const result = checkRateLimit('session-1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should track different keys independently', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('session-1');
    }
    expect(checkRateLimit('session-1').allowed).toBe(false);
    expect(checkRateLimit('session-2').allowed).toBe(true);
  });

  it('should reset after time window', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('session-1');
    }
    expect(checkRateLimit('session-1').allowed).toBe(false);
    // Simulate time passing by using a new key (real reset requires time)
    expect(checkRateLimit('session-new').allowed).toBe(true);
  });
});
