import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  transaction_date: string;
  date?: string;
  warehouse_name?: string;
  warehouse_id?: string;
}

export const useWarehouseScopedExpenses = () => {
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpenses = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('billing_transactions')
        .select('*')
        .eq('transaction_type', 'expense')
        .order('transaction_date', { ascending: false });

      if (selectedWarehouse) {
        query = query.eq('warehouse_id', selectedWarehouse);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedExpenses: Expense[] = (data || []).map(item => ({
        id: item.id,
        description: item.description,
        amount: item.amount,
        category: item.category || 'Uncategorized',
        status: item.status,
        transaction_date: item.transaction_date,
        warehouse_id: item.warehouse_id || undefined,
        warehouse_name: undefined
      }));

      setExpenses(formattedExpenses);
    } catch (error: any) {
      console.error('Error fetching warehouse expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user, selectedWarehouse]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const expensesByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  return {
    expenses,
    totalExpenses,
    pendingExpenses,
    expensesByCategory,
    isLoading,
    refetch: fetchExpenses,
  };
};
