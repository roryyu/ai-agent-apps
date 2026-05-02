export interface ChatRequestBody {
  userPrompt: string;
  formData: Record<string, string>;
  sessionId: string;
  type?: 'treehole' | 'entrepreneurship';
}

export interface ChatLoveRequestBody {
  userPrompt: string;
  formData: {
    selfDesc: string;
    partnerDesc: string;
  };
  sessionId: string;
  type: 'love';
}

export interface SSEChunk {
  content?: string;
  reasoning_content?: string;
  system_content?: string;
}

export const VALID_CHAT_TYPES = ['treehole', 'entrepreneurship'] as const;
export const MAX_USER_PROMPT_LENGTH = 10000;
export const MAX_DESC_LENGTH = 2000;

export function validateChatRequest(body: unknown):
  | {
      valid: true;
      data: ChatRequestBody;
    }
  | {
      valid: false;
      error: string;
    } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { userPrompt, sessionId, type } = body as Record<string, unknown>;

  if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
    return { valid: false, error: 'userPrompt is required' };
  }

  if (userPrompt.length > MAX_USER_PROMPT_LENGTH) {
    return { valid: false, error: 'userPrompt too long' };
  }

  if (type !== undefined && !VALID_CHAT_TYPES.includes(type as 'treehole' | 'entrepreneurship')) {
    return { valid: false, error: 'Invalid type parameter' };
  }

  if (sessionId !== undefined && typeof sessionId !== 'string') {
    return { valid: false, error: 'sessionId must be a string' };
  }

  return {
    valid: true,
    data: {
      userPrompt,
      formData: ((body as Record<string, unknown>).formData as Record<string, string>) || {},
      sessionId: (sessionId as string) || '',
      type: type as 'treehole' | 'entrepreneurship' | undefined,
    },
  };
}

export function validateChatLoveRequest(body: unknown):
  | {
      valid: true;
      data: ChatLoveRequestBody;
    }
  | {
      valid: false;
      error: string;
    } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { userPrompt, formData, sessionId } = body as Record<string, unknown>;

  if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
    return { valid: false, error: 'userPrompt is required' };
  }

  if (userPrompt.length > MAX_USER_PROMPT_LENGTH) {
    return { valid: false, error: 'userPrompt too long' };
  }

  if (!formData || typeof formData !== 'object') {
    return { valid: false, error: 'formData is required' };
  }

  const fd = formData as Record<string, unknown>;
  if (!fd.selfDesc || typeof fd.selfDesc !== 'string' || fd.selfDesc.trim().length === 0) {
    return { valid: false, error: 'selfDesc is required' };
  }

  if (!fd.partnerDesc || typeof fd.partnerDesc !== 'string' || fd.partnerDesc.trim().length === 0) {
    return { valid: false, error: 'partnerDesc is required' };
  }

  if (fd.selfDesc.length > MAX_DESC_LENGTH || fd.partnerDesc.length > MAX_DESC_LENGTH) {
    return { valid: false, error: 'Description too long' };
  }

  return {
    valid: true,
    data: {
      userPrompt,
      formData: { selfDesc: fd.selfDesc, partnerDesc: fd.partnerDesc },
      sessionId: (sessionId as string) || '',
      type: 'love',
    },
  };
}
