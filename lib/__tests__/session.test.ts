import { describe, it, expect } from 'vitest';
import { generateSessionId } from '../session';

describe('generateSessionId', () => {
  it('should return a non-empty string', () => {
    const id = generateSessionId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('should contain a hyphen separator', () => {
    const id = generateSessionId();
    expect(id).toContain('-');
  });

  it('should generate unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateSessionId());
    }
    expect(ids.size).toBe(100);
  });

  it('should match expected format', () => {
    const id = generateSessionId();
    // Format: {timestamp-base36}-{random-base36}
    expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });
});
