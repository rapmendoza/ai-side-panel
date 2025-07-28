'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyboardEvent, useState } from 'react';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
}

export function InputArea({ onSendMessage }: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const messageToSend = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      await onSendMessage(messageToSend);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ask me about payees or categories..."
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim() || isLoading}
        size="sm"
        className="px-3"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        )}
      </Button>
    </div>
  );
}
