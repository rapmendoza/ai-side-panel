'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/conversation';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isTyping = message.isTyping;

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback
          className={cn(
            'text-xs font-medium',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {isUser ? 'U' : 'AI'}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            'px-3 py-2 rounded-lg text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
            isTyping && 'animate-pulse'
          )}
        >
          {isTyping ? (
            <div className="flex gap-1">
              <div
                className="w-2 h-2 bg-current rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2 h-2 bg-current rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2 h-2 bg-current rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {!isTyping && (
          <div className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
