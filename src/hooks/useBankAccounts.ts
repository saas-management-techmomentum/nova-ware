// COMMENTED OUT: bank_accounts.opening_balance column missing from database
// This feature requires database schema updates before it can be enabled

/*
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BankAccount {
  id: string;
  user_id: string;
  warehouse_id?: string;
  company_id?: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  currency: string;
  current_balance: number;
  opening_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountData {
  bank_name: string;
  account_number: string;
  account_type: string;
  currency: string;
  current_balance: number;
  opening_balance: number;
  warehouse_id?: string;
  company_id?: string;
}

export const useBankAccounts = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBankAccounts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBankAccounts(data || []);
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bank accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const addBankAccount = async (accountData: CreateBankAccountData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([{
          ...accountData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setBankAccounts(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding bank account:', err);
      throw err;
    }
  };

  const updateBankAccount = async (id: string, updates: Partial<CreateBankAccountData>) => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBankAccounts(prev => 
        prev.map(account => account.id === id ? data : account)
      );
      return data;
    } catch (err) {
      console.error('Error updating bank account:', err);
      throw err;
    }
  };

  const deleteBankAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBankAccounts(prev => prev.filter(account => account.id !== id));
    } catch (err) {
      console.error('Error deleting bank account:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, [user]);

  return {
    bankAccounts,
    isLoading,
    error,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    refetch: fetchBankAccounts
  };
};
*/

export interface BankAccount {
  id: string;
  user_id: string;
  warehouse_id?: string;
  company_id?: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  currency: string;
  current_balance: number;
  opening_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountData {
  bank_name: string;
  account_number: string;
  account_type: string;
  currency: string;
  current_balance: number;
  opening_balance: number;
  warehouse_id?: string;
  company_id?: string;
}

// Stub export to maintain compatibility
export const useBankAccounts = () => ({
  bankAccounts: [] as BankAccount[],
  isLoading: false,
  error: null,
  addBankAccount: async (data: CreateBankAccountData) => {},
  updateBankAccount: async (id: string, updates: Partial<CreateBankAccountData>) => {},
  deleteBankAccount: async (id: string) => {},
  refetch: async () => {}
});
