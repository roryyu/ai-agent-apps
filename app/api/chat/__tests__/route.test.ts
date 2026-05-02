import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the LLM SDKs before importing the route
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      stream: vi.fn().mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield {
            type: 'content_block_delta',
            delta: { type: 'text_delta', text: 'Hello from Anthropic' },
          };
        },
      }),
    },
  })),
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          async *[Symbol.asyncIterator]() {
            yield {
              choices: [{ delta: { content: 'Hello from OpenAI' } }],
            };
          },
        }),
      },
    },
  })),
}));

vi.mock('@/lib/llm/config', () => ({
  API_TYPE: 'anthropic',
  API_KEY: 'test-key',
  BASE_URL: '',
  MODEL: 'claude-3-opus-20240229',
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 9 }),
}));

import { POST } from '@/app/api/chat/route';
import { checkRateLimit } from '@/lib/rate-limit';

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for invalid JSON body', async () => {
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 for missing userPrompt', async () => {
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ formData: {}, sessionId: 's1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('userPrompt is required');
  });

  it('should return 400 for path traversal in type', async () => {
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        userPrompt: 'hello',
        formData: {},
        sessionId: 's1',
        type: '../etc/passwd',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid type parameter');
  });

  it('should return 429 when rate limited', async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce({ allowed: false, remaining: 0 });

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ userPrompt: 'hello', formData: {}, sessionId: 's1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe('Too many requests');
  });

  it('should return SSE stream for valid request', async () => {
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ userPrompt: 'hello', formData: {}, sessionId: 's1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  });
});
