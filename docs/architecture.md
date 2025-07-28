# Architecture & Project Structure

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

## Architectural Principles

### 1. Separation of Concerns

- **API Layer**: Handle HTTP requests and responses
- **Service Layer**: Business logic and data processing
- **UI Layer**: React components and user interactions
- **State Layer**: Global state management and caching

### 2. Modular Design

- Self-contained feature modules
- Reusable UI components
- Pluggable AI processing pipeline
- Independent data stores

### 3. Type Safety

- Comprehensive TypeScript definitions
- Strict type checking
- Interface-driven development
- Runtime validation where needed

## Layer Responsibilities

### API Layer (`/app/api/`)

**Purpose**: Handle HTTP requests, validate inputs, and coordinate between frontend and backend services.

**Structure**:

- `ai/` - AI processing endpoints
- `payees/` - Payee CRUD operations
- `categories/` - Category management

**Key Features**:

- Request validation
- Error handling
- Rate limiting
- Response formatting

### Component Layer (`/components/`)

**Purpose**: Reusable UI components with clear prop interfaces and single responsibilities.

**Organization**:

- `ui/` - Base Shadcn components
- `ai-panel/` - AI-specific interface components
- `payees/` - Payee management components
- `categories/` - Category management components

**Design Patterns**:

- Composition over inheritance
- Props-based configuration
- Event-driven communication
- Accessibility-first design

### Service Layer (`/lib/`)

**Purpose**: Business logic, data access, and external service integration.

**Modules**:

- `supabase/` - Database operations and queries
- `ai/` - OpenAI integration and NLP processing
- `utils/` - Shared utility functions
- `types/` - TypeScript type definitions

**Principles**:

- Single responsibility per module
- Dependency injection ready
- Error boundary handling
- Testable pure functions

### State Layer (`/store/` & `/hooks/`)

**Purpose**: Global state management and data synchronization.

**Approach**:

- Zustand for simple state management
- React Query for server state
- Custom hooks for component logic
- Optimistic updates for better UX

## Data Flow Architecture

### 1. User Input Flow

```
User Input → ChatInterface → AI Processing → Intent Classification → Entity Extraction → Database Operation → UI Update
```

### 2. AI Processing Pipeline

```
Raw Message → Preprocessing → Intent Classification → Entity Extraction → Confidence Scoring → Clarification Check → Response Generation
```

### 3. State Management Flow

```
Component Action → Store Update → Database Sync → UI Re-render → User Feedback
```

## Component Communication Patterns

### 1. Parent-Child Communication

- Props for data passing
- Callbacks for event handling
- Context for deep prop drilling avoidance

### 2. Sibling Communication

- Shared state stores
- Event emitters for loose coupling
- URL state for navigation sync

### 3. Cross-Feature Communication

- Global stores for shared data
- Custom hooks for business logic
- API calls for data persistence

## Performance Considerations

### 1. Code Splitting

- Route-based splitting
- Component lazy loading
- Dynamic imports for heavy libraries

### 2. Data Optimization

- Efficient database queries
- Response caching strategies
- Optimistic UI updates

### 3. AI Response Optimization

- Streaming responses for better UX
- Request debouncing
- Background processing for heavy operations

## Scalability Patterns

### 1. Horizontal Scaling

- Stateless API design
- Database connection pooling
- CDN for static assets

### 2. Feature Scaling

- Plugin architecture for new AI capabilities
- Extensible component system
- Configurable business rules

### 3. Data Scaling

- Efficient pagination
- Incremental data loading
- Archive strategies for old data
