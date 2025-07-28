export interface ConversationMessage {
  id: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  intent?: string;
  entities?: Record<string, unknown>;
  created_at: string;
}

export interface ProcessedIntent {
  action: 'create' | 'read' | 'update' | 'delete' | 'clarify';
  entity: 'payee' | 'category';
  data: Record<string, unknown>;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestions?: string[];
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

export interface ClarificationContext {
  originalIntent: ProcessedIntent;
  clarificationStep: number;
  collectedData: Record<string, unknown>;
  pendingQuestions: string[];
}
