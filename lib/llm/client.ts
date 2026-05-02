/**
 * LLM Client - Anthropic and OpenAI API clients
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { Message } from './types';
import { API_TYPE, API_KEY, BASE_URL, MODEL } from './config';
import { tokenCounter } from './token';

export interface LLMResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export abstract class LLMClient {
  abstract chat(messages: Message[]): Promise<LLMResponse>;
}

export class AnthropicClient extends LLMClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string = API_KEY, baseUrl?: string, model: string = MODEL) {
    super();
    this.client = new Anthropic({
      apiKey,
      baseURL: baseUrl || BASE_URL || undefined,
    });
    this.model = model;
  }

  async chat(messages: Message[]): Promise<LLMResponse> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: typeof systemMessage?.content === 'string' ? systemMessage.content : undefined,
      messages: chatMessages,
    });

    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    tokenCounter.add(inputTokens, outputTokens);

    const contentBlocks = response.content;
    let textContent = '';

    for (const block of contentBlocks) {
      if (block.type === 'text') {
        textContent += block.text;
      }
    }

    return {
      content: textContent,
      usage: {
        inputTokens,
        outputTokens,
      },
    };
  }
}

export class OpenAIClient extends LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string = API_KEY, baseUrl?: string, model: string = MODEL) {
    super();
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl || BASE_URL || undefined,
    });
    this.model = model;
  }

  async chat(messages: Message[]): Promise<LLMResponse> {
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map((m) => {
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return {
        role: m.role as 'system' | 'user' | 'assistant',
        content,
      } as
        | OpenAI.Chat.ChatCompletionSystemMessageParam
        | OpenAI.Chat.ChatCompletionUserMessageParam
        | OpenAI.Chat.ChatCompletionAssistantMessageParam;
    });

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
    });

    const choice = response.choices[0];
    const message = choice?.message;

    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    tokenCounter.add(inputTokens, outputTokens);

    return {
      content: message?.content || '',
      usage: {
        inputTokens,
        outputTokens,
      },
    };
  }
}

export function createClient(
  apiType: string = API_TYPE,
  apiKey: string = API_KEY,
  baseUrl?: string,
  model?: string
): LLMClient {
  if (apiType === 'openai') {
    return new OpenAIClient(apiKey, baseUrl, model || MODEL);
  }
  return new AnthropicClient(apiKey, baseUrl, model || MODEL);
}

export const llmClient = createClient();
export default llmClient;
