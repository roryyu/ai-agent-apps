import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { API_TYPE, API_KEY, BASE_URL, MODEL } from '@/lib/llm/config';
import { validateChatRequest } from '@/lib/types/api';
import { checkRateLimit } from '@/lib/rate-limit';
import fs from 'fs/promises';
import path from 'path';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | Record<string, unknown>;
}

const ALLOWED_SOUL_FILES = new Set(['soul.md', 'entrepreneurship.md', 'treehole.md']);

const DEFAULT_PROMPT = '你是一个有用的助手。请根据用户提供的信息给出详细、有帮助的回答。';

async function readSoulFile(filename: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'soul', filename);
    return (await fs.readFile(filePath, 'utf-8')).trim();
  } catch {
    return null;
  }
}

async function getSystemPrompt(type?: string): Promise<string> {
  let personaFile = 'soul.md';
  if (type === 'entrepreneurship') {
    personaFile = 'entrepreneurship.md';
  }
  if (type === 'treehole') {
    personaFile = 'treehole.md';
  }

  if (!ALLOWED_SOUL_FILES.has(personaFile)) {
    return DEFAULT_PROMPT;
  }

  const [base, persona] = await Promise.all([readSoulFile('_base.md'), readSoulFile(personaFile)]);

  if (!persona) {
    return DEFAULT_PROMPT;
  }

  return base ? `${base}\n\n${persona}` : persona;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validateChatRequest(body);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const { userPrompt, formData, sessionId, type } = validation.data;

  const rateLimitKey = sessionId || request.headers.get('x-session-id') || 'unknown';
  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const requestId = sessionId || request.headers.get('x-session-id') || 'unknown';
  console.warn(`[${requestId}] New chat request received`);

  const systemPrompt = await getSystemPrompt(type);

  const messages: Message[] = [];

  messages.push({
    role: 'system',
    content: systemPrompt,
  });

  let finalUserPrompt = userPrompt;
  if (formData && Object.keys(formData).length > 0) {
    finalUserPrompt = `${userPrompt}`;
  }

  messages.push({
    role: 'user',
    content: finalUserPrompt,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.warn(`[${requestId}] Starting LLM stream`);
        if (API_TYPE === 'openai') {
          const client = new OpenAI({
            apiKey: API_KEY,
            baseURL: BASE_URL || undefined,
          });

          const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map((m) => ({
            role: m.role as 'system' | 'user' | 'assistant',
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          }));

          const stream = await client.chat.completions.create({
            model: MODEL,
            messages: openaiMessages,
            stream: true,
          });

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta as Record<string, unknown> | undefined;
            const content = (delta?.content as string) || '';
            const reasoning_content = (delta?.reasoning_content as string) || '';
            if (reasoning_content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ reasoning_content })}\n\n`)
              );
            }
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
        } else {
          const client = new Anthropic({
            apiKey: API_KEY,
            baseURL: BASE_URL || undefined,
          });

          const systemMessage = messages.find((m) => m.role === 'system');
          const chatMessages = messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            }));

          const stream = client.messages.stream({
            model: MODEL,
            max_tokens: 4096,
            system: typeof systemMessage?.content === 'string' ? systemMessage.content : undefined,
            messages: chatMessages,
          });

          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const content = chunk.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
        }

        console.warn(`[${requestId}] Stream completed`);
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (error) {
        console.error(`[${requestId}] Stream error:`, error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
