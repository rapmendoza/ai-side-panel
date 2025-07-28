export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface IntentProcessingResult {
  intent: string;
  entities: Record<string, string | number | boolean>;
  confidence: number;
  clarificationNeeded: boolean;
  suggestedActions?: SuggestedAction[];
}

export interface ClarificationNeed {
  id: string;
  type: 'multiple_choice' | 'text_input' | 'entity_selection' | 'confirmation';
  question: string;
  options?: string[];
  required: boolean;
}

export interface ClarificationResponse {
  need_id: string;
  response: string;
}

export interface SuggestedAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'payee' | 'category';
  data: Record<string, unknown>;
  description: string;
}

export interface ExecutedOperation {
  id: string;
  type: string;
  entity: string;
  data: Record<string, unknown>;
  success: boolean;
  message: string;
}
