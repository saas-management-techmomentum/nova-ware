import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExpenseRecord {
  id: string;
  description: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  entry_date?: string;
  category: string | null;
  reference: string | null;
  status: string;
  warehouse_id: string | null;
  company_id: string;
  user_id: string;
  warehouse_name?: string;
  vendor?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseMetrics {
  totalThisMonth: number;
  lastMonthChange: number;
  totalUnpaid: number;
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  topVendor: {
    name: string;
    amount: number;
  } | null;
  recurringExpenses: number;
  categoriesBreakdown: Record<string, number>;
}

export const useExpenseManagement = () => {
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [metrics, setMetrics] = useState<ExpenseMetrics>({
    totalThisMonth: 0,
    lastMonthChange: 0,
    totalUnpaid: 0,
    topCategories: [],
    topVendor: null,
    recurringExpenses: 0,
    categoriesBreakdown: {}
  });
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
      setExpenses((data as any) || []);
      calculateMetrics((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (expenseData: ExpenseRecord[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthExpenses = expenseData.filter(e => 
      new Date(e.transaction_date) >= startOfMonth
    );
    const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const lastMonthExpenses = expenseData.filter(e => {
      const date = new Date(e.transaction_date);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    });
    const totalLastMonth = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthChange = totalLastMonth > 0 
      ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 
      : 0;

    const totalUnpaid = expenseData
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);

    const categoriesMap = new Map<string, number>();
    expenseData.forEach(e => {
      const category = e.category || 'Uncategorized';
      categoriesMap.set(category, (categoriesMap.get(category) || 0) + e.amount);
    });

    const categoriesBreakdown: Record<string, number> = {};
    categoriesMap.forEach((amount, category) => {
      categoriesBreakdown[category] = amount;
    });

    const topCategories = Array.from(categoriesMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalThisMonth > 0 ? (amount / totalThisMonth) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    setMetrics({
      totalThisMonth,
      lastMonthChange,
      totalUnpaid,
      topCategories,
      topVendor: null,
      recurringExpenses: 0,
      categoriesBreakdown
    });
  };

  const createExpense = async (expenseData: Partial<ExpenseRecord>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      // First get user's company_id
      const { data: companyData } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('approval_status', 'approved')
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from('billing_transactions')
        .insert([{
          user_id: user.id,
          description: expenseData.description!,
          amount: expenseData.amount!,
          transaction_type: 'expense',
          transaction_date: expenseData.transaction_date || new Date().toISOString().split('T')[0],
          category: expenseData.category || null,
          reference: expenseData.reference || null,
          status: expenseData.status || 'pending',
          warehouse_id: selectedWarehouse || expenseData.warehouse_id || null,
          company_id: companyData?.company_id!,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Expense created successfully');
      await fetchExpenses();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating expense:', error);
      toast.error('Failed to create expense');
      return { success: false, error: error.message };
    }
  };

  const updateExpense = async (id: string, updates: Partial<ExpenseRecord>) => {
    try {
      const { error } = await supabase
        .from('billing_transactions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Expense updated successfully');
      await fetchExpenses();
    } catch (error: any) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('billing_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Expense deleted successfully');
      await fetchExpenses();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user, selectedWarehouse]);

  return {
    expenses,
    metrics,
    isLoading,
    fetchExpenses,
    addExpense: createExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses
  };
};
