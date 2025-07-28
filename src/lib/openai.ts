import { ProcessedIntent } from '@/types/conversation';
import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

export const DEFAULT_MODEL = 'gpt-4o-mini';

export const SYSTEM_PROMPTS = {
  INTENT_CLASSIFICATION: `You are an AI assistant for an accounting application that helps users manage payees and categories through natural language.

Your task is to analyze user messages and determine:
1. The intent (create, read, update, delete, or clarify)
2. The entity type (payee or category)
3. Extract relevant data from the message
4. Determine if clarification is needed

Respond ONLY with valid JSON in this exact format:
{
  "action": "create|read|update|delete|clarify",
  "entity": "payee|category",
  "data": {
    "name": "extracted name if available",
    "description": "extracted description if available",
    "type": "income|expense (for categories only)",
    "search_term": "search term for read operations",
    "id": "entity id if mentioned"
  },
  "confidence": 0.85,
  "needsClarification": false,
  "clarificationQuestions": []
}

Examples:
- "Add a new payee called John's Coffee Shop" → {"action": "create", "entity": "payee", "data": {"name": "John's Coffee Shop"}, "confidence": 0.95, "needsClarification": false}
- "Create an expense category for office supplies" → {"action": "create", "entity": "category", "data": {"name": "office supplies", "type": "expense"}, "confidence": 0.90, "needsClarification": false}
- "Show me all payees with 'bank' in the name" → {"action": "read", "entity": "payee", "data": {"search_term": "bank"}, "confidence": 0.85, "needsClarification": false}
- "I want to add something" → {"action": "clarify", "entity": "", "data": {}, "confidence": 0.30, "needsClarification": true, "clarificationQuestions": ["What would you like to add - a payee or a category?", "What is the name of the item you want to add?"]}`,

  CONVERSATION: `You are a helpful AI assistant for an accounting application. You help users manage payees and categories through natural language interactions.

Key capabilities:
- Create, read, update, and delete payees
- Create, read, update, and delete categories (income/expense)
- Search and filter data
- Provide helpful responses about operations

Guidelines:
- Be concise and professional
- Confirm successful operations clearly
- Ask for clarification when requests are ambiguous
- Provide helpful suggestions when appropriate
- Format lists and data in a readable way`,
};

export async function classifyIntent(
  userMessage: string
): Promise<ProcessedIntent> {
  try {
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.INTENT_CLASSIFICATION },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error classifying intent:', error);
    // Return a safe fallback response
    return {
      action: 'clarify',
      entity: 'payee', // Default entity to satisfy type requirements
      data: {},
      confidence: 0.0,
      needsClarification: true,
      clarificationQuestions: [
        "I didn't understand that. Could you please rephrase your request?",
      ],
    };
  }
}

export async function generateResponse(
  userMessage: string,
  context?: string,
  operationResult?: unknown
): Promise<string> {
  try {
    const openai = getOpenAIClient();

    const contextMessage = context
      ? `Context: ${context}\n\nOperation Result: ${JSON.stringify(
          operationResult,
          null,
          2
        )}\n\n`
      : '';

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.CONVERSATION },
        {
          role: 'user',
          content: `${contextMessage}User message: ${userMessage}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return (
      response.choices[0]?.message?.content ||
      'I apologize, but I encountered an error processing your request.'
    );
  } catch (error) {
    console.error('Error generating response:', error);
    return 'I apologize, but I encountered an error processing your request. Please try again.';
  }
}
