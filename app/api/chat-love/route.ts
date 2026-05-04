import { llmClient } from '@/lib/llm';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { API_TYPE, API_KEY, BASE_URL, MODEL } from '@/lib/llm/config';
import { validateChatLoveRequest } from '@/lib/types/api';
import { checkRateLimit } from '@/lib/rate-limit';
import fs from 'fs/promises';
import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

interface LoveRecord {
  selfDesc: string;
  partnerDesc: string;
}

const cwd = process.cwd();
const adapter = new JSONFile<Record<string, LoveRecord[]>>(path.join(cwd, 'db.json'));
const allMBTI = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
];
const gender = ['male', 'female'];
const initDb: Record<string, LoveRecord[]> = {};
allMBTI.forEach((mbti) => {
  gender.forEach((g) => {
    initDb[`${mbti}-${g}`] = [];
  });
});
initDb['ENFP-female']!.push({
  selfDesc: '女，35岁，性格活泼，开心，自信',
  partnerDesc: '男，40岁，程序员，喜欢徒步',
});
const db = new Low(adapter, initDb);

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | Record<string, unknown>;
}

const LOVE_FALLBACK_PROMPT = '你是一个恋爱顾问。请根据用户提供的信息给出温暖、有帮助的恋爱建议。';

async function readSoulFile(filename: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'soul', filename);
    return (await fs.readFile(filePath, 'utf-8')).trim();
  } catch {
    return null;
  }
}

async function getSystemPrompt(): Promise<string> {
  const [base, persona] = await Promise.all([readSoulFile('_base.md'), readSoulFile('love.md')]);

  if (!persona) {
    return LOVE_FALLBACK_PROMPT;
  }

  return base ? `${base}\n\n${persona}` : persona;
}

async function save(selfDesc: string, partnerDesc: string): Promise<string> {
  selfDesc = selfDesc.trim();
  partnerDesc = partnerDesc.trim();
  let result = '\n\n暂未匹配到有缘人，别灰心，稍等就会来ღ( ´･ᴗ･` )';

  let self: { mbti: string; gender: string };
  let partner: { mbti: string; gender: string };

  try {
    const [response1, response2] = await Promise.all([
      llmClient.chat([
        {
          role: 'system',
          content: `你是Isabel Briggs Myers,著名心理学家`,
        },
        {
          role: 'user',
          content: `根据【${selfDesc}】大致推断此人的MBTI和性别，返回格式是{"mbti": string, "gender": "male" | "female"}`,
        },
      ]),
      llmClient.chat([
        {
          role: 'system',
          content: `你是Isabel Briggs Myers,著名心理学家`,
        },
        {
          role: 'user',
          content: `根据【${partnerDesc}】大致推断此人的MBTI和性别，返回格式是{"mbti": string, "gender": "male" | "female"}`,
        },
      ]),
    ]);

    self = JSON.parse(response1.content);
    partner = JSON.parse(response2.content);
  } catch (error) {
    console.error('Failed to parse MBTI response:', error);
    return result;
  }

  try {
    const selfkey = `${self.mbti}-${self.gender}`;
    const partnerkey = `${partner.mbti}-${partner.gender}`;

    let isAdded = false;
    const partnerList = db.data[partnerkey];
    if (partnerList) {
      for (let i = 0; i < partnerList.length; i++) {
        if (partnerList[i]!.selfDesc === selfDesc && partnerList[i]!.partnerDesc === partnerDesc) {
          isAdded = true;
          break;
        }
      }
    }

    if (!isAdded && db.data[selfkey]) {
      db.data[selfkey]!.push({ selfDesc, partnerDesc });
    }
    await db.write();

    if (partnerList && partnerList.length > 0) {
      const randomIndex = Math.floor(Math.random() * partnerList.length);
      const randomItem = partnerList[randomIndex]!;
      result = `\n\n### 系统为您匹配的TA\n\n${randomItem.selfDesc}\n\nTA的理想型是${randomItem.partnerDesc}`;
    }
  } catch (error) {
    console.error('Failed to save match data:', error);
  }

  return result;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validateChatLoveRequest(body);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const { userPrompt, formData, sessionId } = validation.data;

  const rateLimitKey = sessionId || request.headers.get('x-session-id') || 'unknown';
  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const requestId = sessionId || request.headers.get('x-session-id') || 'unknown';
  console.warn(`[${requestId}] New chat request received`);

  const systemPrompt = await getSystemPrompt();

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
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ system_content: '\n\n系统正在匹配中请,稍等...' })}\n\n`
          )
        );
        const getResult = await save(formData.selfDesc, formData.partnerDesc);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ system_content: getResult })}\n\n`)
        );
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
