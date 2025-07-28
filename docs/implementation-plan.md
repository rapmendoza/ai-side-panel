# AI-Powered Side Panel Implementation Plan

## Project Overview

Build a complete AI-powered side panel for an accounting app that enables natural language management of payees and categories with full CRUD operations, intelligent clarification handling, and seamless database integration.

## Tech Stack

- **Frontend**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Shadcn UI
- **AI Integration**: OpenAI API (GPT-4)
- **State Management**: Zustand or React Query
- **Styling**: Tailwind CSS

## Database Schema Design

### Core Tables

#### 1. Payees Table

```sql
CREATE TABLE payees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(50),
  category_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL -- For multi-tenant support
);
```

#### 2. Categories Table

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  color VARCHAR(7), -- Hex color code
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL
);
```

#### 3. AI Conversations Table

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  intent VARCHAR(100), -- create, read, update, delete, clarify
  entity_type VARCHAR(50), -- payee, category
  entity_id UUID, -- References payee or category if applicable
  confidence_score FLOAT,
  requires_clarification BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL
);
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── chat/route.ts
│   │   │   ├── intent/route.ts
│   │   │   └── clarify/route.ts
│   │   ├── payees/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── categories/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   └── dashboard/
│       └── page.tsx
├── components/
│   ├── ui/ (Shadcn components)
│   ├── ai-panel/
│   │   ├── AISidePanel.tsx
│   │   ├── ChatInterface.tsx
│   │   ├── IntentProcessor.tsx
│   │   └── ClarificationDialog.tsx
│   ├── payees/
│   │   ├── PayeeList.tsx
│   │   ├── PayeeForm.tsx
│   │   └── PayeeCard.tsx
│   └── categories/
│       ├── CategoryTree.tsx
│       ├── CategoryForm.tsx
│       └── CategoryCard.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── payees.ts
│   │   └── categories.ts
│   ├── ai/
│   │   ├── openai.ts
│   │   ├── intent-classifier.ts
│   │   ├── entity-extractor.ts
│   │   └── response-generator.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   └── formatting.ts
│   └── types/
│       ├── payee.ts
│       ├── category.ts
│       └── ai.ts
├── hooks/
│   ├── usePayees.ts
│   ├── useCategories.ts
│   └── useAIChat.ts
└── store/
    ├── payee-store.ts
    ├── category-store.ts
    └── ai-store.ts
```

## Core Components Implementation

### 1. AI Side Panel Component (`AISidePanel.tsx`)

**Key Features:**

- Collapsible/expandable panel
- Chat interface with message history
- Loading states and error handling
- Integration with main app context

**Props Interface:**

```typescript
interface AISidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onEntityCreated?: (type: 'payee' | 'category', entity: any) => void;
  onEntityUpdated?: (type: 'payee' | 'category', entity: any) => void;
}
```

### 2. Chat Interface Component (`ChatInterface.tsx`)

**Features:**

- Message input with auto-resize
- Message history display
- Typing indicators
- Quick action buttons
- Voice input support (future enhancement)

### 3. Intent Processor Component (`IntentProcessor.tsx`)

**Responsibilities:**

- Parse user input for intent classification
- Extract entities and parameters
- Handle ambiguous requests
- Trigger appropriate CRUD operations

### 4. Clarification Dialog Component (`ClarificationDialog.tsx`)

**Features:**

- Modal dialog for ambiguous requests
- Multiple choice options
- Form inputs for missing data
- Context preservation

## AI Integration Architecture

### 1. Intent Classification System

**Intent Types:**

- `CREATE_PAYEE`: Create new payee
- `READ_PAYEE`: Search/retrieve payees
- `UPDATE_PAYEE`: Modify existing payee
- `DELETE_PAYEE`: Remove payee
- `CREATE_CATEGORY`: Create new category
- `READ_CATEGORY`: Search/retrieve categories
- `UPDATE_CATEGORY`: Modify existing category
- `DELETE_CATEGORY`: Remove category
- `CLARIFY`: Request clarification
- `HELP`: Show help information

**Implementation:**

```typescript
interface IntentClassification {
  intent: Intent;
  confidence: number;
  entities: ExtractedEntity[];
  requiresClarification: boolean;
  clarificationQuestions: string[];
}
```

### 2. Entity Extraction

**Extracted Data Types:**

- Names and identifiers
- Contact information
- Financial details
- Category hierarchies
- Relationships between entities

### 3. Natural Language Processing Pipeline

**Steps:**

1. Input sanitization and preprocessing
2. Intent classification using OpenAI
3. Entity extraction and validation
4. Confidence scoring
5. Clarification generation if needed
6. Database operation execution
7. Response generation

## API Routes Design

### 1. AI Chat Endpoint (`/api/ai/chat`)

**Request:**

```typescript
interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    currentPayees?: Payee[];
    currentCategories?: Category[];
  };
}
```

**Response:**

```typescript
interface ChatResponse {
  response: string;
  intent: Intent;
  entities: ExtractedEntity[];
  requiresClarification: boolean;
  clarificationQuestions?: string[];
  suggestedActions?: Action[];
  executedOperations?: Operation[];
}
```

### 2. Payee Management Endpoints

- `GET /api/payees` - List payees with filtering
- `POST /api/payees` - Create new payee
- `PUT /api/payees/[id]` - Update payee
- `DELETE /api/payees/[id]` - Delete payee

### 3. Category Management Endpoints

- `GET /api/categories` - List categories with hierarchy
- `POST /api/categories` - Create new category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

## Prompt Engineering Strategy

### 1. System Prompts

**Main AI Assistant:**

```
You are an AI assistant for an accounting application. You help users manage payees and categories through natural language commands. Your capabilities include:

1. Creating, reading, updating, and deleting payees
2. Managing category hierarchies
3. Understanding accounting terminology
4. Asking clarifying questions when needed
5. Providing helpful suggestions

Always respond in a professional, helpful manner. When uncertain, ask for clarification rather than making assumptions.
```

**Intent Classifier:**

```
Classify the user's intent from the following message. Return one of: CREATE_PAYEE, READ_PAYEE, UPDATE_PAYEE, DELETE_PAYEE, CREATE_CATEGORY, READ_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY, CLARIFY, HELP

Consider context and accounting terminology. If the intent is unclear, return CLARIFY.
```

### 2. Few-Shot Examples

Include examples for each intent type to improve classification accuracy:

```
Examples:
- "Add a new vendor called ABC Corp" → CREATE_PAYEE
- "Show me all office supply categories" → READ_CATEGORY
- "Update John's email address" → UPDATE_PAYEE
- "Delete the old marketing category" → DELETE_CATEGORY
```

## State Management

### 1. AI Store (`ai-store.ts`)

```typescript
interface AIStore {
  messages: Message[];
  isLoading: boolean;
  currentIntent: Intent | null;
  pendingClarification: Clarification | null;

  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;
  handleClarification: (response: any) => Promise<void>;
}
```

### 2. Entity Stores

Separate Zustand stores for payees and categories with optimistic updates and cache management.

## Error Handling Strategy

### 1. AI Service Errors

- OpenAI API failures
- Rate limiting
- Invalid responses
- Network timeouts

### 2. Database Errors

- Connection failures
- Constraint violations
- Transaction rollbacks
- Data validation errors

### 3. User Input Errors

- Malformed requests
- Missing required data
- Invalid entity references
- Permission issues

## Security Considerations

### 1. Input Validation

- Sanitize all user inputs
- Validate entity data before database operations
- Rate limiting on AI requests
- SQL injection prevention

### 2. Authentication & Authorization

- User session validation
- Row-level security in Supabase
- API route protection
- Entity ownership verification

### 3. AI Safety

- Content filtering
- Prompt injection protection
- Response validation
- Audit logging

## Testing Strategy

### 1. Unit Tests

- AI utility functions
- Database operations
- Entity validation
- State management

### 2. Integration Tests

- API routes
- Database transactions
- AI service integration
- End-to-end workflows

### 3. AI Testing

- Intent classification accuracy
- Entity extraction precision
- Response quality assessment
- Edge case handling

## Performance Optimization

### 1. Database Optimization

- Proper indexing strategy
- Query optimization
- Connection pooling
- Caching frequently accessed data

### 2. AI Response Optimization

- Streaming responses
- Response caching for common queries
- Batch operations
- Request debouncing

### 3. UI Performance

- Virtual scrolling for large lists
- Optimistic updates
- Component memoization
- Lazy loading

## Deployment Considerations

### 1. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
DATABASE_URL=
```

### 2. Database Migration Strategy

- Version-controlled schema changes
- Seed data for testing
- Backup and recovery procedures
- Performance monitoring

### 3. Monitoring & Analytics

- AI request tracking
- Error logging
- Performance metrics
- User interaction analytics

## Future Enhancements

### 1. Advanced AI Features

- Voice input/output
- Multi-language support
- Learning from user preferences
- Predictive suggestions

### 2. Integration Capabilities

- Import/export functionality
- Third-party accounting software integration
- API webhooks
- Bulk operations

### 3. Mobile Optimization

- Responsive design improvements
- Touch gesture support
- Offline capability
- Push notifications

## Development Timeline

### Phase 1: Foundation (2-3 weeks)

- Database schema setup
- Basic Next.js app structure
- Supabase integration
- Core UI components with Shadcn

### Phase 2: AI Integration (2-3 weeks)

- OpenAI API integration
- Intent classification system
- Basic chat interface
- Entity extraction logic

### Phase 3: CRUD Operations (2 weeks)

- Payee management
- Category management
- Database operations
- Form validations

### Phase 4: Advanced Features (2 weeks)

- Clarification handling
- Error management
- Performance optimization
- Testing implementation

### Phase 5: Polish & Deploy (1 week)

- UI/UX refinements
- Security hardening
- Documentation
- Production deployment

## Success Metrics

### 1. Technical Metrics

- AI intent classification accuracy (>90%)
- Response time (<2 seconds)
- Database query performance
- Error rates (<1%)

### 2. User Experience Metrics

- Task completion rate
- User satisfaction scores
- Feature adoption rates
- Support ticket reduction

### 3. Business Metrics

- Time saved per user
- Accuracy of data entry
- User engagement with AI features
- Overall productivity improvements

---
