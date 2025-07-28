import { ChatMessage } from '@/lib/types/ai';
import { create } from 'zustand';

interface Conversation {
  id: string;
  messages: ChatMessage[];
  lastActivity: Date;
  title?: string;
}

interface AIState {
  // Conversation state
  conversations: Conversation[];
  currentConversationId: string | null;

  // UI state
  isProcessing: boolean;
  isLoading: boolean;
  error: string | null;

  // Current input state
  inputMessage: string;
  pendingClarification: any | null;

  // Actions
  setInputMessage: (message: string) => void;

  // Conversation management
  createConversation: () => string;
  setCurrentConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;

  // Message handling
  addMessage: (
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => void;

  // AI processing
  sendMessage: (message: string, conversationId?: string) => Promise<any>;
  handleClarification: (
    responses: any[],
    originalMessage: string
  ) => Promise<any>;
  confirmAction: (actionId: string) => Promise<any>;

  // State management
  setProcessing: (processing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPendingClarification: (clarification: any | null) => void;

  // Utility
  getCurrentConversation: () => Conversation | null;
  getConversationTitle: (conversationId: string) => string;
}

const generateId = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

export const useAIStore = create<AIState>((set, get) => ({
  // Initial state
  conversations: [],
  currentConversationId: null,
  isProcessing: false,
  isLoading: false,
  error: null,
  inputMessage: '',
  pendingClarification: null,

  // Input management
  setInputMessage: (message: string) => {
    set({ inputMessage: message });
  },

  // Conversation management
  createConversation: () => {
    const id = generateId();
    const newConversation: Conversation = {
      id,
      messages: [],
      lastActivity: new Date(),
      title: `Conversation ${new Date().toLocaleTimeString()}`,
    };

    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: id,
    }));

    return id;
  },

  setCurrentConversation: (id: string) => {
    set({ currentConversationId: id });
  },

  deleteConversation: (id: string) => {
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
      currentConversationId:
        state.currentConversationId === id ? null : state.currentConversationId,
    }));
  },

  clearAllConversations: () => {
    set({
      conversations: [],
      currentConversationId: null,
      pendingClarification: null,
    });
  },

  // Message handling
  addMessage: (
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };

    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastActivity: new Date(),
            }
          : conv
      ),
    }));
  },

  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              ),
              lastActivity: new Date(),
            }
          : conv
      ),
    }));
  },

  // AI processing methods
  sendMessage: async (message: string, conversationId?: string) => {
    try {
      set({ isProcessing: true, error: null, inputMessage: '' });

      // Use provided conversationId or current one, or create new
      let targetConversationId = conversationId || get().currentConversationId;
      if (!targetConversationId) {
        targetConversationId = get().createConversation();
      }

      // Add user message immediately
      get().addMessage(targetConversationId, {
        content: message,
        role: 'user',
        metadata: { timestamp: new Date().toISOString() },
      });

      // Send to AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId: targetConversationId,
          context: {
            conversationHistory:
              get().getCurrentConversation()?.messages.slice(-5) || [],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.type === 'clarification') {
        // Handle clarification needed
        set({ pendingClarification: result });

        get().addMessage(targetConversationId, {
          content: result.message,
          role: 'assistant',
          metadata: {
            type: 'clarification',
            classification: result.classification,
            extraction: result.extraction,
          },
        });
      } else {
        // Handle normal response
        get().addMessage(targetConversationId, {
          content: result.message,
          role: 'assistant',
          metadata: {
            type: 'response',
            classification: result.classification,
            suggestedActions: result.suggestedActions,
            executedActions: result.executedActions,
            confidence: result.confidence,
          },
        });

        set({ pendingClarification: null });
      }

      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      set({ error: errorMessage });

      // Add error message to conversation
      const currentId = get().currentConversationId;
      if (currentId) {
        get().addMessage(currentId, {
          content: `Sorry, I encountered an error: ${errorMessage}`,
          role: 'assistant',
          metadata: { type: 'error', error: errorMessage },
        });
      }

      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },

  handleClarification: async (responses: any[], originalMessage: string) => {
    try {
      set({ isProcessing: true, error: null });

      const currentConversationId = get().currentConversationId;
      if (!currentConversationId) {
        throw new Error('No active conversation');
      }

      const response = await fetch('/api/ai/clarify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalMessage,
          clarificationResponses: responses,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.type === 'clarification') {
        // Still need more clarification
        get().addMessage(currentConversationId, {
          content: result.message,
          role: 'assistant',
          metadata: {
            type: 'clarification',
            stillNeedsClarification: true,
            missingFields: result.missingFields,
          },
        });
      } else {
        // Final response
        get().addMessage(currentConversationId, {
          content: result.message,
          role: 'assistant',
          metadata: {
            type: 'response',
            suggestedActions: result.suggestedActions,
            executedActions: result.executedActions,
            confidence: result.confidence,
          },
        });

        set({ pendingClarification: null });
      }

      return result;
    } catch (error) {
      console.error('Error handling clarification:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },

  confirmAction: async (actionId: string) => {
    try {
      set({ isProcessing: true, error: null });

      const response = await fetch('/api/ai/clarify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionId,
          confirmAction: true,
          originalMessage: '', // Not needed for confirmation
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const currentId = get().currentConversationId;
      if (currentId) {
        get().addMessage(currentId, {
          content: result.message,
          role: 'assistant',
          metadata: { type: 'confirmation', actionId, confirmed: true },
        });
      }

      return result;
    } catch (error) {
      console.error('Error confirming action:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },

  // State management
  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setPendingClarification: (clarification: any | null) => {
    set({ pendingClarification: clarification });
  },

  // Utility methods
  getCurrentConversation: () => {
    const state = get();
    return (
      state.conversations.find(
        (conv) => conv.id === state.currentConversationId
      ) || null
    );
  },

  getConversationTitle: (conversationId: string) => {
    const conversation = get().conversations.find(
      (conv) => conv.id === conversationId
    );
    return conversation?.title || 'Conversation';
  },
}));
