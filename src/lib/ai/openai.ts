import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export { openai };

export const AI_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.1,
  maxTokens: 1000,
  streamingEnabled: true,
} as const;

export interface AIError {
  code: string;
  message: string;
  details?: any;
}

export class AIServiceError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export async function validateAIConnection(): Promise<boolean> {
  try {
    const response = await openai.models.list();
    return response.data.length > 0;
  } catch (error) {
    console.error('AI connection validation failed:', error);
    return false;
  }
}
