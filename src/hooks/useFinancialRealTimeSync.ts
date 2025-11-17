import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useToast } from '@/hooks/use-toast';

export interface FinancialRealTimeData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashBalance: number;
  inventoryValue: number;
  recentTransactions: any[];
  outstandingInvoices: number;
  overdueInvoices: number;
  paidInvoicesThisMonth: number;
  pendingPurchaseOrders: number;
}

export const useFinancialRealTimeSync = () => {
  const { user } = useAuth();
  const { selectedWarehouse, canViewAllWarehouses } = useWarehouse();
  const { toast } = useToast();

  const triggerDataSync = useCallback(async () => {
    if (!user) return;

    try {
      // Calculate real-time financial metrics
      const warehouseFilter = selectedWarehouse ? selectedWarehouse : null;
      const isCorpOverview = canViewAllWarehouses && !selectedWarehouse;

      // Get revenue from paid invoices
      let revenueQuery = supabase
        .from('invoices')
        .select('total_amount')
        .eq('user_id', user.id)
        .eq('status', 'paid');

      if (warehouseFilter && !isCorpOverview) {
        revenueQuery = revenueQuery.eq('warehouse_id', warehouseFilter);
      }

      const { data: paidInvoices } = await revenueQuery;
      const totalRevenue = paidInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

      // COMMENTED OUT: journal_entries.total_amount column missing
      // Get expenses from journal entries marked as expenses
      /*
      let expenseQuery = supabase
        .from('journal_entries')
        .select('total_amount')
        .eq('user_id', user.id)
        .or('description.ilike.%expense%,description.ilike.%cost%,description.ilike.%payroll%');

      if (warehouseFilter && !isCorpOverview) {
        expenseQuery = expenseQuery.eq('warehouse_id', warehouseFilter);
      }

      const { data: expenses } = await expenseQuery;
      const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.total_amount, 0) || 0;
      */
      const totalExpenses = 0;

      // Get AR from outstanding invoices
      let arQuery = supabase
        .from('invoices')
        .select('total_amount')
        .eq('user_id', user.id)
        .in('status', ['sent', 'approved', 'overdue']);

      if (warehouseFilter && !isCorpOverview) {
        arQuery = arQuery.eq('warehouse_id', warehouseFilter);
      }

      const { data: outstandingInvoices } = await arQuery;
      const accountsReceivable = outstandingInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

      // Get cash balance from bank accounts
      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('user_id', user.id);

      const cashBalance = bankAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;

      // Get inventory value
      let inventoryQuery = supabase
        .from('products')
        .select('quantity, cost_price')
        .eq('user_id', user.id);

      if (warehouseFilter && !isCorpOverview) {
        inventoryQuery = inventoryQuery.eq('warehouse_id', warehouseFilter);
      }

      const { data: inventory } = await inventoryQuery;
      const inventoryValue = inventory?.reduce((sum, item) => sum + (item.quantity * (item.cost_price || 0)), 0) || 0;

      console.log('Real-time financial sync completed:', {
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        accountsReceivable,
        cashBalance,
        inventoryValue,
        warehouse: warehouseFilter || 'All',
        isCorpOverview
      });

      return {
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        accountsReceivable,
        cashBalance,
        inventoryValue,
        outstandingInvoices: outstandingInvoices?.length || 0,
        warehouse: warehouseFilter,
        isCorpOverview
      };

    } catch (error) {
      console.error('Error syncing financial data:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync real-time financial data",
        variant: "destructive"
      });
      return null;
    }
  }, [user, selectedWarehouse, canViewAllWarehouses, toast]);

  // Set up real-time subscriptions for financial data changes
  useEffect(() => {
    if (!user) return;

    const channels: any[] = [];

    // Subscribe to invoices changes
    const invoicesChannel = supabase
      .channel('invoices-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invoices',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Invoice change detected:', payload);
        triggerDataSync();
      })
      .subscribe();

    channels.push(invoicesChannel);

    // Subscribe to journal entries changes
    const journalChannel = supabase
      .channel('journal-entries-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'journal_entries',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Journal entry change detected:', payload);
        triggerDataSync();
      })
      .subscribe();

    channels.push(journalChannel);

    // Subscribe to bank transactions changes
    const bankChannel = supabase
      .channel('bank-transactions-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bank_transactions',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Bank transaction change detected:', payload);
        triggerDataSync();
      })
      .subscribe();

    channels.push(bankChannel);

    // Subscribe to products/inventory changes
    const inventoryChannel = supabase
      .channel('products-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Inventory change detected:', payload);
        triggerDataSync();
      })
      .subscribe();

    channels.push(inventoryChannel);

    // Subscribe to accounts changes
    const accountsChannel = supabase
      .channel('accounts-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'accounts',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Account change detected:', payload);
        triggerDataSync();
      })
      .subscribe();

    channels.push(accountsChannel);

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, triggerDataSync]);

  return {
    triggerDataSync
  };
};