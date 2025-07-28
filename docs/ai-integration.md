# AI Integration Architecture

## Overview

The AI integration system provides natural language processing capabilities for managing payees and categories. It uses OpenAI's GPT-4 model with a structured pipeline for intent classification, entity extraction, and response generation.

## AI Processing Pipeline

### 1. Input Processing Flow

```
User Input → Preprocessing → Intent Classification → Entity Extraction → Confidence Scoring → Clarification Check → Response Generation → Database Operation → User Response
```

### 2. Core Components

#### Intent Classification System

**Intent Types:**

- `CREATE_PAYEE`: Create new payee
- `READ_PAYEE`: Search/retrieve payees
- `UPDATE_PAYEE`: Modify existing payee
- `DELETE_PAYEE`: Remove payee
- `CREATE_CATEGORY`: Create new category
- `READ_CATEGORY`: Search/retrieve categories
- `UPDATE_CATEGORY`: Modify existing category
- `DELETE_CATEGORY`: Remove category
- `CLARIFY`: Request clarification
- `HELP`: Show help information

**Implementation:**

```typescript
interface IntentClassification {
  intent: Intent;
  confidence: number;
  entities: ExtractedEntity[];
  requiresClarification: boolean;
  clarificationQuestions: string[];
  rawResponse?: any;
}

interface ExtractedEntity {
  type: 'name' | 'email' | 'phone' | 'address' | 'category' | 'id';
  value: string;
  confidence: number;
  context?: string;
}
```

#### Entity Extraction

**Extracted Data Types:**

- **Names and identifiers**: Payee names, category names, IDs
- **Contact information**: Email addresses, phone numbers, addresses
- **Financial details**: Tax IDs, account numbers
- **Category hierarchies**: Parent-child relationships
- **Relationships**: Associations between entities

**Extraction Logic:**

```typescript
interface EntityExtractionResult {
  entities: ExtractedEntity[];
  confidence: number;
  ambiguousEntities: string[];
  missingRequiredFields: string[];
}
```

## Prompt Engineering Strategy

### 1. System Prompts

#### Main AI Assistant

```typescript
const MAIN_ASSISTANT_PROMPT = `
You are an AI assistant for an accounting application. You help users manage payees and categories through natural language commands.

Your capabilities include:
1. Creating, reading, updating, and deleting payees
2. Managing category hierarchies
3. Understanding accounting terminology
4. Asking clarifying questions when needed
5. Providing helpful suggestions

Guidelines:
- Always respond in a professional, helpful manner
- When uncertain, ask for clarification rather than making assumptions
- Provide specific, actionable responses
- Use accounting terminology appropriately
- Suggest related actions when helpful

Context: You have access to the user's current payees and categories for reference.
`;
```

#### Intent Classifier

```typescript
const INTENT_CLASSIFIER_PROMPT = `
Classify the user's intent from their message. Return one of these intents:
- CREATE_PAYEE: Creating a new payee/vendor/customer
- READ_PAYEE: Searching, listing, or retrieving payee information
- UPDATE_PAYEE: Modifying existing payee details
- DELETE_PAYEE: Removing a payee
- CREATE_CATEGORY: Creating a new category
- READ_CATEGORY: Searching, listing, or retrieving categories
- UPDATE_CATEGORY: Modifying existing category details
- DELETE_CATEGORY: Removing a category
- CLARIFY: When the intent is unclear or ambiguous
- HELP: Requesting help or information about capabilities

Consider accounting terminology and context. If uncertain, classify as CLARIFY.

Respond with JSON format:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}
`;
```

#### Entity Extractor

```typescript
const ENTITY_EXTRACTOR_PROMPT = `
Extract relevant entities from the user's message for ${intent} operation.

Extract these entity types when present:
- name: Person, company, or category names
- email: Email addresses
- phone: Phone numbers
- address: Physical addresses
- category: Category names or references
- id: Unique identifiers or references to existing records
- tax_id: Tax identification numbers

For each entity, provide:
- type: Entity type from above list
- value: Extracted value
- confidence: 0.0-1.0 confidence score
- context: Surrounding text that helped identify the entity

Respond with JSON format:
{
  "entities": [...],
  "confidence": 0.95,
  "ambiguous": ["list of unclear references"],
  "missing_required": ["list of required fields not found"]
}
`;
```

### 2. Few-Shot Examples

#### Intent Classification Examples

```typescript
const INTENT_EXAMPLES = [
  {
    input: 'Add a new vendor called ABC Corp with email info@abccorp.com',
    output: { intent: 'CREATE_PAYEE', confidence: 0.98 },
  },
  {
    input: 'Show me all office supply categories',
    output: { intent: 'READ_CATEGORY', confidence: 0.95 },
  },
  {
    input: "Update John's email address to john.new@email.com",
    output: { intent: 'UPDATE_PAYEE', confidence: 0.92 },
  },
  {
    input: 'Delete the old marketing category',
    output: { intent: 'DELETE_CATEGORY', confidence: 0.9 },
  },
  {
    input: 'I need to do something with vendors',
    output: { intent: 'CLARIFY', confidence: 0.85 },
  },
];
```

#### Entity Extraction Examples

```typescript
const ENTITY_EXAMPLES = [
  {
    intent: 'CREATE_PAYEE',
    input: 'Add vendor ABC Corp, email: contact@abc.com, phone: 555-0123',
    output: {
      entities: [
        { type: 'name', value: 'ABC Corp', confidence: 0.98 },
        { type: 'email', value: 'contact@abc.com', confidence: 0.99 },
        { type: 'phone', value: '555-0123', confidence: 0.95 },
      ],
    },
  },
];
```

## Natural Language Processing Pipeline

### 1. Preprocessing

```typescript
class MessagePreprocessor {
  static clean(message: string): string {
    return message
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s@.-]/g, '') // Remove special chars except common ones
      .toLowerCase();
  }

  static extractMentions(message: string): string[] {
    // Extract @mentions, #tags, or other special references
    const mentions = message.match(/@\w+/g) || [];
    const tags = message.match(/#\w+/g) || [];
    return [...mentions, ...tags];
  }
}
```

### 2. Intent Classification Implementation

```typescript
class IntentClassifier {
  async classifyIntent(
    message: string,
    context?: any
  ): Promise<IntentClassification> {
    const prompt = this.buildClassificationPrompt(message, context);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: INTENT_CLASSIFIER_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1, // Low temperature for consistent classification
      max_tokens: 200,
    });

    return this.parseClassificationResponse(
      response.choices[0].message.content
    );
  }

  private buildClassificationPrompt(message: string, context?: any): string {
    let prompt = `Message: "${message}"`;

    if (context?.recentPayees?.length) {
      prompt += `\n\nRecent payees: ${context.recentPayees
        .map((p) => p.name)
        .join(', ')}`;
    }

    if (context?.categories?.length) {
      prompt += `\n\nAvailable categories: ${context.categories
        .map((c) => c.name)
        .join(', ')}`;
    }

    return prompt;
  }
}
```

### 3. Entity Extraction Implementation

```typescript
class EntityExtractor {
  async extractEntities(
    message: string,
    intent: Intent
  ): Promise<EntityExtractionResult> {
    const prompt = this.buildExtractionPrompt(message, intent);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: ENTITY_EXTRACTOR_PROMPT.replace('${intent}', intent),
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    return this.parseExtractionResponse(response.choices[0].message.content);
  }

  private buildExtractionPrompt(message: string, intent: Intent): string {
    const requiredFields = this.getRequiredFieldsForIntent(intent);

    return `
Message: "${message}"
Intent: ${intent}
Required fields: ${requiredFields.join(', ')}

Extract all relevant entities for this ${intent} operation.
    `;
  }

  private getRequiredFieldsForIntent(intent: Intent): string[] {
    const requirements = {
      CREATE_PAYEE: ['name'],
      UPDATE_PAYEE: ['name', 'id'],
      DELETE_PAYEE: ['name', 'id'],
      CREATE_CATEGORY: ['name'],
      UPDATE_CATEGORY: ['name', 'id'],
      DELETE_CATEGORY: ['name', 'id'],
    };

    return requirements[intent] || [];
  }
}
```

### 4. Confidence Scoring

```typescript
class ConfidenceScorer {
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
      intentConfidence * 0.6 + avgEntityConfidence * 0.4 + completenessBonus
    );
  }
}
```

## Clarification Handling

### 1. Clarification Detection

```typescript
interface ClarificationNeed {
  type:
    | 'missing_entity'
    | 'ambiguous_reference'
    | 'unclear_intent'
    | 'multiple_matches';
  field: string;
  options?: any[];
  question: string;
}

class ClarificationGenerator {
  generateClarificationQuestions(
    intent: Intent,
    entities: ExtractedEntity[],
    missingFields: string[],
    ambiguousEntities: string[]
  ): ClarificationNeed[] {
    const questions: ClarificationNeed[] = [];

    // Handle missing required fields
    missingFields.forEach((field) => {
      questions.push({
        type: 'missing_entity',
        field,
        question: this.getFieldQuestion(field, intent),
      });
    });

    // Handle ambiguous references
    ambiguousEntities.forEach((entity) => {
      questions.push({
        type: 'ambiguous_reference',
        field: entity,
        question: `I found multiple matches for "${entity}". Which one did you mean?`,
        options: this.findMatches(entity),
      });
    });

    return questions;
  }

  private getFieldQuestion(field: string, intent: Intent): string {
    const questions = {
      name: intent.includes('PAYEE')
        ? "What's the payee's name?"
        : "What's the category name?",
      email: "What's the email address?",
      phone: "What's the phone number?",
      category: 'Which category should this be assigned to?',
      id: 'Which specific record are you referring to?',
    };

    return questions[field] || `Please provide the ${field}.`;
  }
}
```

### 2. Context Preservation

```typescript
interface ConversationContext {
  conversationId: string;
  lastIntent: Intent;
  pendingEntities: ExtractedEntity[];
  clarificationState: ClarificationNeed[];
  userPreferences: UserPreferences;
}

class ContextManager {
  private contexts = new Map<string, ConversationContext>();

  preserveContext(
    conversationId: string,
    context: Partial<ConversationContext>
  ): void {
    const existing = this.contexts.get(conversationId) || { conversationId };
    this.contexts.set(conversationId, { ...existing, ...context });
  }

  getContext(conversationId: string): ConversationContext | null {
    return this.contexts.get(conversationId) || null;
  }
}
```

## Error Handling & Recovery

### 1. AI Service Error Handling

```typescript
class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

class AIErrorHandler {
  async handleError(error: any, context: any): Promise<any> {
    if (error.code === 'rate_limit_exceeded') {
      return this.handleRateLimit(context);
    }

    if (error.code === 'model_unavailable') {
      return this.fallbackToSimpleProcessor(context);
    }

    if (error.code === 'invalid_response') {
      return this.requestClarification(context);
    }

    throw new AIServiceError(
      'AI service temporarily unavailable',
      'service_error',
      true
    );
  }

  private async fallbackToSimpleProcessor(context: any): Promise<any> {
    // Implement rule-based fallback for common operations
    return {
      intent: this.detectIntentByKeywords(context.message),
      entities: this.extractEntitiesByRegex(context.message),
      confidence: 0.5,
      requiresClarification: true,
    };
  }
}
```

### 2. Response Validation

```typescript
class ResponseValidator {
  validateIntentResponse(response: any): boolean {
    const validIntents = [
      'CREATE_PAYEE',
      'READ_PAYEE',
      'UPDATE_PAYEE',
      'DELETE_PAYEE',
      'CREATE_CATEGORY',
      'READ_CATEGORY',
      'UPDATE_CATEGORY',
      'DELETE_CATEGORY',
      'CLARIFY',
      'HELP',
    ];

    return (
      response.intent &&
      validIntents.includes(response.intent) &&
      typeof response.confidence === 'number' &&
      response.confidence >= 0 &&
      response.confidence <= 1
    );
  }

  validateEntityResponse(response: any): boolean {
    return (
      Array.isArray(response.entities) &&
      response.entities.every(
        (entity) =>
          entity.type && entity.value && typeof entity.confidence === 'number'
      )
    );
  }
}
```

## Performance Optimization

### 1. Response Caching

```typescript
class AIResponseCache {
  private cache = new Map<string, any>();
  private maxSize = 1000;
  private ttl = 3600000; // 1 hour

  getCachedResponse(message: string, context: any): any | null {
    const key = this.generateCacheKey(message, context);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.response;
    }

    return null;
  }

  cacheResponse(message: string, context: any, response: any): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const key = this.generateCacheKey(message, context);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }
}
```

### 2. Streaming Responses

```typescript
class StreamingAIProcessor {
  async *processStreamingResponse(message: string): AsyncGenerator<any> {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield { type: 'content', data: content };
      }
    }

    yield { type: 'complete' };
  }
}
```

## Testing & Quality Assurance

### 1. AI Testing Framework

```typescript
interface AITestCase {
  input: string;
  expectedIntent: Intent;
  expectedEntities: ExtractedEntity[];
  minConfidence: number;
  description: string;
}

class AITestRunner {
  async runTestSuite(testCases: AITestCase[]): Promise<TestResults> {
    const results = await Promise.all(
      testCases.map((testCase) => this.runSingleTest(testCase))
    );

    return this.aggregateResults(results);
  }

  private async runSingleTest(testCase: AITestCase): Promise<TestResult> {
    const result = await this.intentClassifier.classifyIntent(testCase.input);

    return {
      passed:
        result.intent === testCase.expectedIntent &&
        result.confidence >= testCase.minConfidence,
      actualIntent: result.intent,
      actualConfidence: result.confidence,
      expectedIntent: testCase.expectedIntent,
      description: testCase.description,
    };
  }
}
```

### 2. Quality Metrics

```typescript
interface QualityMetrics {
  intentAccuracy: number;
  entityExtractionPrecision: number;
  entityExtractionRecall: number;
  averageConfidence: number;
  clarificationRate: number;
  responseTime: number;
}

class QualityMonitor {
  async calculateMetrics(
    conversations: AIConversation[]
  ): Promise<QualityMetrics> {
    return {
      intentAccuracy: this.calculateIntentAccuracy(conversations),
      entityExtractionPrecision: this.calculateEntityPrecision(conversations),
      entityExtractionRecall: this.calculateEntityRecall(conversations),
      averageConfidence: this.calculateAverageConfidence(conversations),
      clarificationRate: this.calculateClarificationRate(conversations),
      responseTime: this.calculateAverageResponseTime(conversations),
    };
  }
}
```
