import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Generic function to handle database operations with error handling
 */
export async function withDatabase<T>(
  operation: (
    supabase: SupabaseClient
  ) => Promise<{ data: T; error: Error | null }>
): Promise<T> {
  try {
    const supabase = await createClient();
    const { data, error } = await operation(supabase);

    if (error) {
      console.error('Database operation failed:', error);
      throw new Error(error.message || 'Database operation failed');
    }

    return data;
  } catch (error) {
    console.error('Database utility error:', error);
    throw error;
  }
}

/**
 * Generic search function for any table
 */
export async function searchTable(
  tableName: string,
  searchField: string,
  searchTerm: string,
  additionalFilters?: Record<string, string | number | boolean>
) {
  return withDatabase(async (supabase) => {
    let query = supabase
      .from(tableName)
      .select('*')
      .ilike(searchField, `%${searchTerm}%`);

    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    return query;
  });
}

/**
 * Generic pagination function
 */
export async function paginateQuery(
  tableName: string,
  page: number = 1,
  limit: number = 10,
  orderBy?: string,
  ascending: boolean = true
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return withDatabase(async (supabase) => {
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .range(from, to);

    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }

    return query;
  });
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize input for database queries
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Build filter conditions for complex queries
 */
export function buildFilters(filters: Record<string, unknown>) {
  return Object.entries(filters)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, unknown>);
}
