export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  description?: string;
  parent_category_id?: string;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  type: 'income' | 'expense';
  description?: string;
  parent_category_id?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  type?: 'income' | 'expense';
  description?: string;
  parent_category_id?: string;
}
