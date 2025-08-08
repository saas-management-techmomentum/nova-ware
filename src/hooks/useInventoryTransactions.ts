
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { toast } from '@/hooks/use-toast';

export interface InventoryTransaction {
  id: string;
  product_id: string;
  transaction_type: string;
  quantity: number;
  reference?: string;
  notes?: string;
  created_at: string;
  company_id?: string;
  user_id: string;
  remaining_stock: number;
  products?: {
    name: string;
    sku: string;
  };
}

export const useInventoryTransactions = () => {
  const { user } = useAuth();
  const { employees } = useEmployees();
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get employee info to check for warehouse assignment
      const { data: employees } = await supabase
        .from('employees')
        .select('assigned_warehouse_id')
        .eq('user_id_auth', user.id)
        .maybeSingle();

      const { data: userRoles } = await supabase
        .from('company_users')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(role => role.role === 'admin') || false;
      const isAssignedEmployee = employees?.assigned_warehouse_id; // Prioritize warehouse assignment over admin status

      let query = supabase
        .from('inventory_history')
        .select(`
          *,
          products (
            name,
            sku
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filtering logic based on user type
      if (isAssignedEmployee) {
        // Warehouse-assigned employees see ALL transactions for their assigned warehouse
        query = query.eq('warehouse_id', employees.assigned_warehouse_id);
      } else {
        // Unassigned employees and admins see only their own transactions
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching inventory transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<InventoryTransaction, 'id' | 'created_at' | 'company_id' | 'user_id' | 'remaining_stock'>) => {
    if (!user?.id) return;

    try {
      // Get current product stock to calculate remaining stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', transaction.product_id)
        .eq('user_id', user.id)
        .single();

      if (productError) throw productError;

      const remainingStock = transaction.transaction_type === 'incoming' 
        ? product.quantity + transaction.quantity
        : product.quantity - transaction.quantity;

      const { data, error } = await supabase
        .from('inventory_history')
        .insert({
          ...transaction,
          user_id: user.id,
          remaining_stock: remainingStock
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the transactions list
      await fetchTransactions();
      
      toast({
        title: "Transaction Added",
        description: "Inventory transaction has been recorded",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding inventory transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add inventory transaction",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user && employees.length > 0) { // Wait for employees to load
      fetchTransactions();
    }
  }, [user, employees.length]);

  return {
    transactions,
    loading,
    fetchTransactions,
    addTransaction,
  };
};
