# Database Schema Design

## Overview

The database schema is designed to support multi-tenant accounting data with AI conversation tracking. All tables include user isolation for security and proper indexing for performance.

## Core Tables

### 1. Payees Table

Stores vendor and customer information with contact details and category associations.

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

-- Indexes for performance
CREATE INDEX idx_payees_user_id ON payees(user_id);
CREATE INDEX idx_payees_name ON payees(name);
CREATE INDEX idx_payees_category_id ON payees(category_id);
CREATE INDEX idx_payees_is_active ON payees(is_active);
CREATE INDEX idx_payees_email ON payees(email) WHERE email IS NOT NULL;
```

**Key Features**:

- UUID primary keys for security
- Optional contact information
- Category association for organization
- Soft delete via `is_active` flag
- User isolation for multi-tenancy

### 2. Categories Table

Hierarchical category structure supporting unlimited nesting levels.

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

-- Indexes for performance
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Constraint to prevent self-referencing
ALTER TABLE categories ADD CONSTRAINT chk_no_self_reference
  CHECK (id != parent_id);
```

**Key Features**:

- Self-referencing hierarchy
- Color coding for UI organization
- Prevents circular references
- Supports unlimited nesting depth

### 3. AI Conversations Table

Tracks all AI interactions for debugging, improvement, and audit purposes.

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  intent VARCHAR(100), -- create, read, update, delete, clarify
  entity_type VARCHAR(50), -- payee, category
  entity_id UUID, -- References payee or category if applicable
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  requires_clarification BOOLEAN DEFAULT false,
  metadata JSONB, -- Additional context and extracted entities
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL
);

-- Indexes for analytics and performance
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_intent ON ai_conversations(intent);
CREATE INDEX idx_ai_conversations_entity_type ON ai_conversations(entity_type);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at);
CREATE INDEX idx_ai_conversations_confidence ON ai_conversations(confidence_score);

-- GIN index for JSONB metadata search
CREATE INDEX idx_ai_conversations_metadata ON ai_conversations USING GIN(metadata);
```

**Key Features**:

- Complete conversation logging
- Intent and entity tracking
- Confidence scoring for AI improvement
- JSONB metadata for flexible data storage
- Performance optimized for analytics

## Relationships

### Entity Relationship Diagram

```
Users (External Auth)
  ├── Payees (user_id)
  ├── Categories (user_id)
  └── AI Conversations (user_id)

Categories
  └── Categories (parent_id) -- Self-referencing hierarchy

Payees
  └── Categories (category_id) -- Many-to-one relationship

AI Conversations
  ├── Payees (entity_id, when entity_type='payee')
  └── Categories (entity_id, when entity_type='category')
```

## Data Integrity Rules

### 1. Referential Integrity

```sql
-- Foreign key constraints
ALTER TABLE payees
  ADD CONSTRAINT fk_payees_category
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Cascading deletes for hierarchy
ALTER TABLE categories
  ADD CONSTRAINT fk_categories_parent
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;
```

### 2. Data Validation

```sql
-- Email format validation
ALTER TABLE payees
  ADD CONSTRAINT chk_payees_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

-- Phone format validation (flexible international format)
ALTER TABLE payees
  ADD CONSTRAINT chk_payees_phone_format
  CHECK (phone ~ '^[\+]?[0-9\s\-\(\)\.]+$' OR phone IS NULL);

-- Color format validation (hex codes)
ALTER TABLE categories
  ADD CONSTRAINT chk_categories_color_format
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$' OR color IS NULL);

-- Intent validation
ALTER TABLE ai_conversations
  ADD CONSTRAINT chk_ai_conversations_intent
  CHECK (intent IN ('CREATE_PAYEE', 'READ_PAYEE', 'UPDATE_PAYEE', 'DELETE_PAYEE',
                    'CREATE_CATEGORY', 'READ_CATEGORY', 'UPDATE_CATEGORY', 'DELETE_CATEGORY',
                    'CLARIFY', 'HELP'));
```

### 3. Business Rules

```sql
-- Ensure category names are unique per user
CREATE UNIQUE INDEX idx_categories_unique_name_per_user
  ON categories(user_id, LOWER(name)) WHERE is_active = true;

-- Ensure payee names are unique per user
CREATE UNIQUE INDEX idx_payees_unique_name_per_user
  ON payees(user_id, LOWER(name)) WHERE is_active = true;
```

## Row Level Security (RLS)

Enable row-level security to ensure users can only access their own data:

```sql
-- Enable RLS on all tables
ALTER TABLE payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY payees_user_isolation ON payees
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY categories_user_isolation ON categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY ai_conversations_user_isolation ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);
```

## Performance Optimization

### 1. Query Optimization

```sql
-- Composite indexes for common queries
CREATE INDEX idx_payees_user_active_name
  ON payees(user_id, is_active, name) WHERE is_active = true;

CREATE INDEX idx_categories_user_active_parent
  ON categories(user_id, is_active, parent_id) WHERE is_active = true;

-- Partial indexes for active records only
CREATE INDEX idx_payees_active_only
  ON payees(user_id, category_id) WHERE is_active = true;
```

### 2. Database Functions

```sql
-- Function to get category hierarchy
CREATE OR REPLACE FUNCTION get_category_hierarchy(category_uuid UUID)
RETURNS TABLE(
  id UUID,
  name VARCHAR(255),
  level INTEGER,
  path TEXT[]
) AS $$
WITH RECURSIVE category_tree AS (
  -- Base case: start with the given category
  SELECT c.id, c.name, c.parent_id, 0 as level, ARRAY[c.name] as path
  FROM categories c
  WHERE c.id = category_uuid

  UNION ALL

  -- Recursive case: get children
  SELECT c.id, c.name, c.parent_id, ct.level + 1, ct.path || c.name
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
  WHERE c.is_active = true
)
SELECT id, name, level, path
FROM category_tree
ORDER BY level, name;
$$ LANGUAGE SQL STABLE;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_payees_updated_at
  BEFORE UPDATE ON payees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Migration Strategy

### 1. Initial Schema Creation

```sql
-- Schema version tracking
CREATE TABLE schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial version
INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');
```

### 2. Seed Data

```sql
-- Default categories for new users
INSERT INTO categories (name, description, color, user_id) VALUES
('Office Supplies', 'General office and administrative supplies', '#3B82F6', 'system'),
('Vendors', 'External vendors and suppliers', '#10B981', 'system'),
('Contractors', 'Independent contractors and consultants', '#F59E0B', 'system'),
('Utilities', 'Utility bills and services', '#EF4444', 'system');
```

## Backup and Recovery

### 1. Backup Strategy

- **Daily automated backups** of the entire database
- **Point-in-time recovery** capability
- **Cross-region replication** for disaster recovery
- **Table-level exports** for data archival

### 2. Data Retention

```sql
-- Archive old AI conversations (older than 1 year)
CREATE TABLE ai_conversations_archive (LIKE ai_conversations INCLUDING ALL);

-- Procedure to archive old conversations
CREATE OR REPLACE FUNCTION archive_old_conversations()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  WITH moved_rows AS (
    DELETE FROM ai_conversations
    WHERE created_at < NOW() - INTERVAL '1 year'
    RETURNING *
  )
  INSERT INTO ai_conversations_archive
  SELECT * FROM moved_rows;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
```

## Monitoring and Analytics

### 1. Performance Monitoring

```sql
-- View for query performance analysis
CREATE VIEW slow_queries AS
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries taking more than 100ms on average
ORDER BY mean_time DESC;
```

### 2. Usage Analytics

```sql
-- AI usage statistics
CREATE VIEW ai_usage_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  intent,
  COUNT(*) as conversation_count,
  AVG(confidence_score) as avg_confidence,
  COUNT(*) FILTER (WHERE requires_clarification) as clarification_count
FROM ai_conversations
GROUP BY DATE_TRUNC('day', created_at), intent
ORDER BY date DESC, conversation_count DESC;
```
