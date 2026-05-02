import { describe, it, expect } from 'vitest';
import {
  validateChatRequest,
  validateChatLoveRequest,
  MAX_USER_PROMPT_LENGTH,
  MAX_DESC_LENGTH,
} from '../api';

describe('validateChatRequest', () => {
  it('should reject null body', () => {
    const result = validateChatRequest(null);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Invalid request body');
    }
  });

  it('should reject missing userPrompt', () => {
    const result = validateChatRequest({ formData: {}, sessionId: 's1' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('userPrompt is required');
    }
  });

  it('should reject empty userPrompt', () => {
    const result = validateChatRequest({ userPrompt: '   ', formData: {}, sessionId: 's1' });
    expect(result.valid).toBe(false);
  });

  it('should reject oversized userPrompt', () => {
    const result = validateChatRequest({
      userPrompt: 'a'.repeat(MAX_USER_PROMPT_LENGTH + 1),
      formData: {},
      sessionId: 's1',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('userPrompt too long');
    }
  });

  it('should reject invalid type parameter', () => {
    const result = validateChatRequest({
      userPrompt: 'hello',
      formData: {},
      sessionId: 's1',
      type: '../etc/passwd',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Invalid type parameter');
    }
  });

  it('should accept valid request without type', () => {
    const result = validateChatRequest({
      userPrompt: 'hello',
      formData: {},
      sessionId: 's1',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.userPrompt).toBe('hello');
      expect(result.data.type).toBeUndefined();
    }
  });

  it('should accept valid request with type', () => {
    const result = validateChatRequest({
      userPrompt: 'hello',
      formData: {},
      sessionId: 's1',
      type: 'treehole',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.type).toBe('treehole');
    }
  });
});

describe('validateChatLoveRequest', () => {
  it('should reject missing formData', () => {
    const result = validateChatLoveRequest({ userPrompt: 'hello', sessionId: 's1' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('formData is required');
    }
  });

  it('should reject missing selfDesc', () => {
    const result = validateChatLoveRequest({
      userPrompt: 'hello',
      formData: { partnerDesc: 'tall' },
      sessionId: 's1',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('selfDesc is required');
    }
  });

  it('should reject missing partnerDesc', () => {
    const result = validateChatLoveRequest({
      userPrompt: 'hello',
      formData: { selfDesc: 'kind' },
      sessionId: 's1',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('partnerDesc is required');
    }
  });

  it('should reject oversized description', () => {
    const result = validateChatLoveRequest({
      userPrompt: 'hello',
      formData: { selfDesc: 'a'.repeat(MAX_DESC_LENGTH + 1), partnerDesc: 'ok' },
      sessionId: 's1',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Description too long');
    }
  });

  it('should accept valid love request', () => {
    const result = validateChatLoveRequest({
      userPrompt: 'help me find love',
      formData: { selfDesc: 'kind person', partnerDesc: 'tall and funny' },
      sessionId: 's1',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.formData.selfDesc).toBe('kind person');
      expect(result.data.formData.partnerDesc).toBe('tall and funny');
      expect(result.data.type).toBe('love');
    }
  });
});
