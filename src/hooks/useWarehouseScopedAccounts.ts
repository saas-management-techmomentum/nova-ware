
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface AccountType {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type_id: string;
  description?: string;
  current_balance: number;
  opening_balance: number;
  user_id: string;
  warehouse_id?: string;
  warehouse_name?: string;
  account_type?: AccountType;
}

export const useWarehouseScopedAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedWarehouse, canViewAllWarehouses } = useWarehouse();
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { userRoles } = useUserPermissions();

  const isAdmin = userRoles.some(role => role.role === 'admin');

  // Calculate real-time account balances from journal entries
  const calculateAccountBalances = async (accountsData: Account[]) => {
    if (!user || accountsData.length === 0) return accountsData;

    try {
      // Get all journal entry lines for these accounts
      let query = supabase
        .from('journal_entry_lines')
        .select(`
          account_id,
          debit_amount,
          credit_amount,
          journal_entries!inner(
            user_id,
            warehouse_id,
            status
          )
        `)
        .eq('journal_entries.user_id', user.id)
        .eq('journal_entries.status', 'posted')
        .in('account_id', accountsData.map(acc => acc.id));

      // Apply warehouse filter if needed
      if (selectedWarehouse) {
        query = query.eq('journal_entries.warehouse_id', selectedWarehouse);
      } else if (!canViewAllWarehouses) {
        return accountsData; // Return original data if no access
      }

      const { data: journalLines, error } = await query;

      if (error) {
        console.error('Error calculating account balances:', error);
        return accountsData; // Return original data on error
      }

      // Calculate balances for each account
      const balanceMap: Record<string, number> = {};
      
      journalLines?.forEach((line: any) => {
        if (!balanceMap[line.account_id]) {
          balanceMap[line.account_id] = 0;
        }
        // For accounting equation: Debits increase assets/expenses, Credits increase liabilities/equity/revenue
        balanceMap[line.account_id] += (line.debit_amount || 0) - (line.credit_amount || 0);
      });

      // Update accounts with calculated balances
      return accountsData.map(account => ({
        ...account,
        current_balance: balanceMap[account.id] || account.opening_balance || 0
      }));

    } catch (error) {
      console.error('Error calculating account balances:', error);
      return accountsData; // Return original data on error
    }
  };

  const fetchAccountTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('account_types')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setAccountTypes(data || []);
    } catch (error) {
      console.error('Error fetching account types:', error);
      toast({
        title: 'Error fetching account types',
        description: 'Could not load account types',
        variant: 'destructive',
      });
    }
  };

  const fetchAccounts = async () => {
    if (!user) {
      setAccounts([]);
      return;
    }

    try {
      const currentEmployee = employees.find(emp => emp.user_id_auth === user.id);
      const isAssignedEmployee = currentEmployee?.assigned_warehouse_id; // Prioritize warehouse assignment over admin status

      let query = supabase
        .from('accounts')
        .select(`
          *,
          account_type:account_types(*)
        `)
        .eq('is_active', true)
        .order('account_code', { ascending: true });

      // Apply warehouse-aware filtering logic
      if (isAssignedEmployee) {
        // Assigned employee sees ALL accounts for their warehouse
        query = query.eq('warehouse_id', currentEmployee.assigned_warehouse_id);
      } else if (isAdmin && selectedWarehouse) {
        // Admin with warehouse selected - show all accounts for that warehouse
        query = query.eq('warehouse_id', selectedWarehouse);
      } else if (isAdmin && !selectedWarehouse && canViewAllWarehouses) {
        // Admin with "All Warehouses" - show all their accounts
        query = query.eq('user_id', user.id);
      } else {
        // Unassigned employee - show only their own accounts
        query = query.eq('user_id', user.id);
        if (selectedWarehouse) {
          query = query.eq('warehouse_id', selectedWarehouse);
        } else if (!canViewAllWarehouses) {
          setAccounts([]);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // If in Corporate Overview mode, add warehouse names to accounts
      let enhancedAccounts = data || [];
      if (!selectedWarehouse && canViewAllWarehouses) {
        // Fetch warehouse names for all accounts
        const warehouseIds = [...new Set(enhancedAccounts.map(acc => acc.warehouse_id).filter(Boolean))];
        
        if (warehouseIds.length > 0) {
          const { data: warehouses, error: warehouseError } = await supabase
            .from('warehouses')
            .select('id, name')
            .in('id', warehouseIds);

          if (!warehouseError && warehouses) {
            const warehouseMap = warehouses.reduce((map, wh) => {
              map[wh.id] = wh.name;
              return map;
            }, {} as Record<string, string>);

            enhancedAccounts = enhancedAccounts.map(account => ({
              ...account,
              warehouse_name: account.warehouse_id ? warehouseMap[account.warehouse_id] : 'Unassigned'
            }));
          }
        }
      }

      // Calculate real-time balances
      const accountsWithBalances = await calculateAccountBalances(enhancedAccounts);
      setAccounts(accountsWithBalances);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error fetching accounts',
        description: 'Could not load chart of accounts',
        variant: 'destructive',
      });
    }
  };

  const refetch = async () => {
    setIsLoading(true);
    await Promise.all([fetchAccountTypes(), fetchAccounts()]);
    setIsLoading(false);
  };

  useEffect(() => {
    refetch();
  }, [selectedWarehouse, user]);

  const createAccount = async (accountData: any) => {
    if (!user || !selectedWarehouse) {
      toast({
        title: 'Error creating account',
        description: 'No warehouse selected',
        variant: 'destructive',
      });
      throw new Error('No warehouse selected');
    }

    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          ...accountData,
          user_id: user.id,
          warehouse_id: selectedWarehouse
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Account created',
        description: 'New account has been added to your chart of accounts',
      });

      return data;
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: 'Error creating account',
        description: 'Could not create new account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateAccount = async (accountId: string, accountData: any) => {
    if (!selectedWarehouse) {
      toast({
        title: 'Error updating account',
        description: 'No warehouse selected',
        variant: 'destructive',
      });
      throw new Error('No warehouse selected');
    }

    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          ...accountData,
          warehouse_id: selectedWarehouse
        })
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Account updated',
        description: 'Account has been successfully updated',
      });

      return data;
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: 'Error updating account',
        description: 'Could not update account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!selectedWarehouse) {
      toast({
        title: 'Error deleting account',
        description: 'No warehouse selected',
        variant: 'destructive',
      });
      throw new Error('No warehouse selected');
    }

    try {
      // Check if account has any journal entry lines (transactions)
      const { data: journalLines, error: checkError } = await supabase
        .from('journal_entry_lines')
        .select('id')
        .eq('account_id', accountId)
        .limit(1);

      if (checkError) throw checkError;

      if (journalLines && journalLines.length > 0) {
        // Instead of deleting, deactivate the account
        const { error: deactivateError } = await supabase
          .from('accounts')
          .update({ is_active: false })
          .eq('id', accountId);

        if (deactivateError) throw deactivateError;

        toast({
          title: 'Account deactivated',
          description: 'Account has transactions and was deactivated instead of deleted',
        });
      } else {
        // Safe to delete - no transactions
        const { error: deleteError } = await supabase
          .from('accounts')
          .delete()
          .eq('id', accountId);

        if (deleteError) throw deleteError;

        toast({
          title: 'Account deleted',
          description: 'Account has been successfully deleted',
        });
      }

      await refetch();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error deleting account',
        description: 'Could not delete account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    accounts,
    accountTypes,
    isLoading,
    refetch,
    createAccount,
    updateAccount,
    deleteAccount,
    selectedWarehouse,
  };
};
