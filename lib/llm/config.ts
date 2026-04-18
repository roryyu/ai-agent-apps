export const API_TYPE = process.env.API_TYPE || 'anthropic';
export const API_KEY = process.env.API_KEY || '';
export const BASE_URL = process.env.BASE_URL || '';
export const MODEL = process.env.MODEL || (API_TYPE === 'anthropic' ? 'claude-3-opus-20240229' : 'gpt-4');
