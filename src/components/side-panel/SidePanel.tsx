'use client';

import { Card } from '@/components/ui/card';
import { ChatMessage } from '@/types/conversation';
import { MessageCircle, X } from 'lucide-react';
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
      <div className="fixed right-6 bottom-6 z-50">
        <button
          onClick={onToggle}
          className="bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-110"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[800px] max-w-[90vw] z-50 transform transition-transform duration-300 ease-in-out">
      <Card className="h-full flex flex-col border-0 rounded-none bg-background/95 backdrop-blur-sm shadow-2xl border-l">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">AI Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Payee & Category Management
              </p>
            </div>
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close AI Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Chat Interface */}
        <div className="flex-1 min-h-0">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
          <div className="text-xs text-muted-foreground text-center">
            AI-powered accounting assistant • Type your requests in natural
            language
          </div>
        </div>
      </Card>
    </div>
  );
}
