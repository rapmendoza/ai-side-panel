import { createClient } from '@/lib/supabase/server';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/category';

export async function createCategory(
  categoryData: CreateCategoryRequest
): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .insert([categoryData])
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw new Error('Failed to create category.');
  }

  return data;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching category with id ${id}:`, error);
    return null;
  }

  return data;
}

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories').select('*');

  if (error) {
    console.error('Error fetching all categories:', error);
    return [];
  }

  return data;
}

export async function updateCategory(
  id: string,
  updateData: UpdateCategoryRequest
): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating category with id ${id}:`, error);
    throw new Error('Failed to update category.');
  }

  return data;
}

export async function deleteCategory(
  id: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    console.error(`Error deleting category with id ${id}:`, error);
    return { success: false };
  }

  return { success: true };
}

export async function searchCategories(
  searchTerm: string
): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .ilike('name', `%${searchTerm}%`);

  if (error) {
    console.error(
      `Error searching categories with term "${searchTerm}":`,
      error
    );
    return [];
  }

  return data;
}

export async function getCategoryTree(): Promise<Category[]> {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*');

  if (error) {
    console.error('Error fetching categories for tree:', error);
    return [];
  }

  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  categories.forEach((category) => {
    category.children = [];
    categoryMap.set(category.id, category);
  });

  categories.forEach((category) => {
    if (category.parent_category_id) {
      const parent = categoryMap.get(category.parent_category_id);
      if (parent) {
        parent.children?.push(category);
      }
    } else {
      rootCategories.push(category);
    }
  });

  return rootCategories;
}
