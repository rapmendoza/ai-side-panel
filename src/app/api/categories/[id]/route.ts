import { createClient } from '@/lib/supabase/server';
import { CategoryFormData } from '@/lib/types/category';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: category, error } = await supabase
      .from('categories')
      .select(
        `
        *,
        parent:categories!parent_id(
          id,
          name
        ),
        children:categories!parent_id(
          id,
          name
        ),
        payee_count:payees(count)
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching category:', error);
      return NextResponse.json(
        { error: 'Failed to fetch category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error in category GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Prevent setting self as parent
    if (body.parent_id === id) {
      return NextResponse.json(
        { error: 'Category cannot be its own parent' },
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
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      console.error('Error updating category:', error);
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error in category PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if category has children
    const { data: children, error: childrenError } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', id)
      .eq('user_id', user.id);

    if (childrenError) {
      console.error('Error checking for child categories:', childrenError);
      return NextResponse.json(
        { error: 'Failed to check category dependencies' },
        { status: 500 }
      );
    }

    if (children && children.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete category with subcategories. Please delete or move subcategories first.',
        },
        { status: 400 }
      );
    }

    // Check if category has payees
    const { data: payees, error: payeesError } = await supabase
      .from('payees')
      .select('id')
      .eq('category_id', id)
      .eq('user_id', user.id);

    if (payeesError) {
      console.error('Error checking for category payees:', payeesError);
      return NextResponse.json(
        { error: 'Failed to check category dependencies' },
        { status: 500 }
      );
    }

    if (payees && payees.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete category with payees. Please move or delete payees first.',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error in category DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
