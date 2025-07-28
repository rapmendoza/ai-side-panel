export interface Payee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  category_id?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PayeeFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  category_id?: string;
  notes?: string;
}

export interface PayeeFilters {
  search?: string;
  category_id?: string;
  status?: string;
}

export interface ValidationErrors {
  [key: string]: string[];
}
