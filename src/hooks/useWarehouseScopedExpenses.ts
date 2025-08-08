
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  date: string;
  warehouse_name?: string;
  warehouse_id?: string;
}

export const useWarehouseScopedExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedWarehouse } = useWarehouse();
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { userRoles } = useUserPermissions();

  const isAdmin = userRoles.some(role => role.role === 'admin');

  const fetchExpenses = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching expenses for warehouse:', selectedWarehouse || 'all warehouses');
      
      const currentEmployee = employees.find(emp => emp.user_id_auth === user.id);
      const isAssignedEmployee = currentEmployee?.assigned_warehouse_id; // Prioritize warehouse assignment over admin status

      // Fetch from billing_transactions table for expense data
      let query = supabase
        .from('billing_transactions')
        .select(`
          *,
          warehouses (
            name,
            code
          )
        `)
        .eq('transaction_type', 'expense')
        .order('created_at', { ascending: false });
      
      // Apply warehouse-aware filtering logic
      if (isAssignedEmployee) {
        // Assigned employee sees ALL expenses for their warehouse
        query = query.eq('warehouse_id', currentEmployee.assigned_warehouse_id);
      } else if (isAdmin && selectedWarehouse) {
        // Admin with warehouse selected - show all expenses for that warehouse
        query = query.eq('warehouse_id', selectedWarehouse);
      } else if (isAdmin && !selectedWarehouse) {
        // Admin with "All Warehouses" - show all user's expenses
        query = query.eq('user_id', user.id);
      } else {
        // Unassigned employee - show only their own expenses
        query = query.eq('user_id', user.id);
        if (selectedWarehouse) {
          query = query.eq('warehouse_id', selectedWarehouse);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching expenses:', error);
        return;
      }
      
      // Transform the data to match Expense interface
      const transformedData: Expense[] = (data || []).map(item => ({
        id: item.id,
        description: item.description || `${item.transaction_type} transaction`,
        amount: item.total_amount || 0,
        category: item.description?.includes('salary') ? 'Salaries & Wages' :
                 item.description?.includes('rent') ? 'Rent & Utilities' :
                 item.description?.includes('marketing') ? 'Marketing & Advertising' :
                 item.description?.includes('office') ? 'Office Supplies' :
                 item.description?.includes('travel') ? 'Travel' :
                 item.description?.includes('meal') ? 'Meals & Entertainment' :
                 item.description?.includes('equipment') ? 'Equipment' :
                 'Other Expenses',
        status: 'approved', // Default status for billing transactions
        date: new Date(item.transaction_date).toLocaleDateString(),
        warehouse_name: item.warehouses?.name,
        warehouse_id: item.warehouse_id
      }));
      
      setExpenses(transformedData);
    } catch (error) {
      console.error('Exception fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedWarehouse, user]);

  // Calculate summary data
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = expenses
    .filter(expense => expense.status === 'pending')
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    expenses,
    totalExpenses,
    pendingExpenses,
    expensesByCategory,
    isLoading,
    refetch: fetchExpenses
  };
};
