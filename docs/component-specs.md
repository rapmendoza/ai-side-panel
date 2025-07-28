# Component Specifications

## Overview

The component architecture follows a modular, reusable design pattern with clear separation between AI-specific components and standard CRUD components. All components are built with TypeScript and follow accessibility standards.

## Component Organization

### AI Panel Components (`/components/ai-panel/`)

Components specifically designed for AI interaction and natural language processing.

### Entity Components (`/components/payees/`, `/components/categories/`)

Standard CRUD components for managing business entities.

### UI Components (`/components/ui/`)

Base Shadcn UI components and custom extensions.

## AI Panel Components

### 1. AISidePanel Component

**Purpose**: Main container for the AI interface with collapsible/expandable functionality.

**File**: `components/ai-panel/AISidePanel.tsx`

**Props Interface**:

```typescript
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
```

**Key Features**:

- Resizable panel with drag handle
- Collapsible with animation
- Persistent state across sessions
- Integration with main app context
- Keyboard shortcuts support

**Usage Example**:

```tsx
<AISidePanel
  isOpen={isAIPanelOpen}
  onToggle={() => setIsAIPanelOpen(!isAIPanelOpen)}
  onEntityCreated={(type, entity) => {
    // Refresh entity lists
    if (type === 'payee') refreshPayees();
    if (type === 'category') refreshCategories();
  }}
  defaultWidth={400}
  minWidth={300}
  maxWidth={600}
/>
```

### 2. ChatInterface Component

**Purpose**: Core chat interface for user interaction with AI.

**File**: `components/ai-panel/ChatInterface.tsx`

**Props Interface**:

```typescript
interface ChatInterfaceProps {
  conversationId?: string;
  onNewConversation?: () => void;
  onMessageSent?: (message: string) => void;
  onOperationComplete?: (operation: ExecutedOperation) => void;
  initialMessage?: string;
  placeholder?: string;
  maxHeight?: number;
}
```

**State Interface**:

```typescript
interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentTyping: string;
  pendingClarification: ClarificationNeed | null;
  inputValue: string;
  conversationId: string;
}
```

**Key Features**:

- Auto-resizing text input
- Message history with timestamps
- Typing indicators
- Loading states
- Scroll to bottom on new messages
- Message retry functionality
- Export conversation feature

### 3. IntentProcessor Component

**Purpose**: Visual feedback and processing indicator for AI operations.

**File**: `components/ai-panel/IntentProcessor.tsx`

**Props Interface**:

```typescript
interface IntentProcessorProps {
  message: string;
  onProcessed: (result: IntentProcessingResult) => void;
  onError: (error: Error) => void;
  showDebugInfo?: boolean;
  context?: any;
}
```

**Processing Steps**:

1. Intent classification display
2. Entity extraction visualization
3. Confidence scoring
4. Operation execution status
5. Result confirmation

### 4. ClarificationDialog Component

**Purpose**: Modal dialog for handling ambiguous requests and missing information.

**File**: `components/ai-panel/ClarificationDialog.tsx`

**Props Interface**:

```typescript
interface ClarificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clarificationNeeds: ClarificationNeed[];
  onSubmit: (responses: ClarificationResponse[]) => void;
  originalMessage: string;
  suggestedActions?: SuggestedAction[];
}
```

**Clarification Types**:

- Multiple choice questions
- Text input for missing data
- Entity selection from lists
- Confirmation dialogs

## Payee Management Components

### 1. PayeeList Component

**Purpose**: Display and manage list of payees with filtering and search.

**File**: `components/payees/PayeeList.tsx`

**Props Interface**:

```typescript
interface PayeeListProps {
  payees?: Payee[];
  isLoading?: boolean;
  onPayeeClick?: (payee: Payee) => void;
  onPayeeEdit?: (payee: Payee) => void;
  onPayeeDelete?: (payee: Payee) => void;
  showCategories?: boolean;
  enableSelection?: boolean;
  selectedPayees?: string[];
  onSelectionChange?: (selected: string[]) => void;
  filters?: PayeeFilters;
  onFiltersChange?: (filters: PayeeFilters) => void;
}
```

**Features**:

- Virtual scrolling for large lists
- Multi-select with checkbox
- Sort by multiple columns
- Filter by category, status, etc.
- Search with debouncing
- Export to CSV/Excel

### 2. PayeeForm Component

**Purpose**: Form for creating and editing payee information.

**File**: `components/payees/PayeeForm.tsx`

**Props Interface**:

```typescript
interface PayeeFormProps {
  payee?: Partial<Payee>;
  isEdit?: boolean;
  onSubmit: (payee: PayeeFormData) => Promise<void>;
  onCancel: () => void;
  categories: Category[];
  isLoading?: boolean;
  validationErrors?: ValidationErrors;
}
```

**Form Schema**:

```typescript
interface PayeeFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  category_id?: string;
  notes?: string;
}
```

**Validation Rules**:

- Name: Required, 2-255 characters
- Email: Valid email format or empty
- Phone: Valid phone format or empty
- Tax ID: Format validation based on region

### 3. PayeeCard Component

**Purpose**: Compact card display for individual payees.

**File**: `components/payees/PayeeCard.tsx`

**Props Interface**:

```typescript
interface PayeeCardProps {
  payee: Payee;
  category?: Category;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}
```

**Display Elements**:

- Payee name and category badge
- Contact information icons
- Last updated timestamp
- Quick action buttons
- Status indicator

## Category Management Components

### 1. CategoryTree Component

**Purpose**: Hierarchical tree view for category management.

**File**: `components/categories/CategoryTree.tsx`

**Props Interface**:

```typescript
interface CategoryTreeProps {
  categories: CategoryWithChildren[];
  onCategorySelect?: (category: Category) => void;
  onCategoryEdit?: (category: Category) => void;
  onCategoryDelete?: (category: Category) => void;
  onCategoryMove?: (categoryId: string, newParentId: string | null) => void;
  selectedCategoryId?: string;
  expandedNodes?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  enableDragDrop?: boolean;
  showPayeeCounts?: boolean;
}
```

**Features**:

- Expandable/collapsible nodes
- Drag and drop reordering
- Visual hierarchy indicators
- Payee count badges
- Context menu actions
- Keyboard navigation

### 2. CategoryForm Component

**Purpose**: Form for creating and editing categories.

**File**: `components/categories/CategoryForm.tsx`

**Props Interface**:

```typescript
interface CategoryFormProps {
  category?: Partial<Category>;
  parentCategory?: Category;
  allCategories: Category[];
  isEdit?: boolean;
  onSubmit: (category: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**Form Fields**:

- Name (required)
- Description (optional)
- Parent category selection
- Color picker
- Icon selection

### 3. CategoryCard Component

**Purpose**: Card view for category information and quick actions.

**File**: `components/categories/CategoryCard.tsx`

**Props Interface**:

```typescript
interface CategoryCardProps {
  category: Category;
  payeeCount?: number;
  children?: CategoryWithChildren[];
  onEdit?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  showHierarchy?: boolean;
  className?: string;
}
```

## Shared UI Components

### 1. SearchInput Component

**Purpose**: Debounced search input with suggestions.

**Props Interface**:

```typescript
interface SearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
  debounceMs?: number;
  className?: string;
}
```

### 2. DataTable Component

**Purpose**: Enhanced table with sorting, filtering, and pagination.

**Props Interface**:

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  pagination?: PaginationState;
  sorting?: SortingState;
  filtering?: FilteringState;
  onPaginationChange?: (pagination: PaginationState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onFilteringChange?: (filtering: FilteringState) => void;
  enableSelection?: boolean;
  onSelectionChange?: (selection: T[]) => void;
}
```

### 3. ConfirmDialog Component

**Purpose**: Confirmation dialog for destructive actions.

**Props Interface**:

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}
```

## State Management Patterns

### 1. Component State

```typescript
// Local component state for UI interactions
const [isExpanded, setIsExpanded] = useState(false);
const [selectedItems, setSelectedItems] = useState<string[]>([]);
const [formData, setFormData] = useState<FormData>({});
```

### 2. Global State Integration

```typescript
// Using Zustand stores
const { payees, createPayee, updatePayee, deletePayee } = usePayeeStore();
const { categories, fetchCategories } = useCategoryStore();
const { sendMessage, clearConversation } = useAIStore();
```

### 3. Server State Management

```typescript
// Using React Query for server state
const {
  data: payees,
  isLoading,
  error,
} = useQuery({
  queryKey: ['payees', filters],
  queryFn: () => fetchPayees(filters),
});

const createPayeeMutation = useMutation({
  mutationFn: createPayee,
  onSuccess: () => {
    queryClient.invalidateQueries(['payees']);
  },
});
```

## Event Handling Patterns

### 1. Event Bubbling Prevention

```typescript
const handleEdit = (e: React.MouseEvent, payee: Payee) => {
  e.stopPropagation(); // Prevent row click when editing
  onEdit(payee);
};
```

### 2. Keyboard Navigation

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
      handleSubmit();
      break;
    case 'Escape':
      handleCancel();
      break;
    case 'ArrowDown':
      navigateDown();
      break;
  }
};
```

## Accessibility Implementation

### 1. ARIA Labels and Roles

```typescript
<button
  aria-label={`Edit payee ${payee.name}`}
  aria-describedby={`payee-${payee.id}-description`}
  onClick={() => onEdit(payee)}
>
  <EditIcon />
</button>
```

### 2. Focus Management

```typescript
const dialogRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen && dialogRef.current) {
    dialogRef.current.focus();
  }
}, [isOpen]);
```

### 3. Screen Reader Support

```typescript
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {isLoading ? 'Loading payees...' : `${payees.length} payees loaded`}
</div>
```

## Testing Considerations

### 1. Component Testing

```typescript
describe('PayeeForm', () => {
  it('validates required fields', async () => {
    render(<PayeeForm onSubmit={jest.fn()} onCancel={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });
});
```

### 2. Integration Testing

```typescript
describe('AISidePanel Integration', () => {
  it('creates payee from AI conversation', async () => {
    const { user } = renderWithProviders(<AISidePanel isOpen={true} />);

    await user.type(screen.getByRole('textbox'), 'Add vendor ABC Corp');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText(/created.*abc corp/i)).toBeInTheDocument();
  });
});
```

## Performance Optimization

### 1. Memoization

```typescript
const PayeeCard = memo(({ payee, onEdit, onDelete }: PayeeCardProps) => {
  const handleEdit = useCallback(() => onEdit(payee), [payee, onEdit]);
  const handleDelete = useCallback(() => onDelete(payee), [payee, onDelete]);

  return (
    // Component JSX
  );
});
```

### 2. Virtual Scrolling

```typescript
const PayeeList = ({ payees }: PayeeListProps) => {
  return (
    <VirtualizedList
      items={payees}
      itemHeight={80}
      renderItem={({ item, index }) => <PayeeCard key={item.id} payee={item} />}
    />
  );
};
```

### 3. Lazy Loading

```typescript
const CategoryTree = lazy(() => import('./CategoryTree'));
const PayeeForm = lazy(() => import('./PayeeForm'));

// Usage with Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <CategoryTree categories={categories} />
</Suspense>;
```
