export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | Record<string, unknown>;
}
