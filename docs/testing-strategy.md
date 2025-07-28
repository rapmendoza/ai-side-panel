# Testing Strategy & Quality Assurance

## Testing Philosophy

The testing approach emphasizes comprehensive coverage across all layers of the application, with special attention to AI functionality reliability, data integrity, and user experience quality.

## Testing Pyramid

### 1. Unit Tests (Foundation - 70%)

**Scope**: Individual functions, utilities, and isolated components
**Tools**: Jest, React Testing Library
**Coverage Target**: >90%

#### Test Categories

**Utility Functions**

```typescript
// lib/utils/validation.test.ts
import { validateEmail, validatePhone, sanitizeInput } from '../validation';

describe('Validation utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      expect(sanitizeInput(input)).toBe('Hello  World');
    });

    it('should preserve safe HTML entities', () => {
      const input = 'Company &amp; Associates';
      expect(sanitizeInput(input)).toBe('Company & Associates');
    });
  });
});
```

**AI Processing Logic**

```typescript
// lib/ai/intent-classifier.test.ts
import { IntentClassifier } from '../intent-classifier';

describe('IntentClassifier', () => {
  let classifier: IntentClassifier;

  beforeEach(() => {
    classifier = new IntentClassifier();
  });

  describe('classifyIntent', () => {
    it('should identify CREATE_PAYEE intent', async () => {
      const result = await classifier.classifyIntent('Add new vendor ABC Corp');

      expect(result.intent).toBe('CREATE_PAYEE');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should identify UPDATE_PAYEE intent', async () => {
      const result = await classifier.classifyIntent(
        "Update John's email to john@example.com"
      );

      expect(result.intent).toBe('UPDATE_PAYEE');
      expect(result.entities).toContainEqual(
        expect.objectContaining({
          type: 'name',
          value: 'John',
        })
      );
    });

    it('should return CLARIFY for ambiguous requests', async () => {
      const result = await classifier.classifyIntent('I need to do something');

      expect(result.intent).toBe('CLARIFY');
      expect(result.requiresClarification).toBe(true);
    });
  });
});
```

**Database Operations**

```typescript
// lib/supabase/payees.test.ts
import { createPayee, updatePayee, deletePayee } from '../payees';

describe('Payee database operations', () => {
  beforeEach(() => {
    // Setup test database or mock
    jest.clearAllMocks();
  });

  describe('createPayee', () => {
    it('should create payee with valid data', async () => {
      const payeeData = {
        name: 'Test Vendor',
        email: 'test@vendor.com',
        user_id: 'test-user-id',
      };

      const result = await createPayee(payeeData);

      expect(result).toMatchObject({
        name: 'Test Vendor',
        email: 'test@vendor.com',
        is_active: true,
      });
      expect(result.id).toBeDefined();
    });

    it('should throw error for duplicate names', async () => {
      const payeeData = {
        name: 'Existing Vendor',
        user_id: 'test-user-id',
      };

      await expect(createPayee(payeeData)).rejects.toThrow(
        'Payee name already exists'
      );
    });
  });
});
```

### 2. Integration Tests (Middle - 20%)

**Scope**: Component interactions, API endpoints, database integration
**Tools**: Jest, Supertest, React Testing Library
**Coverage Target**: >80%

#### API Integration Tests

```typescript
// __tests__/api/payees.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../app/api/payees/route';

describe('/api/payees', () => {
  describe('POST /api/payees', () => {
    it('should create new payee', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'New Vendor',
          email: 'vendor@example.com',
        },
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.payee.name).toBe('New Vendor');
    });

    it('should return 400 for invalid data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: '', // Invalid: empty name
          email: 'invalid-email',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

#### Component Integration Tests

```typescript
// components/ai-panel/AISidePanel.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AISidePanel } from '../AISidePanel';
import { TestProviders } from '../../__tests__/test-utils';

describe('AISidePanel Integration', () => {
  it('should handle complete payee creation flow', async () => {
    const onEntityCreated = jest.fn();

    render(
      <TestProviders>
        <AISidePanel
          isOpen={true}
          onToggle={() => {}}
          onEntityCreated={onEntityCreated}
        />
      </TestProviders>
    );

    // Type AI command
    const input = screen.getByRole('textbox', { name: /chat input/i });
    fireEvent.change(input, {
      target: { value: 'Add vendor ABC Corp with email contact@abc.com' },
    });

    // Send message
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    // Wait for AI processing and payee creation
    await waitFor(() => {
      expect(screen.getByText(/created.*abc corp/i)).toBeInTheDocument();
    });

    // Verify callback was called
    expect(onEntityCreated).toHaveBeenCalledWith(
      'payee',
      expect.objectContaining({
        name: 'ABC Corp',
        email: 'contact@abc.com',
      })
    );
  });

  it('should handle clarification flow', async () => {
    render(
      <TestProviders>
        <AISidePanel isOpen={true} onToggle={() => {}} />
      </TestProviders>
    );

    // Send ambiguous message
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'I need to add someone' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    // Wait for clarification dialog
    await waitFor(() => {
      expect(screen.getByText(/need more information/i)).toBeInTheDocument();
    });

    // Provide clarification
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'New Vendor' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Verify processing continues
    await waitFor(() => {
      expect(screen.getByText(/created.*new vendor/i)).toBeInTheDocument();
    });
  });
});
```

### 3. End-to-End Tests (Top - 10%)

**Scope**: Complete user workflows, cross-browser compatibility
**Tools**: Playwright, Cypress
**Coverage Target**: >70%

#### E2E Test Scenarios

```typescript
// e2e/payee-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Payee Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should create payee via AI chat', async ({ page }) => {
    // Open AI side panel
    await page.click('[data-testid="ai-panel-toggle"]');
    await expect(page.locator('[data-testid="ai-side-panel"]')).toBeVisible();

    // Send AI command
    await page.fill(
      '[data-testid="chat-input"]',
      'Add vendor TechCorp with email hello@techcorp.com'
    );
    await page.click('[data-testid="send-button"]');

    // Wait for AI response and payee creation
    await expect(page.locator('text=Created vendor TechCorp')).toBeVisible();

    // Verify payee appears in list
    await page.click('[data-testid="payees-tab"]');
    await expect(page.locator('text=TechCorp')).toBeVisible();
    await expect(page.locator('text=hello@techcorp.com')).toBeVisible();
  });

  test('should handle form-based payee creation', async ({ page }) => {
    // Navigate to payee creation
    await page.click('[data-testid="payees-tab"]');
    await page.click('[data-testid="add-payee-button"]');

    // Fill form
    await page.fill('[data-testid="payee-name"]', 'Form Created Vendor');
    await page.fill('[data-testid="payee-email"]', 'form@vendor.com');
    await page.selectOption('[data-testid="payee-category"]', 'Vendors');

    // Submit and verify
    await page.click('[data-testid="submit-button"]');
    await expect(page.locator('text=Payee created successfully')).toBeVisible();
    await expect(page.locator('text=Form Created Vendor')).toBeVisible();
  });

  test('should edit payee information', async ({ page }) => {
    // Find and edit existing payee
    await page.click('[data-testid="payees-tab"]');
    await page.click(
      '[data-testid="payee-TechCorp"] >> [data-testid="edit-button"]'
    );

    // Update information
    await page.fill('[data-testid="payee-phone"]', '+1-555-0123');
    await page.fill(
      '[data-testid="payee-address"]',
      '123 Tech Street, Tech City'
    );

    // Save and verify
    await page.click('[data-testid="save-button"]');
    await expect(page.locator('text=Payee updated successfully')).toBeVisible();
    await expect(page.locator('text=+1-555-0123')).toBeVisible();
  });
});
```

## AI-Specific Testing

### 1. Intent Classification Testing

```typescript
// __tests__/ai/intent-classification.test.ts
interface IntentTestCase {
  input: string;
  expectedIntent: Intent;
  expectedEntities?: ExtractedEntity[];
  minConfidence: number;
  description: string;
}

const INTENT_TEST_CASES: IntentTestCase[] = [
  {
    input: 'Add a new vendor called ABC Corp with email info@abc.com',
    expectedIntent: 'CREATE_PAYEE',
    expectedEntities: [
      { type: 'name', value: 'ABC Corp', confidence: 0.95 },
      { type: 'email', value: 'info@abc.com', confidence: 0.98 },
    ],
    minConfidence: 0.9,
    description: 'Should identify clear payee creation with entities',
  },
  {
    input: 'Show me all the vendors in the office supplies category',
    expectedIntent: 'READ_PAYEE',
    expectedEntities: [
      { type: 'category', value: 'office supplies', confidence: 0.85 },
    ],
    minConfidence: 0.8,
    description: 'Should identify filtered payee retrieval',
  },
  {
    input: "I want to do something with vendors but I'm not sure what",
    expectedIntent: 'CLARIFY',
    minConfidence: 0.7,
    description: 'Should identify ambiguous requests for clarification',
  },
];

describe('AI Intent Classification Accuracy', () => {
  const classifier = new IntentClassifier();

  INTENT_TEST_CASES.forEach((testCase) => {
    test(testCase.description, async () => {
      const result = await classifier.classifyIntent(testCase.input);

      expect(result.intent).toBe(testCase.expectedIntent);
      expect(result.confidence).toBeGreaterThanOrEqual(testCase.minConfidence);

      if (testCase.expectedEntities) {
        testCase.expectedEntities.forEach((expectedEntity) => {
          expect(result.entities).toContainEqual(
            expect.objectContaining({
              type: expectedEntity.type,
              value: expectedEntity.value,
            })
          );
        });
      }
    });
  });
});
```

### 2. AI Response Quality Testing

```typescript
// __tests__/ai/response-quality.test.ts
describe('AI Response Quality', () => {
  const responseGenerator = new ResponseGenerator();

  test('should generate professional responses', async () => {
    const result = await responseGenerator.generateResponse({
      intent: 'CREATE_PAYEE',
      entities: [{ type: 'name', value: 'ABC Corp' }],
      operationResult: { id: '123', name: 'ABC Corp' },
    });

    expect(result.response).toMatch(/created|added/i);
    expect(result.response).toContain('ABC Corp');
    expect(result.response).not.toMatch(/error|failed/i);
  });

  test('should handle errors gracefully', async () => {
    const result = await responseGenerator.generateResponse({
      intent: 'CREATE_PAYEE',
      entities: [{ type: 'name', value: 'ABC Corp' }],
      error: new Error('Duplicate name'),
    });

    expect(result.response).toMatch(/already exists|duplicate/i);
    expect(result.response).toContain('ABC Corp');
    expect(result.suggestedActions).toBeDefined();
  });

  test('should not leak sensitive information', async () => {
    const result = await responseGenerator.generateResponse({
      intent: 'CREATE_PAYEE',
      entities: [{ type: 'name', value: 'ABC Corp' }],
      context: { apiKey: 'secret-key', userEmail: 'user@example.com' },
    });

    expect(result.response).not.toContain('secret-key');
    expect(result.response).not.toContain('user@example.com');
  });
});
```

## Performance Testing

### 1. Load Testing

```typescript
// __tests__/performance/load.test.ts
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  test('AI intent classification should complete within 2 seconds', async () => {
    const classifier = new IntentClassifier();
    const start = performance.now();

    await classifier.classifyIntent(
      'Add new vendor ABC Corp with email contact@abc.com'
    );

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(2000); // 2 seconds
  });

  test('Payee list should render 1000 items within 500ms', async () => {
    const payees = generateMockPayees(1000);
    const start = performance.now();

    render(<PayeeList payees={payees} />);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500); // 500ms
  });

  test('Database queries should complete within performance thresholds', async () => {
    const start = performance.now();

    const payees = await fetchPayees({ limit: 100 });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1000); // 1 second
    expect(payees.length).toBeLessThanOrEqual(100);
  });
});
```

### 2. Memory Usage Testing

```typescript
// __tests__/performance/memory.test.ts
describe('Memory Usage', () => {
  test('should not have memory leaks in AI conversation', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Simulate 100 AI conversations
    for (let i = 0; i < 100; i++) {
      const conversation = new AIConversation();
      await conversation.sendMessage(`Test message ${i}`);
      conversation.destroy();
    }

    // Force garbage collection
    if (global.gc) global.gc();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## Security Testing

### 1. Input Validation Testing

```typescript
// __tests__/security/input-validation.test.ts
describe('Input Validation Security', () => {
  const maliciousInputs = [
    '<script>alert("xss")</script>',
    '"; DROP TABLE payees; --',
    '{{ config.secret_key }}',
    'javascript:alert("xss")',
    '\x00\x01\x02', // Null bytes
    'A'.repeat(10000), // Large input
  ];

  maliciousInputs.forEach((input) => {
    test(`should sanitize malicious input: ${input.substring(
      0,
      20
    )}...`, async () => {
      const sanitized = sanitizeInput(input);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('DROP TABLE');
      expect(sanitized).not.toContain('{{');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized.length).toBeLessThan(2000);
    });
  });

  test('should reject SQL injection attempts', async () => {
    const maliciousQuery = "'; DROP TABLE payees; --";

    await expect(
      createPayee({ name: maliciousQuery, user_id: 'test' })
    ).rejects.toThrow('Invalid input');
  });
});
```

### 2. Authentication Testing

```typescript
// __tests__/security/auth.test.ts
describe('Authentication Security', () => {
  test('should reject requests without valid tokens', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/payees',
      // No authorization header
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  test('should reject expired tokens', async () => {
    const expiredToken = generateExpiredJWT();

    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/payees',
      headers: {
        authorization: `Bearer ${expiredToken}`,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  test('should enforce row-level security', async () => {
    const userAToken = generateTokenForUser('user-a');
    const userBPayee = await createPayeeForUser('user-b', {
      name: 'User B Payee',
    });

    const { req, res } = createMocks({
      method: 'GET',
      url: `/api/payees/${userBPayee.id}`,
      headers: {
        authorization: `Bearer ${userAToken}`,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404); // Not found, not unauthorized
  });
});
```

## Test Data Management

### 1. Test Database Setup

```typescript
// __tests__/setup/database.ts
import { createClient } from '@supabase/supabase-js';

export async function setupTestDatabase() {
  const supabase = createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_KEY!
  );

  // Clean up existing test data
  await supabase.from('ai_conversations').delete().neq('id', '');
  await supabase.from('payees').delete().neq('id', '');
  await supabase.from('categories').delete().neq('id', '');

  // Create test categories
  const { data: categories } = await supabase
    .from('categories')
    .insert([
      { name: 'Vendors', user_id: 'test-user-id' },
      { name: 'Contractors', user_id: 'test-user-id' },
      {
        name: 'Office Supplies',
        parent_id: 'vendors-id',
        user_id: 'test-user-id',
      },
    ])
    .select();

  return { categories };
}

export async function teardownTestDatabase() {
  // Cleanup is handled in setupTestDatabase for next run
}
```

### 2. Mock Data Generators

```typescript
// __tests__/utils/mock-data.ts
export function generateMockPayee(overrides: Partial<Payee> = {}): Payee {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    category_id: faker.string.uuid(),
    is_active: true,
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    user_id: 'test-user-id',
    ...overrides,
  };
}

export function generateMockCategory(
  overrides: Partial<Category> = {}
): Category {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.department(),
    description: faker.lorem.sentence(),
    parent_id: null,
    color: faker.internet.color(),
    is_active: true,
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    user_id: 'test-user-id',
    ...overrides,
  };
}
```

## Continuous Integration

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm run test:e2e
        env:
          PLAYWRIGHT_TEST_BASE_URL: http://localhost:3000
```

## Quality Gates

### 1. Coverage Requirements

```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 85,
      "lines": 85,
      "statements": 85
    },
    "./lib/ai/": {
      "branches": 90,
      "functions": 95,
      "lines": 95,
      "statements": 95
    }
  }
}
```

### 2. Performance Benchmarks

```typescript
// __tests__/benchmarks.test.ts
describe('Performance Benchmarks', () => {
  test.each([
    ['AI Classification', 2000], // 2 seconds
    ['Database Query', 1000], // 1 second
    ['Component Render', 500], // 500ms
  ])('%s should complete within %dms', async (operation, threshold) => {
    const start = performance.now();

    await performOperation(operation);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(threshold);
  });
});
```
