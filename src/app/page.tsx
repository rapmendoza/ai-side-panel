'use client';

import { SidePanel } from '@/components/side-panel/SidePanel';
import { useState } from 'react';

export default function Home() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Main Content - no longer shifts when panel opens */}
      <div className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              AI-Powered Accounting Assistant
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Manage your payees and categories through natural language
              conversations
            </p>

            {!isPanelOpen && (
              <button
                onClick={() => setIsPanelOpen(true)}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Open AI Assistant
              </button>
            )}
          </header>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Payee Management</h2>
              <p className="text-muted-foreground mb-4">
                Create, search, update, and delete payees using natural language
                commands.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>
                  • &ldquo;Add a new payee called John&apos;s Coffee Shop&rdquo;
                </li>
                <li>
                  • &ldquo;Show me all payees with &lsquo;bank&rsquo; in the
                  name&rdquo;
                </li>
                <li>• &ldquo;Update the description for payee XYZ&rdquo;</li>
                <li>• &ldquo;Delete the payee called ABC Corp&rdquo;</li>
              </ul>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">
                Category Management
              </h2>
              <p className="text-muted-foreground mb-4">
                Organize your income and expense categories with AI assistance.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>
                  • &ldquo;Create an expense category for office supplies&rdquo;
                </li>
                <li>• &ldquo;Show me all income categories&rdquo;</li>
                <li>• &ldquo;Make a subcategory under Marketing&rdquo;</li>
                <li>• &ldquo;List all categories in a tree structure&rdquo;</li>
              </ul>
            </div>
          </div>

          <div className="bg-muted/50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium mb-2">
                  Natural Language Processing
                </h3>
                <p className="text-sm text-muted-foreground">
                  Communicate in plain English - the AI understands your intent
                  and executes the appropriate actions.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Smart Clarification</h3>
                <p className="text-sm text-muted-foreground">
                  When requests are ambiguous, the AI asks clarifying questions
                  to ensure accuracy.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Real-time Operations</h3>
                <p className="text-sm text-muted-foreground">
                  All changes are immediately reflected in your database with
                  proper validation and error handling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay backdrop when panel is open */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      {/* Side Panel - now overlays on top */}
      <SidePanel
        isOpen={isPanelOpen}
        onToggle={() => setIsPanelOpen(!isPanelOpen)}
      />
    </div>
  );
}
