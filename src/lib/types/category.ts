export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
  payee_count?: number;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
}
