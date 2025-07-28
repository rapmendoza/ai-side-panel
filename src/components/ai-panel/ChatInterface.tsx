'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAIStore } from '@/store/ai-store';
import { AlertCircle, CheckCircle, Loader2, Send, XCircle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ChatInterfaceProps {
  conversationId?: string;
  onNewConversation?: () => void;
  onMessageSent?: (message: string) => void;
  onOperationComplete?: (operation: any) => void;
  initialMessage?: string;
  placeholder?: string;
  maxHeight?: number;
}

export default function ChatInterface({
  conversationId,
  onNewConversation,
  onMessageSent,
  onOperationComplete,
  initialMessage = '',
  placeholder = 'Ask me about payees and categories...',
  maxHeight = 400,
}: ChatInterfaceProps) {
  const {
    inputMessage,
    setInputMessage,
    isProcessing,
    error,
    pendingClarification,
    getCurrentConversation,
    sendMessage,
    handleClarification,
    confirmAction,
    createConversation,
    setCurrentConversation,
  } = useAIStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localInput, setLocalInput] = useState(initialMessage);

  const currentConversation = getCurrentConversation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Set conversation if provided
  useEffect(() => {
    if (conversationId) {
      setCurrentConversation(conversationId);
    }
  }, [conversationId, setCurrentConversation]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    const message = localInput.trim();
    if (!message || isProcessing) return;

    try {
      setLocalInput('');
      onMessageSent?.(message);

      const result = await sendMessage(message, conversationId);

      if (result.executedActions?.length > 0) {
        onOperationComplete?.(result.executedActions);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    const newId = createConversation();
    onNewConversation?.();
    setLocalInput('');
    inputRef.current?.focus();
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message: any) => {
    const isUser = message.role === 'user';
    const isError = message.metadata?.type === 'error';
    const isConfirmation = message.metadata?.type === 'confirmation';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : isError
              ? 'bg-red-50 text-red-800 border border-red-200'
              : isConfirmation
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-gray-50 text-gray-800 border border-gray-200'
          }`}
        >
          <div className="text-sm">{message.content}</div>

          {/* Show confidence score for AI responses */}
          {!isUser && message.metadata?.confidence && (
            <div className="text-xs mt-1 opacity-70">
              Confidence: {Math.round(message.metadata.confidence * 100)}%
            </div>
          )}

          {/* Show executed actions */}
          {message.metadata?.executedActions?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-1">
                Actions performed:
              </div>
              {message.metadata.executedActions.map(
                (action: any, index: number) => (
                  <div key={index} className="flex items-center text-xs">
                    {action.result.success ? (
                      <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <span>
                      {action.type} {action.entity}:{' '}
                      {action.result.success ? 'Success' : action.result.error}
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Show suggested actions that need confirmation */}
          {message.metadata?.suggestedActions?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-2">
                Suggested actions:
              </div>
              {message.metadata.suggestedActions.map((action: any) => (
                <Button
                  key={action.id}
                  size="sm"
                  variant="outline"
                  className="mr-2 mb-1 text-xs"
                  onClick={() => confirmAction(action.id)}
                  disabled={isProcessing}
                >
                  {action.description}
                </Button>
              ))}
            </div>
          )}

          <div className="text-xs mt-1 opacity-50">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">AI Assistant</h3>
        <Button variant="outline" size="sm" onClick={handleNewConversation}>
          New Chat
        </Button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {currentConversation?.messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation by asking about payees or categories.</p>
            <p className="text-sm mt-2">
              Try: "Add vendor ABC Corp" or "Show all suppliers"
            </p>
          </div>
        ) : (
          currentConversation?.messages.map(renderMessage)
        )}

        {/* Loading indicator */}
        {isProcessing && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2">
          <Card className="p-3 bg-red-50 border-red-200">
            <div className="flex items-center text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          </Card>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!localInput.trim() || isProcessing}
            size="sm"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Pending clarification indicator */}
        {pendingClarification && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-200">
            Waiting for clarification...
          </div>
        )}
      </div>
    </div>
  );
}
