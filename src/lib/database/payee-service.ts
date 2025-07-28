import { createClient } from '@/lib/supabase/server';
import { CreatePayeeRequest, Payee, UpdatePayeeRequest } from '@/types/payee';

export async function createPayee(
  payeeData: CreatePayeeRequest
): Promise<Payee> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payees')
    .insert([payeeData])
    .select()
    .single();

  if (error) {
    console.error('Error creating payee:', error);
    throw new Error('Failed to create payee.');
  }

  return data;
}

export async function getPayeeById(id: string): Promise<Payee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching payee with id ${id}:`, error);
    return null;
  }

  return data;
}

export async function getAllPayees(): Promise<Payee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('payees').select('*');

  if (error) {
    console.error('Error fetching all payees:', error);
    return [];
  }

  return data;
}

export async function updatePayee(
  id: string,
  updateData: UpdatePayeeRequest
): Promise<Payee> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payees')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating payee with id ${id}:`, error);
    throw new Error('Failed to update payee.');
  }

  return data;
}

export async function deletePayee(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from('payees').delete().eq('id', id);

  if (error) {
    console.error(`Error deleting payee with id ${id}:`, error);
    return { success: false };
  }

  return { success: true };
}

export async function searchPayees(searchTerm: string): Promise<Payee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payees')
    .select('*')
    .ilike('name', `%${searchTerm}%`);

  if (error) {
    console.error(`Error searching payees with term "${searchTerm}":`, error);
    return [];
  }

  return data;
}
