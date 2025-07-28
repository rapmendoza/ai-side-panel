import { AI_CONFIG, AIServiceError, openai } from './openai';

export type Intent =
  | 'CREATE_PAYEE'
  | 'READ_PAYEE'
  | 'UPDATE_PAYEE'
  | 'DELETE_PAYEE'
  | 'CREATE_CATEGORY'
  | 'READ_CATEGORY'
  | 'UPDATE_CATEGORY'
  | 'DELETE_CATEGORY'
  | 'CLARIFY'
  | 'HELP'
  | 'UNKNOWN';

export interface IntentClassification {
  intent: Intent;
  confidence: number;
  entities: ExtractedEntity[];
  requiresClarification: boolean;
  clarificationQuestions: string[];
  rawResponse?: any;
}

export interface ExtractedEntity {
  type:
    | 'name'
    | 'email'
    | 'phone'
    | 'address'
    | 'category'
    | 'id'
    | 'description';
  value: string;
  confidence: number;
  context?: string;
}

const INTENT_CLASSIFIER_PROMPT = `
You are an AI assistant that classifies user intents for managing payees and categories in an accounting system.

INTENTS:
- CREATE_PAYEE: Creating a new payee/vendor
- READ_PAYEE: Searching, listing, or viewing payees
- UPDATE_PAYEE: Modifying existing payee information
- DELETE_PAYEE: Removing a payee
- CREATE_CATEGORY: Creating a new category
- READ_CATEGORY: Searching, listing, or viewing categories
- UPDATE_CATEGORY: Modifying existing category information
- DELETE_CATEGORY: Removing a category
- CLARIFY: User needs clarification or has ambiguous request
- HELP: User asking for help or instructions
- UNKNOWN: Cannot determine intent

Respond with a JSON object containing:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "entities": [
    {
      "type": "name|email|phone|address|category|id|description",
      "value": "extracted_value",
      "confidence": 0.9
    }
  ],
  "requiresClarification": false,
  "clarificationQuestions": []
}

Examples:
"Add vendor ABC Corp" -> {"intent": "CREATE_PAYEE", "confidence": 0.95, "entities": [{"type": "name", "value": "ABC Corp", "confidence": 0.9}]}
"Find all suppliers" -> {"intent": "READ_PAYEE", "confidence": 0.9, "entities": []}
"Update John's email to john@example.com" -> {"intent": "UPDATE_PAYEE", "confidence": 0.95, "entities": [{"type": "name", "value": "John", "confidence": 0.9}, {"type": "email", "value": "john@example.com", "confidence": 0.95}]}
`;

export class IntentClassifier {
  async classifyIntent(
    message: string,
    context?: {
      recentPayees?: { id: string; name: string }[];
      categories?: { id: string; name: string }[];
    }
  ): Promise<IntentClassification> {
    try {
      const prompt = this.buildClassificationPrompt(message, context);

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: INTENT_CLASSIFIER_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new AIServiceError('Empty response from AI', 'EMPTY_RESPONSE');
      }

      return this.parseClassificationResponse(content);
    } catch (error) {
      console.error('Intent classification failed:', error);

      if (error instanceof AIServiceError) {
        throw error;
      }

      throw new AIServiceError(
        'Failed to classify intent',
        'CLASSIFICATION_ERROR',
        error
      );
    }
  }

  private buildClassificationPrompt(message: string, context?: any): string {
    let prompt = `Message: "${message}"`;

    if (context?.recentPayees?.length) {
      prompt += `\n\nRecent payees: ${context.recentPayees
        .map((p: any) => p.name)
        .join(', ')}`;
    }

    if (context?.categories?.length) {
      prompt += `\n\nAvailable categories: ${context.categories
        .map((c: any) => c.name)
        .join(', ')}`;
    }

    return prompt;
  }

  private parseClassificationResponse(content: string): IntentClassification {
    try {
      // Clean the content to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        intent: parsed.intent || 'UNKNOWN',
        confidence: parsed.confidence || 0,
        entities: parsed.entities || [],
        requiresClarification: parsed.requiresClarification || false,
        clarificationQuestions: parsed.clarificationQuestions || [],
        rawResponse: parsed,
      };
    } catch (error) {
      console.error('Failed to parse classification response:', error);

      // Fallback response
      return {
        intent: 'UNKNOWN',
        confidence: 0,
        entities: [],
        requiresClarification: true,
        clarificationQuestions: [
          'I need more information to understand your request.',
        ],
      };
    }
  }
}
