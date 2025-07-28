import { ExtractedEntity, Intent } from './intent-classifier';
import { AI_CONFIG, AIServiceError, openai } from './openai';

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  confidence: number;
  ambiguousEntities: string[];
  missingRequiredFields: string[];
}

const ENTITY_EXTRACTOR_PROMPT = `
You are an expert at extracting structured data from natural language text for managing payees and categories.

Extract the following entity types:
- name: Person or company names
- email: Email addresses
- phone: Phone numbers
- address: Physical addresses
- category: Category names or types
- id: Identifiers (IDs, reference numbers)
- description: Additional descriptive text

Respond with a JSON object:
{
  "entities": [
    {
      "type": "entity_type",
      "value": "extracted_value",
      "confidence": 0.95,
      "context": "surrounding_context"
    }
  ],
  "confidence": 0.9,
  "ambiguousEntities": ["unclear_references"],
  "missingRequiredFields": ["required_field_names"]
}

Be conservative with confidence scores. Only mark high confidence (>0.8) for clearly identifiable entities.
`;

export class EntityExtractor {
  async extractEntities(
    message: string,
    intent: Intent,
    context?: any
  ): Promise<EntityExtractionResult> {
    try {
      const prompt = this.buildExtractionPrompt(message, intent, context);

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: ENTITY_EXTRACTOR_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2, // Lower temperature for more consistent extraction
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new AIServiceError('Empty response from AI', 'EMPTY_RESPONSE');
      }

      return this.parseExtractionResponse(content, intent);
    } catch (error) {
      console.error('Entity extraction failed:', error);

      if (error instanceof AIServiceError) {
        throw error;
      }

      throw new AIServiceError(
        'Failed to extract entities',
        'EXTRACTION_ERROR',
        error
      );
    }
  }

  private buildExtractionPrompt(
    message: string,
    intent: Intent,
    context?: any
  ): string {
    const requiredFields = this.getRequiredFieldsForIntent(intent);

    let prompt = `
Message: "${message}"
Intent: ${intent}
Required fields for this operation: ${requiredFields.join(', ')}

Extract all relevant entities from the message.
`;

    if (context?.existingPayees?.length) {
      prompt += `\nExisting payees to match against: ${context.existingPayees
        .map((p: any) => `${p.name} (ID: ${p.id})`)
        .join(', ')}`;
    }

    if (context?.existingCategories?.length) {
      prompt += `\nExisting categories: ${context.existingCategories
        .map((c: any) => `${c.name} (ID: ${c.id})`)
        .join(', ')}`;
    }

    return prompt;
  }

  private getRequiredFieldsForIntent(intent: Intent): string[] {
    const requirements: Record<Intent, string[]> = {
      CREATE_PAYEE: ['name'],
      UPDATE_PAYEE: ['name', 'id'],
      DELETE_PAYEE: ['name', 'id'],
      READ_PAYEE: [],
      CREATE_CATEGORY: ['name'],
      UPDATE_CATEGORY: ['name', 'id'],
      DELETE_CATEGORY: ['name', 'id'],
      READ_CATEGORY: [],
      CLARIFY: [],
      HELP: [],
      UNKNOWN: [],
    };

    return requirements[intent] || [];
  }

  private parseExtractionResponse(
    content: string,
    intent: Intent
  ): EntityExtractionResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const requiredFields = this.getRequiredFieldsForIntent(intent);

      // Check for missing required fields
      const extractedTypes = parsed.entities?.map((e: any) => e.type) || [];
      const missingFields = requiredFields.filter(
        (field) => !extractedTypes.includes(field)
      );

      return {
        entities: parsed.entities || [],
        confidence: parsed.confidence || 0,
        ambiguousEntities: parsed.ambiguousEntities || [],
        missingRequiredFields: missingFields,
      };
    } catch (error) {
      console.error('Failed to parse extraction response:', error);

      // Fallback response
      const requiredFields = this.getRequiredFieldsForIntent(intent);

      return {
        entities: [],
        confidence: 0,
        ambiguousEntities: [],
        missingRequiredFields: requiredFields,
      };
    }
  }

  calculateOverallConfidence(
    intentConfidence: number,
    entityConfidences: number[],
    hasRequiredFields: boolean
  ): number {
    const avgEntityConfidence =
      entityConfidences.length > 0
        ? entityConfidences.reduce((a, b) => a + b) / entityConfidences.length
        : 0;

    const completenessBonus = hasRequiredFields ? 0.1 : -0.2;

    return Math.min(
      1.0,
      Math.max(
        0.0,
        intentConfidence * 0.6 + avgEntityConfidence * 0.4 + completenessBonus
      )
    );
  }
}
