import { EntityExtractionResult } from './entity-extractor';
import { IntentClassification } from './intent-classifier';
import { AI_CONFIG, AIServiceError, openai } from './openai';

export interface ResponseGenerationResult {
  message: string;
  actions: SuggestedAction[];
  requiresConfirmation: boolean;
  confidence: number;
}

export interface SuggestedAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'read';
  entity: 'payee' | 'category';
  data: Record<string, any>;
  description: string;
}

const RESPONSE_GENERATOR_PROMPT = `
You are a helpful AI assistant for an accounting system. Generate natural, conversational responses that:

1. Acknowledge the user's request
2. Summarize what you understand
3. Suggest specific actions to take
4. Ask for confirmation when needed

Respond with JSON:
{
  "message": "conversational_response",
  "actions": [
    {
      "id": "unique_id",
      "type": "create|update|delete|read",
      "entity": "payee|category",
      "data": {"field": "value"},
      "description": "what_this_action_does"
    }
  ],
  "requiresConfirmation": boolean,
  "confidence": 0.95
}

Guidelines:
- Be conversational and helpful
- Clearly state what you plan to do
- Ask for confirmation for destructive actions (delete, update)
- Suggest reasonable defaults for missing information
- Be specific about what data you need
`;

export class ResponseGenerator {
  async generateResponse(
    originalMessage: string,
    classification: IntentClassification,
    extraction: EntityExtractionResult,
    context?: any
  ): Promise<ResponseGenerationResult> {
    try {
      const prompt = this.buildResponsePrompt(
        originalMessage,
        classification,
        extraction,
        context
      );

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: RESPONSE_GENERATOR_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 600,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new AIServiceError('Empty response from AI', 'EMPTY_RESPONSE');
      }

      return this.parseResponseGeneration(content);
    } catch (error) {
      console.error('Response generation failed:', error);

      if (error instanceof AIServiceError) {
        throw error;
      }

      throw new AIServiceError(
        'Failed to generate response',
        'GENERATION_ERROR',
        error
      );
    }
  }

  async generateClarificationResponse(
    originalMessage: string,
    missingFields: string[],
    ambiguousEntities: string[]
  ): Promise<string> {
    const prompt = `
Original message: "${originalMessage}"
Missing required fields: ${missingFields.join(', ')}
Ambiguous entities: ${ambiguousEntities.join(', ')}

Generate a helpful clarification request that asks for the missing information in a conversational way.
Just return the message text, no JSON.
`;

    try {
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 200,
      });

      return (
        response.choices[0].message.content ||
        'I need more information to help you with that.'
      );
    } catch (error) {
      console.error('Clarification generation failed:', error);
      return 'I need more information to help you with that. Could you please provide more details?';
    }
  }

  private buildResponsePrompt(
    originalMessage: string,
    classification: IntentClassification,
    extraction: EntityExtractionResult,
    context?: any
  ): string {
    return `
Original message: "${originalMessage}"
Intent: ${classification.intent}
Intent confidence: ${classification.confidence}
Extracted entities: ${JSON.stringify(extraction.entities)}
Missing required fields: ${extraction.missingRequiredFields.join(', ')}

${
  context?.existingPayees?.length
    ? `Existing payees: ${context.existingPayees
        .map((p: any) => `${p.name} (${p.id})`)
        .join(', ')}`
    : ''
}

${
  context?.existingCategories?.length
    ? `Existing categories: ${context.existingCategories
        .map((c: any) => `${c.name} (${c.id})`)
        .join(', ')}`
    : ''
}

Generate an appropriate response and suggested actions.
`;
  }

  private parseResponseGeneration(content: string): ResponseGenerationResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        message: parsed.message || 'I understand your request.',
        actions: parsed.actions || [],
        requiresConfirmation: parsed.requiresConfirmation || false,
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      console.error('Failed to parse response generation:', error);

      return {
        message: 'I understand your request, but I need to process it further.',
        actions: [],
        requiresConfirmation: true,
        confidence: 0.1,
      };
    }
  }

  generateStreamingResponse(message: string): ReadableStream<string> {
    return new ReadableStream({
      async start(controller) {
        try {
          const stream = await openai.chat.completions.create({
            model: AI_CONFIG.model,
            messages: [{ role: 'user', content: message }],
            stream: true,
            temperature: 0.3,
          });

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(content);
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }
}
