import {
  createCategory,
  getAllCategories,
  getCategoryTree,
  searchCategories,
} from '@/lib/database/category-service';
import { sanitizeInput } from '@/lib/database/utils';
import { CreateCategoryRequest } from '@/types/category';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tree = searchParams.get('tree') === 'true';

    if (search) {
      const sanitizedSearch = sanitizeInput(search);
      const categories = await searchCategories(sanitizedSearch);
      return NextResponse.json({ categories, total: categories.length });
    }

    if (tree) {
      const categories = await getCategoryTree();
      return NextResponse.json({ categories, total: categories.length });
    }

    const categories = await getAllCategories();
    return NextResponse.json({ categories, total: categories.length });
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCategoryRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    if (!body.type || !['income', 'expense'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Category type must be either "income" or "expense"' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData: CreateCategoryRequest = {
      name: sanitizeInput(body.name),
      type: body.type,
      description: body.description
        ? sanitizeInput(body.description)
        : undefined,
      parent_category_id: body.parent_category_id,
    };

    const category = await createCategory(sanitizedData);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/categories:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
