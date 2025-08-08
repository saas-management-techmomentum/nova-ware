import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  user_id: string;
  transaction_date: string;
  description: string;
  reference_number?: string;
  amount: number;
  transaction_type: 'debit' | 'credit';
  status: 'matched' | 'unmatched' | 'pending';
  gl_reference_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBankTransactionData {
  bank_account_id: string;
  transaction_date: string;
  description: string;
  reference_number?: string;
  amount: number;
  transaction_type: 'debit' | 'credit';
  status?: 'matched' | 'unmatched' | 'pending';
  gl_reference_id?: string;
}

export const useBankTransactions = () => {
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBankTransactions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      setBankTransactions((data || []) as BankTransaction[]);
    } catch (err) {
      console.error('Error fetching bank transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bank transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const addBankTransaction = async (transactionData: CreateBankTransactionData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .insert([{
          ...transactionData,
          user_id: user.id,
          status: transactionData.status || 'unmatched'
        }])
        .select()
        .single();

      if (error) throw error;

      setBankTransactions(prev => [data as BankTransaction, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding bank transaction:', err);
      throw err;
    }
  };

  const updateBankTransaction = async (id: string, updates: Partial<CreateBankTransactionData>) => {
    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBankTransactions(prev => 
        prev.map(transaction => transaction.id === id ? data as BankTransaction : transaction)
      );
      return data;
    } catch (err) {
      console.error('Error updating bank transaction:', err);
      throw err;
    }
  };

  const updateTransactionStatus = async (id: string, status: 'matched' | 'unmatched' | 'pending') => {
    return updateBankTransaction(id, { status });
  };

  const deleteBankTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBankTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } catch (err) {
      console.error('Error deleting bank transaction:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBankTransactions();
  }, [user]);

  return {
    bankTransactions,
    isLoading,
    error,
    addBankTransaction,
    updateBankTransaction,
    updateTransactionStatus,
    deleteBankTransaction,
    refetch: fetchBankTransactions
  };
};