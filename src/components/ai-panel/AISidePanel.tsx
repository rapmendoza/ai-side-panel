'use client';

import { Button } from '@/components/ui/button';
import { useAIStore } from '@/store/ai-store';
import { Maximize2, MessageSquare, Minimize2, Settings, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import ChatInterface from './ChatInterface';

interface AISidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onEntityCreated?: (type: 'payee' | 'category', entity: any) => void;
  onEntityUpdated?: (type: 'payee' | 'category', entity: any) => void;
  onEntityDeleted?: (type: 'payee' | 'category', id: string) => void;
  className?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export default function AISidePanel({
  isOpen,
  onToggle,
  onEntityCreated,
  onEntityUpdated,
  onEntityDeleted,
  className = '',
  defaultWidth = 400,
  minWidth = 300,
  maxWidth = 800,
}: AISidePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    currentConversationId,
    createConversation,
    setCurrentConversation,
    deleteConversation,
  } = useAIStore();

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      setWidth(Math.min(800, window.innerWidth * 0.7));
    } else {
      setWidth(defaultWidth);
    }
  };

  const handleOperationComplete = (operations: any[]) => {
    // Notify parent component about completed operations
    operations.forEach((op) => {
      if (op.result.success) {
        switch (op.type) {
          case 'create':
            onEntityCreated?.(op.entity, op.result.data);
            break;
          case 'update':
            onEntityUpdated?.(op.entity, op.result.data);
            break;
          case 'delete':
            onEntityDeleted?.(op.entity, op.result.data?.id || op.actionId);
            break;
        }
      }
    });
  };

  const handleNewConversation = () => {
    const newId = createConversation();
    setCurrentConversation(newId);
  };

  if (!isOpen) {
    return (
      <div className={`fixed right-0 top-0 h-full z-50 ${className}`}>
        <Button
          onClick={onToggle}
          className="mt-4 mr-4 rounded-l-lg rounded-r-none shadow-lg"
          size="sm"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`fixed right-0 top-0 h-full bg-white border-l shadow-lg z-50 flex ${className}`}
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        ref={resizeRef}
        className="w-1 bg-gray-200 hover:bg-gray-300 cursor-ew-resize transition-colors"
        onMouseDown={handleResizeStart}
      />

      {/* Main panel content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-800">AI Assistant</h2>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMaximize}
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              title="Close AI Panel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Conversation list (when there are multiple conversations) */}
        {conversations.length > 1 && (
          <div className="border-b bg-gray-50 p-2 max-h-32 overflow-y-auto">
            <div className="text-xs text-gray-600 mb-2">
              Recent Conversations
            </div>
            <div className="space-y-1">
              {conversations.slice(0, 5).map((conv) => (
                <Button
                  key={conv.id}
                  variant={
                    conv.id === currentConversationId ? 'default' : 'ghost'
                  }
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => setCurrentConversation(conv.id)}
                >
                  <div className="truncate">
                    {conv.title ||
                      `Chat ${conv.lastActivity.toLocaleTimeString()}`}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Chat interface */}
        <div className="flex-1 min-h-0">
          <ChatInterface
            conversationId={currentConversationId || undefined}
            onNewConversation={handleNewConversation}
            onOperationComplete={handleOperationComplete}
            maxHeight={isMaximized ? 600 : 400}
          />
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>AI-powered assistant</span>
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export as named export as well for consistency
export { AISidePanel };
