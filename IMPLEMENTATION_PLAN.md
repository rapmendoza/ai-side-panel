# AI-Powered Side Panel Implementation Plan

## Project Overview

Build a complete AI-powered side panel for an accounting app that handles payee and category management through natural language interactions, including CRUD operations, clarification workflows, and database integration.

## Technology Stack

- **Frontend**: Next.js 14+ with TypeScript
- **UI Components**: Shadcn UI
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI API
- **Styling**: Tailwind CSS (included with Shadcn UI)

## Core Features

### 1. Natural Language Processing

- Process user inputs for payee and category operations
- Parse intent and extract entities from conversational text
- Handle ambiguous requests with clarification workflows

### 2. Payee Management

- Create new payees from natural language descriptions
- Read/search existing payees
- Update payee information
- Delete payees with confirmation

### 3. Category Management

- Create new expense/income categories
- Read/search existing categories
- Update category information
- Delete categories with confirmation

### 4. Clarification System

- Detect vague or incomplete requests
- Generate clarifying questions
- Process follow-up responses to complete operations

## Database Schema

### Supabase Tables

#### `payees` Table

```sql
CREATE TABLE payees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contact_info JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `categories` Table

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('income', 'expense')),
  description TEXT,
  parent_category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `conversation_history` Table

```sql
CREATE TABLE conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  intent VARCHAR(100),
  entities JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Project Structure

```
ai-side-panel/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── chat/route.ts
│   │   │   │   └── process-intent/route.ts
│   │   │   ├── payees/
│   │   │   │   └── route.ts
│   │   │   └── categories/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── side-panel/
│   │   │   ├── SidePanel.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── InputArea.tsx
│   │   ├── payees/
│   │   │   ├── PayeeList.tsx
│   │   │   ├── PayeeForm.tsx
│   │   │   └── PayeeCard.tsx
│   │   └── categories/
│   │       ├── CategoryList.tsx
│   │       ├── CategoryForm.tsx
│   │       └── CategoryTree.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── openai.ts
│   │   ├── intent-processor.ts
│   │   └── utils.ts
│   ├── types/
│   │   ├── payee.ts
│   │   ├── category.ts
│   │   └── conversation.ts
│   └── hooks/
│       ├── usePayees.ts
│       ├── useCategories.ts
│       └── useConversation.ts
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── package.json
└── README.md
```

## Implementation Checklist

### Phase 1: Project Setup & Database (COMPLETED)

- [x] **Initialize Next.js project with TypeScript**: Set up a new Next.js 14+ project.
- [x] **Install and configure Shadcn UI**: Integrate the component library.
- [x] **Set up Supabase project and database schema**: Create tables for `payees`, `categories`, and `conversation_history`.
- [x] **Configure environment variables**: Create a setup guide for environment configuration.
- [x] **Create basic project structure**: Set up directories for components, types, hooks, and API routes.

### Phase 2: Database Layer

- [ ] **Implement Payee Data Access Layer**: Create functions for payee CRUD operations.
- [ ] **Implement Category Data Access Layer**: Create functions for category CRUD operations.
- [ ] **Create Database Utility Functions**: Add helpers for database interactions.

### Phase 3: AI Integration

- [ ] **Set up OpenAI API client**: Configure the client for making API requests.
- [ ] **Create Intent Classification System**: Build the logic to determine user intent.
- [ ] **Implement Entity Extraction**: Extract relevant information from user input.
- [ ] **Build Clarification Logic**: Handle ambiguous requests.
- [ ] **Create Conversation Management**: Manage conversation history and context.

### Phase 4: Side Panel UI

- [ ] **Create Responsive Side Panel Layout**: Design the main side panel container.
- [ ] **Build Chat Interface Components**: Create the chat window and message bubbles.
- [ ] **Implement Message Display System**: Dynamically render conversation messages.
- [ ] **Add Input Area with Send Functionality**: Create the user input field.
- [ ] **Style with Shadcn UI Components**: Apply consistent styling.

### Phase 5: API Endpoints & CRUD Operations

- [ ] **Implement Payee API Endpoints**: Create `GET`, `POST`, `PUT`, and `DELETE` routes for payees.
- [ ] **Implement Category API Endpoints**: Create `GET`, `POST`, `PUT`, and `DELETE` routes for categories.
- [ ] **Add Confirmation Dialogs**: Implement UI for confirming destructive actions.
- [ ] **Create Success/Error Feedback**: Provide visual feedback for operations.
- [ ] **Integrate with AI Processing**: Connect API endpoints to the AI intent processor.

### Phase 6: Natural Language Processing

- [ ] **Create Intent Processing Pipeline**: Connect all NLP components.
- [ ] **Implement Entity Extraction Logic**: Refine entity extraction from text.
- [ ] **Build Clarification Workflows**: Implement multi-turn clarification conversations.
- [ ] **Add Context Awareness**: Maintain context across multiple messages.
- [ ] **Handle Edge Cases and Errors**: Gracefully manage failed NLP operations.

### Phase 7: Integration & Testing

- [ ] **Connect All Components**: Integrate UI, API, and database layers.
- [ ] **Test End-to-End Workflows**: Verify all features work as expected.
- [ ] **Handle Error Scenarios**: Test and refine error handling.
- [ ] **Optimize Performance**: Identify and address performance bottlenecks.
- [ ] **Final Polish and Refinements**: Final UI/UX improvements.

## Key Components Detail

### 1. Intent Processor (`
