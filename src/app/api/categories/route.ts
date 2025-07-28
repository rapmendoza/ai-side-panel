import { createClient } from '@/lib/supabase/server';
import { CategoryFormData } from '@/lib/types/category';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeHierarchy = searchParams.get('hierarchy') === 'true';

    if (includeHierarchy) {
      // Fetch categories with hierarchy structure
      const { data: categories, error } = await supabase
        .from('categories')
        .select(
          `
          *,
          children:categories!parent_id(
            *,
            payee_count:payees(count)
          ),
          payee_count:payees(count)
        `
        )
        .eq('user_id', user.id)
        .is('parent_id', null)
        .order('name');

      if (error) {
        console.error('Error fetching categories with hierarchy:', error);
        return NextResponse.json(
          { error: 'Failed to fetch categories' },
          { status: 500 }
        );
      }

      return NextResponse.json({ categories });
    } else {
      // Fetch flat list of categories
      const { data: categories, error } = await supabase
        .from('categories')
        .select(
          `
          *,
          parent:categories!parent_id(
            id,
            name
          ),
          payee_count:payees(count)
        `
        )
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
          { error: 'Failed to fetch categories' },
          { status: 500 }
        );
      }

      return NextResponse.json({ categories });
    }
  } catch (error) {
    console.error('Error in categories API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CategoryFormData;

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate color format if provided
    if (body.color && !/^#[0-9A-F]{6}$/i.test(body.color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Use hex format (#RRGGBB)' },
        { status: 400 }
      );
    }

    // Check if parent category exists and belongs to user
    if (body.parent_id) {
      const { data: parentCategory, error: parentError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', body.parent_id)
        .eq('user_id', user.id)
        .single();

      if (parentError || !parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        );
      }
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        ...body,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error in categories POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
