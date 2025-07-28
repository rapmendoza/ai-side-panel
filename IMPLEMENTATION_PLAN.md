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

## Implementation Phases

### Phase 1: Project Setup & Database

1. Initialize Next.js project with TypeScript
2. Install and configure Shadcn UI
3. Set up Supabase project and database schema
4. Configure environment variables
5. Create basic project structure

### Phase 2: Database Layer

1. Create Supabase client configuration
2. Implement payee data access layer
3. Implement category data access layer
4. Create TypeScript types and interfaces
5. Add database utility functions

### Phase 3: AI Integration

1. Set up OpenAI API client
2. Create intent classification system
3. Implement entity extraction
4. Build clarification logic
5. Create conversation management

### Phase 4: Side Panel UI

1. Create responsive side panel layout
2. Build chat interface components
3. Implement message display system
4. Add input area with send functionality
5. Style with Shadcn UI components

### Phase 5: CRUD Operations

1. Implement payee CRUD operations
2. Implement category CRUD operations
3. Add confirmation dialogs
4. Create success/error feedback
5. Integrate with AI processing

### Phase 6: Natural Language Processing

1. Create intent processing pipeline
2. Implement entity extraction logic
3. Build clarification workflows
4. Add context awareness
5. Handle edge cases and errors

### Phase 7: Integration & Testing

1. Connect all components
2. Test end-to-end workflows
3. Handle error scenarios
4. Optimize performance
5. Final polish and refinements

## Key Components Detail

### 1. Intent Processor (`lib/intent-processor.ts`)

```typescript
export interface ProcessedIntent {
  action: 'create' | 'read' | 'update' | 'delete' | 'clarify';
  entity: 'payee' | 'category';
  data: Record<string, any>;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestions?: string[];
}
```

### 2. Chat Interface (`components/side-panel/ChatInterface.tsx`)

- Real-time message display
- Typing indicators
- Message history
- Action buttons for confirmations

### 3. Clarification System

- Detect incomplete information
- Generate contextual questions
- Process follow-up responses
- Maintain conversation context

### 4. CRUD Operations

- **Create**: Extract entity data from natural language
- **Read**: Search and filter with natural language queries
- **Update**: Identify target and modifications from text
- **Delete**: Confirm deletion with safety checks

## API Endpoints

### `/api/ai/chat`

- Process natural language input
- Return AI response and extracted intent
- Handle conversation context

### `/api/ai/process-intent`

- Parse user intent from message
- Extract entities and actions
- Return structured data for operations

### `/api/payees`

- GET: List/search payees
- POST: Create new payee
- PUT: Update existing payee
- DELETE: Remove payee

### `/api/categories`

- GET: List/search categories
- POST: Create new category
- PUT: Update existing category
- DELETE: Remove category

## Natural Language Examples

### Payee Operations

- "Add a new payee called ABC Corp"
- "Update John's contact info to john@example.com"
- "Delete the payee XYZ Company"
- "Show me all payees with 'tech' in the name"

### Category Operations

- "Create an expense category for office supplies"
- "Add a subcategory under Marketing called Social Media"
- "Update the Utilities category description"
- "Remove the Travel category"

### Clarification Scenarios

- User: "Add a new payee"
- AI: "I'd be happy to help you add a new payee. What's the name of the payee you'd like to add?"

## Error Handling

1. **API Errors**: Graceful handling of OpenAI and Supabase errors
2. **Validation**: Input validation for all CRUD operations
3. **Clarification**: When intent is unclear or incomplete
4. **Confirmation**: For destructive operations like deletions
5. **Fallback**: Manual form input when AI processing fails

## Security Considerations

1. Input sanitization for all user inputs
2. Proper error handling without exposing sensitive data
3. Rate limiting for AI API calls
4. Supabase RLS (Row Level Security) policies
5. Environment variable protection

## Performance Optimizations

1. Implement caching for frequent queries
2. Debounce user input processing
3. Optimize AI API calls
4. Use React Query for data fetching
5. Implement pagination for large lists

## Success Metrics

1. Successful intent recognition rate (>90%)
2. User query completion rate
3. Average clarification rounds needed
4. Response time for AI processing
5. User satisfaction with natural language interactions

## Future Enhancements (Out of Scope)

- Multi-language support
- Voice input/output
- Advanced analytics
- Bulk operations
- Integration with external accounting systems
