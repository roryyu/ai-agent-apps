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

export const tokenCounter = new TokenCounter();
