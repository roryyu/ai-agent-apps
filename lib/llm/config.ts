export const API_TYPE = process.env.API_TYPE || 'anthropic';
export const API_KEY = process.env.API_KEY || '';
export const BASE_URL = process.env.BASE_URL || '';
export const MODEL =
  process.env.MODEL || (API_TYPE === 'anthropic' ? 'claude-3-opus-20240229' : 'gpt-4');

if (!API_KEY) {
  console.error(
    'API_KEY is not set. Please set the API_KEY environment variable. ' +
      'The application will not function correctly without it.'
  );
}
