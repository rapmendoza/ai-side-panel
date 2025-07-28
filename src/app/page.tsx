'use client';

import { AISidePanel } from '@/components/ai-panel';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckCircle,
  FolderTree,
  MessageSquare,
  Sparkles,
  Users,
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  const handleEntityCreated = (type: 'payee' | 'category', entity: any) => {
    console.log(`New ${type} created:`, entity);
    // Here you could refresh your entity lists or show notifications
  };

  const handleEntityUpdated = (type: 'payee' | 'category', entity: any) => {
    console.log(`${type} updated:`, entity);
    // Here you could refresh your entity lists or show notifications
  };

  const handleEntityDeleted = (type: 'payee' | 'category', id: string) => {
    console.log(`${type} deleted:`, id);
    // Here you could refresh your entity lists or show notifications
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              AI-Powered Accounting App
            </h1>
            <p className="text-sm text-gray-600">
              Manage payees and categories with natural language
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Phase 2 Complete
            </div>

            <Button
              onClick={() => setIsAIPanelOpen(true)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Open AI Assistant
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">AI Assistant Ready!</h2>
                <p className="text-blue-100">
                  Ask me to manage payees and categories using natural language
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Create</h3>
                <p className="text-sm text-blue-100">"Add vendor ABC Corp"</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Update</h3>
                <p className="text-sm text-blue-100">
                  "Change John's email to john@example.com"
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Search</h3>
                <p className="text-sm text-blue-100">
                  "Show all suppliers in tech category"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Payee Management
              </CardTitle>
              <CardDescription>
                Manage vendors, suppliers, and other payees with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Natural language creation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Smart data extraction
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Bulk operations
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-green-600" />
                Category Hierarchy
              </CardTitle>
              <CardDescription>
                Organize with intelligent category management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Hierarchical structure
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Smart categorization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Drag & drop organization
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                AI Chat Interface
              </CardTitle>
              <CardDescription>
                Conversational interface with clarification handling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Intent classification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Entity extraction
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Confidence scoring
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Phase 2 Implementation Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Phase 2: AI Integration - Completed ✅</CardTitle>
            <CardDescription>
              All core AI features have been implemented and are ready for use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-green-700">
                  ✅ Week 4: OpenAI Integration
                </h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    OpenAI API integration with error handling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Intent classification system (&gt;85% accuracy target)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Entity extraction logic (&gt;80% precision target)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Confidence scoring mechanism
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Basic prompt engineering
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-green-700">
                  ✅ Week 5-6: Chat Interface & Processing
                </h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Complete chat interface component
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Message history and conversation context
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Clarification dialog system
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Loading states and error feedback
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    AI-driven CRUD operations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Conversation persistence
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Ready to Test?</CardTitle>
            <CardDescription>
              Click "Open AI Assistant" to start using the AI-powered interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">
                  Try these example commands:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <code className="text-sm">"Add vendor Microsoft Corp"</code>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <code className="text-sm">
                      "Create category Office Supplies"
                    </code>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <code className="text-sm">"Show all tech vendors"</code>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <code className="text-sm">
                      "Update John's email address"
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center pt-4">
                <Button
                  onClick={() => setIsAIPanelOpen(true)}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Open AI Assistant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* AI Side Panel */}
      <AISidePanel
        isOpen={isAIPanelOpen}
        onToggle={() => setIsAIPanelOpen(!isAIPanelOpen)}
        onEntityCreated={handleEntityCreated}
        onEntityUpdated={handleEntityUpdated}
        onEntityDeleted={handleEntityDeleted}
        defaultWidth={450}
        minWidth={350}
        maxWidth={800}
      />
    </div>
  );
}
