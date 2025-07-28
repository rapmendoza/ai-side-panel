export interface Payee {
  id: string;
  name: string;
  description?: string;
  contact_info?: ContactInfo;
  created_at: string;
  updated_at: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  account?: string;
  portfolio?: string;
  [key: string]: string | undefined;
}

export interface CreatePayeeRequest {
  name: string;
  description?: string;
  contact_info?: ContactInfo;
}

export interface UpdatePayeeRequest {
  name?: string;
  description?: string;
  contact_info?: ContactInfo;
}
