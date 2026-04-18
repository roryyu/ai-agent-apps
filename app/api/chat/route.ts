//import {llmClient} from '@/lib/llm';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { API_TYPE, API_KEY, BASE_URL, MODEL } from '@/lib/llm/config';
import fs from 'fs/promises';
import path from 'path';
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | Record<string, unknown>;
}
/*
//当前项目更目录
const cwd = process.cwd();
const wikiConfig = {
  wiki_root: path.join(cwd ,'llmwiki'),
  index_output: path.join(cwd ,'llmwiki','index.md'),
  log_output: path.join(cwd ,'llmwiki','log.md')
};

// 初始化索引管理器
const wikiManager = new LLMWikiIndexManager(wikiConfig);
const sessionIdInit = `session-update-${Date.now().toString().slice(-6)}`;
wikiManager.generateIndex(sessionIdInit);


//写入markdown文件
async function writeMarkdownFile(filename: string, content: string): Promise<void> {
  await fs.writeFile(path.join(wikiConfig.wiki_root,filename), content, 'utf-8');
}

async function saveWiki(userPrompt: string, content: string): Promise<void> {
  const sessionId = `session-initial-${Date.now().toString().slice(-6)}`;
  const response = await llmClient.chat([{
    role: 'user',
    content:`根据${userPrompt}，请生成此问题涉及的行业分类，返回格式是{"category": string}, 如果无法分辨，返回{"category":"other"}。`
  }]);
  try {
    const category = JSON.parse(response.content).category;
    const filename = `[${category}][${sessionId}].md`;
    await writeMarkdownFile(filename, `# ${category}\n\n## 提问\n\n${userPrompt}\n\n## 答案\n\n${content}`);
    wikiManager.generateIndex(sessionId);
  } catch (error) {
    console.error('Failed to parse response:', error);
  }
}
*/
async function getSystemPrompt(type?: string): Promise<string> {
  try {
    let md='soul.md';
    if(type=='entrepreneurship'){
      md='entrepreneurship.md';
    }
    if(type=='treehole'){
      md='treehole.md';
    }
    const soulPath = path.join(process.cwd(),'soul', md);
    const content = await fs.readFile(soulPath, 'utf-8');
    return content.trim();
  } catch (error) {
    console.error('Failed to read soul.md:', error);
    return '你是一个有用的助手。请根据用户提供的信息给出详细、有帮助的回答。';
  }
}
export async function POST(request: Request) {
  const { userPrompt, formData, sessionId,type } = await request.json();

  const requestId = sessionId || request.headers.get('x-session-id') || 'unknown';
  console.log(`[${requestId}] New chat request received`);

  const systemPrompt = await getSystemPrompt(type);

  const messages: Message[] = [];

  messages.push({
    role: 'system',
    content: systemPrompt,
  });

  let finalUserPrompt = userPrompt;
  if (formData && Object.keys(formData).length > 0) {
    const formDataStr = Object.entries(formData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    //finalUserPrompt = `${userPrompt}\n\n表单数据:\n${formDataStr}`;
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
        console.log(`[${requestId}] Starting LLM stream`);
        let finalContent = '';
        if (API_TYPE === 'openai') {
          const client = new OpenAI({
            apiKey: API_KEY,
            baseURL: BASE_URL || undefined,
          });

          const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map(m => ({
            role: m.role as 'system' | 'user' | 'assistant',
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          }));
          console.time('LLM Response')
          const stream = await client.chat.completions.create({
            model: MODEL,
            messages: openaiMessages,
            stream: true,
          });
          console.timeEnd('LLM Response')

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta as Record<string, unknown> | undefined;
            const content = (delta?.content as string) || '';
            const reasoning_content = (delta?.reasoning_content as string) || '';
            if (reasoning_content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ reasoning_content })}\n\n`));
            }
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              finalContent += content;
            }
          }
        } else {
          const client = new Anthropic({
            apiKey: API_KEY,
            baseURL: BASE_URL || undefined,
          });

          const systemMessage = messages.find(m => m.role === 'system');
          const chatMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
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
              finalContent += content;
            }
          }
        }

        console.log(`[${requestId}] Stream completed`);
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        //读取最终大模型返回的内容
        //await saveWiki(finalUserPrompt,finalContent)
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
        'Connection': 'keep-alive',
      },
    });
  }
