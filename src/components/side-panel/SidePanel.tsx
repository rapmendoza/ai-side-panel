'use client';

import { Card } from '@/components/ui/card';
import { ChatMessage } from '@/types/conversation';
import { useState } from 'react';
import { ChatInterface } from './ChatInterface';

interface SidePanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function SidePanel({ isOpen = true, onToggle }: SidePanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content:
        "Hello! I'm here to help you manage payees and categories. What would you like to do?",
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      content: 'Thinking...',
      role: 'assistant',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Send to AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const result = await response.json();

      // Remove loading message and add AI response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isTyping);
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          content:
            result.response || 'I apologize, but I encountered an error.',
          role: 'assistant',
          timestamp: new Date(),
        };
        return [...filtered, aiMessage];
      });
    } catch (error) {
      console.error('Error sending message:', error);

      // Remove loading message and add error message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isTyping);
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          content: 'I apologize, but I encountered an error. Please try again.',
          role: 'assistant',
          timestamp: new Date(),
        };
        return [...filtered, errorMessage];
      });
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <button
          onClick={onToggle}
          className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Open AI Assistant"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 z-40 bg-background border-l shadow-lg">
      <Card className="h-full flex flex-col border-0 rounded-none">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Close AI Assistant"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <ChatInterface messages={messages} onSendMessage={handleSendMessage} />
      </Card>
    </div>
  );
}
