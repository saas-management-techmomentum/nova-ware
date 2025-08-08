import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';

export interface ExpenseRecord {
  id: string;
  entry_date: string;
  description: string;
  vendor: string | null;
  category: string;
  amount: number;
  payment_method: string | null;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'overdue';
  reference: string | null;
  notes: string | null;
  warehouse_id: string | null;
  warehouse_name?: string;
  journal_entry_id?: string;
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
  const { selectedWarehouse } = useWarehouse();
  const { user } = useAuth();

  const fetchExpenses = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      console.log('🔄 Fetching expense data via RLS policies for warehouse:', selectedWarehouse);
      
      // Fetch real expense data from journal entries
      const { data: journalData, error: journalError } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          description,
          total_amount,
          reference,
          status,
          warehouse_id,
          created_at,
          updated_at,
          warehouses (
            name,
            code
          )
        `)
        .or('description.ilike.%expense%,description.ilike.%rent%,description.ilike.%utility%,description.ilike.%equipment%,description.ilike.%maintenance%,description.ilike.%supplies%,description.ilike.%service%,description.ilike.%vendor%,description.ilike.%payment%')
        .order('entry_date', { ascending: false })
        .limit(100);

      console.log('📊 Expense journal entries query result:', { data: journalData?.length || 0, error: journalError });

      if (journalError) {
        console.error('Error fetching expense journal entries:', journalError);
        return;
      }

      // Transform journal entries into expense records
      const expenseRecords: ExpenseRecord[] = (journalData || []).map(entry => {
        const description = entry.description || '';
        const reference = entry.reference || '';
        
        // Categorize based on description/reference
        let category = 'Other Expenses';
        let vendor = null;
        
        if (description.toLowerCase().includes('rent') || description.toLowerCase().includes('facility')) {
          category = 'Rent & Facilities';
        } else if (description.toLowerCase().includes('utility') || description.toLowerCase().includes('electric') || description.toLowerCase().includes('water') || description.toLowerCase().includes('gas')) {
          category = 'Utilities';
        } else if (description.toLowerCase().includes('equipment') || description.toLowerCase().includes('maintenance') || description.toLowerCase().includes('repair')) {
          category = 'Equipment & Maintenance';
        } else if (description.toLowerCase().includes('transport') || description.toLowerCase().includes('vehicle') || description.toLowerCase().includes('fuel')) {
          category = 'Transportation';
        } else if (description.toLowerCase().includes('office') || description.toLowerCase().includes('supplies')) {
          category = 'Office Supplies';
        } else if (description.toLowerCase().includes('software') || description.toLowerCase().includes('technology') || description.toLowerCase().includes('subscription')) {
          category = 'Software & Technology';
        } else if (description.toLowerCase().includes('insurance')) {
          category = 'Insurance';
        } else if (description.toLowerCase().includes('marketing') || description.toLowerCase().includes('advertising')) {
          category = 'Marketing & Advertising';
        }

        // Extract vendor from reference or description
        if (reference && reference.includes('Vendor:')) {
          vendor = reference.split('Vendor:')[1].trim();
        } else if (description.includes(' - ')) {
          vendor = description.split(' - ')[1];
        }

        return {
          id: entry.id,
          entry_date: entry.entry_date,
          description: description,
          vendor: vendor,
          category,
          amount: entry.total_amount,
          payment_method: null, // Will be populated from bank transactions if linked
          payment_date: entry.entry_date,
          status: entry.status === 'posted' ? 'paid' : 'pending' as 'paid' | 'pending',
          reference: entry.reference,
          notes: null,
          warehouse_id: entry.warehouse_id,
          warehouse_name: entry.warehouses?.name,
          journal_entry_id: entry.id,
          created_at: entry.created_at,
          updated_at: entry.updated_at
        };
      });

      setExpenses(expenseRecords);

      // Calculate metrics
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const thisMonthExpenses = expenseRecords.filter(exp => {
        const expDate = new Date(exp.entry_date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      });

      const lastMonthExpenses = expenseRecords.filter(exp => {
        const expDate = new Date(exp.entry_date);
        return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear;
      });

      const totalThisMonth = thisMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalLastMonth = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const lastMonthChange = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0;

      const totalUnpaid = expenseRecords
        .filter(exp => exp.status === 'pending')
        .reduce((sum, exp) => sum + exp.amount, 0);

      // Categories breakdown
      const categoriesBreakdown = expenseRecords.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);

      const totalExpenseAmount = Object.values(categoriesBreakdown).reduce((sum, amount) => sum + amount, 0);
      
      const topCategories = Object.entries(categoriesBreakdown)
        .map(([name, amount]) => ({
          name,
          amount,
          percentage: totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Top vendor
      const vendorTotals = expenseRecords.reduce((acc, exp) => {
        if (exp.vendor) {
          acc[exp.vendor] = (acc[exp.vendor] || 0) + exp.amount;
        }
        return acc;
      }, {} as Record<string, number>);

      const topVendorEntry = Object.entries(vendorTotals)
        .sort(([,a], [,b]) => b - a)[0];
      
      const topVendor = topVendorEntry ? {
        name: topVendorEntry[0],
        amount: topVendorEntry[1]
      } : null;

      // Recurring expenses (simplified calculation)
      const recurringExpenses = thisMonthExpenses
        .filter(exp => exp.description.toLowerCase().includes('monthly') || 
                      exp.description.toLowerCase().includes('recurring') ||
                      exp.category === 'Rent & Facilities')
        .reduce((sum, exp) => sum + exp.amount, 0);

      setMetrics({
        totalThisMonth,
        lastMonthChange,
        totalUnpaid,
        topCategories,
        topVendor,
        recurringExpenses,
        categoriesBreakdown
      });

    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createExpense = async (expenseData: {
    description: string;
    vendor: string;
    category: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    notes?: string;
  }) => {
    if (!user) return { success: false, error: 'No user authenticated' };

    try {
      // Create journal entry for the expense
      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: `EXP-${Date.now()}`,
          entry_date: expenseData.payment_date,
          description: `${expenseData.description} - ${expenseData.vendor}`,
          total_amount: expenseData.amount,
          status: 'posted',
          user_id: user.id,
          created_by: user.id,
          reference: `Vendor: ${expenseData.vendor} | Method: ${expenseData.payment_method}`,
          warehouse_id: selectedWarehouse,
        })
        .select()
        .single();

      if (journalError) {
        return { success: false, error: journalError.message };
      }

      // Get appropriate expense account for the category
      const { data: expenseAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('account_code', '5000') // General expense account
        .limit(1)
        .single();

      // Get cash/bank account
      const { data: cashAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('account_code', '1000') // Cash account
        .limit(1)
        .single();

      // Create journal entry lines if accounts exist
      if (expenseAccount && cashAccount && journalEntry) {
        await supabase
          .from('journal_entry_lines')
          .insert([
            {
              journal_entry_id: journalEntry.id,
              account_id: expenseAccount.id,
              line_number: 1,
              description: expenseData.description,
              debit_amount: expenseData.amount,
              credit_amount: 0
            },
            {
              journal_entry_id: journalEntry.id,
              account_id: cashAccount.id,
              line_number: 2,
              description: `Payment to ${expenseData.vendor}`,
              debit_amount: 0,
              credit_amount: expenseData.amount
            }
          ]);
      }

      // Refresh data
      await fetchExpenses();
      return { success: true };

    } catch (error) {
      console.error('Error creating expense:', error);
      return { success: false, error: 'Failed to create expense' };
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedWarehouse, user]);

  return {
    expenses,
    metrics,
    isLoading,
    createExpense,
    refetch: fetchExpenses
  };
};