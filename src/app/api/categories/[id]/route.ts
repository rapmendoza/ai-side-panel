import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from '@/lib/database/category-service';
import { isValidUUID, sanitizeInput } from '@/lib/database/utils';
import { UpdateCategoryRequest } from '@/types/category';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID format' },
        { status: 400 }
      );
    }

    const category = await getCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error(`Error in GET /api/categories/${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
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
    const body: UpdateCategoryRequest = await request.json();

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID format' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Validate type if provided
    if (body.type && !['income', 'expense'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Category type must be either "income" or "expense"' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData: UpdateCategoryRequest = {};
    if (body.name) sanitizedData.name = sanitizeInput(body.name);
    if (body.type) sanitizedData.type = body.type;
    if (body.description)
      sanitizedData.description = sanitizeInput(body.description);
    if (body.parent_category_id)
      sanitizedData.parent_category_id = body.parent_category_id;

    const updatedCategory = await updateCategory(id, sanitizedData);
    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    console.error(`Error in PUT /api/categories/${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update category' },
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

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID format' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const result = await deleteCategory(id);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(
      `Error in DELETE /api/categories/${(await params).id}:`,
      error
    );
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
