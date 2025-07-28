# Security & Deployment Guide

## Security Considerations

### 1. Input Validation & Sanitization

#### Client-Side Validation

```typescript
import { z } from 'zod';

const PayeeSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\+]?[0-9\s\-\(\)\.]+$/)
    .optional(),
  address: z.string().max(1000).optional(),
  tax_id: z.string().max(50).optional(),
  category_id: z.string().uuid().optional(),
});
```

#### Server-Side Sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input.trim());
}

export function validateSQLInjection(input: string): boolean {
  const sqlPattern =
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi;
  return !sqlPattern.test(input);
}
```

### 2. Authentication & Authorization

#### Supabase Authentication

```typescript
// lib/auth.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw new Error('Authentication failed');
  return user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Sign out failed');
}
```

#### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for user data isolation
CREATE POLICY "Users can only access their own payees" ON payees
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);
```

#### API Route Protection

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect API routes
  if (req.nextUrl.pathname.startsWith('/api/') && !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
```

### 3. AI Safety & Prompt Injection Protection

#### Input Filtering

```typescript
class PromptSafetyFilter {
  private static DANGEROUS_PATTERNS = [
    /ignore\s+previous\s+instructions/gi,
    /system\s*:/gi,
    /\{\{\s*.*\s*\}\}/gi, // Template injection
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
  ];

  static isSafe(input: string): boolean {
    return !this.DANGEROUS_PATTERNS.some((pattern) => pattern.test(input));
  }

  static sanitize(input: string): string {
    let sanitized = input;
    this.DANGEROUS_PATTERNS.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    return sanitized.slice(0, 2000); // Limit length
  }
}
```

#### Response Validation

```typescript
class ResponseValidator {
  static validateAIResponse(response: string): boolean {
    // Check for potential data leaks
    const sensitivePatterns = [
      /api[_-]?key/gi,
      /password/gi,
      /secret/gi,
      /token/gi,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email patterns
    ];

    return !sensitivePatterns.some((pattern) => pattern.test(response));
  }
}
```

### 4. Rate Limiting

#### API Rate Limiting

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export default function rateLimit(options: Options = {}) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        return isRateLimited ? reject() : resolve();
      }),
  };
}

// Usage in API routes
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per interval
});

export default async function handler(req: NextRequest) {
  try {
    await limiter.check(60, req.ip ?? 'anonymous'); // 60 requests per minute per IP
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Process request...
}
```

### 5. Data Encryption

#### Environment Variables

```typescript
// .env.local (example - never commit actual values)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url

# Encryption keys
ENCRYPTION_KEY=your_32_character_encryption_key
JWT_SECRET=your_jwt_secret
```

#### Sensitive Data Encryption

```typescript
import crypto from 'crypto';

class DataEncryption {
  private static algorithm = 'aes-256-cbc';
  private static key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedData: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

## Deployment Configuration

### 1. Environment Setup

#### Production Environment Variables

```bash
# Vercel deployment
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://postgres:password@db.host:5432/database
NODE_ENV=production
```

#### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ai_panel
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 2. Supabase Configuration

#### Database Setup Script

```sql
-- scripts/setup-database.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create enum types
CREATE TYPE intent_type AS ENUM (
  'CREATE_PAYEE', 'READ_PAYEE', 'UPDATE_PAYEE', 'DELETE_PAYEE',
  'CREATE_CATEGORY', 'READ_CATEGORY', 'UPDATE_CATEGORY', 'DELETE_CATEGORY',
  'CLARIFY', 'HELP'
);

-- Create tables (from database-schema.md)
-- ... table creation scripts ...

-- Set up Row Level Security
ALTER TABLE payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- ... policy creation scripts ...

-- Create indexes for performance
-- ... index creation scripts ...
```

#### Migration Scripts

```sql
-- migrations/001_initial_schema.sql
BEGIN;

-- Create all tables and initial data
\i scripts/setup-database.sql

-- Insert version tracking
INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');

COMMIT;
```

### 3. Vercel Deployment

#### Vercel Configuration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "next.config.js",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### Next.js Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health-check',
      },
    ];
  },
};

module.exports = nextConfig;
```

### 4. Monitoring & Logging

#### Error Tracking

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

export function captureError(error: Error, context?: any) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) {
  Sentry.captureMessage(message, level);
}
```

#### Performance Monitoring

```typescript
// lib/analytics.ts
export class PerformanceMonitor {
  static trackAPICall(endpoint: string, duration: number, success: boolean) {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'api_call', {
        endpoint,
        duration,
        success,
      });
    }
  }

  static trackAIInteraction(
    intent: string,
    confidence: number,
    responseTime: number
  ) {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'ai_interaction', {
        intent,
        confidence,
        responseTime,
      });
    }
  }
}
```

### 5. Health Checks & Status

#### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks = await Promise.allSettled([
    // Database check
    checkDatabase(),
    // OpenAI API check
    checkOpenAI(),
    // External services check
    checkExternalServices(),
  ]);

  const status = checks.every((check) => check.status === 'fulfilled')
    ? 'healthy'
    : 'unhealthy';

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status,
      openai: checks[1].status,
      external: checks[2].status,
    },
  });
}

async function checkDatabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from('payees').select('count').limit(1);
  if (error) throw error;
}

async function checkOpenAI() {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  });

  if (!response.ok) throw new Error('OpenAI API unavailable');
}

async function checkExternalServices() {
  // Add other service checks as needed
  return Promise.resolve();
}
```

### 6. Backup & Recovery

#### Database Backup Strategy

```bash
#!/bin/bash
# scripts/backup-database.sh

# Set variables
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to cloud storage (example with AWS S3)
aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/database/

# Clean up local backups older than 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### Automated Backup with Cron

```bash
# Add to crontab: crontab -e
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh

# Weekly full backup on Sundays at 1 AM
0 1 * * 0 /path/to/scripts/full-backup.sh
```

### 7. SSL/TLS Configuration

#### HTTPS Enforcement

```typescript
// middleware.ts (additional HTTPS redirect)
export function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    !request.url.startsWith('https://')
  ) {
    return NextResponse.redirect(
      `https://${request.nextUrl.host}${request.nextUrl.pathname}`
    );
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}
```

### 8. Performance Optimization

#### CDN Configuration

```typescript
// next.config.js additions
const nextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.js',
  },
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
      ],
    },
  },
};
```

#### Caching Strategy

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class CacheManager {
  static async get(key: string): Promise<any> {
    try {
      return await redis.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}
```
