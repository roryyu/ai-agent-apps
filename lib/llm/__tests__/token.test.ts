import { describe, it, expect, beforeEach } from 'vitest';

class TokenCounter {
  private inputTokens: number = 0;
  private outputTokens: number = 0;

  add(input: number, output: number): void {
    this.inputTokens += input;
    this.outputTokens += output;
  }

  getUsage(): { inputTokens: number; outputTokens: number; totalTokens: number } {
    return {
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.inputTokens + this.outputTokens,
    };
  }

  reset(): void {
    this.inputTokens = 0;
    this.outputTokens = 0;
  }
}

describe('TokenCounter', () => {
  let counter: TokenCounter;

  beforeEach(() => {
    counter = new TokenCounter();
  });

  it('should start with zero tokens', () => {
    const usage = counter.getUsage();
    expect(usage.inputTokens).toBe(0);
    expect(usage.outputTokens).toBe(0);
    expect(usage.totalTokens).toBe(0);
  });

  it('should accumulate tokens', () => {
    counter.add(100, 50);
    counter.add(200, 75);
    const usage = counter.getUsage();
    expect(usage.inputTokens).toBe(300);
    expect(usage.outputTokens).toBe(125);
    expect(usage.totalTokens).toBe(425);
  });

  it('should reset counters to zero', () => {
    counter.add(100, 50);
    counter.reset();
    expect(counter.getUsage().totalTokens).toBe(0);
  });

  it('should handle zero values', () => {
    counter.add(0, 0);
    expect(counter.getUsage().totalTokens).toBe(0);
  });

  it('should accumulate after reset', () => {
    counter.add(100, 50);
    counter.reset();
    counter.add(10, 5);
    const usage = counter.getUsage();
    expect(usage.inputTokens).toBe(10);
    expect(usage.outputTokens).toBe(5);
    expect(usage.totalTokens).toBe(15);
  });
});
