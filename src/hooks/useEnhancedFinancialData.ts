import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedFinancialMetrics {
  // Revenue & P&L
  totalRevenue: number;
  monthlyRevenue: number;
  totalExpenses: number;
  monthlyExpenses: number;
  netIncome: number;
  monthlyNetIncome: number;
  grossMargin: number;
  
  // Balance Sheet Items
  accountsReceivable: number;
  accountsPayable: number;
  cashBalance: number;
  inventoryValue: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  
  // AR/AP Details
  currentAR: number;
  overdueAR: number;
  arTurnover: number;
  avgCollectionDays: number;
  currentAP: number;
  overdueAP: number;
  apTurnover: number;
  
  // Invoice & Payment Stats
  outstandingInvoices: number;
  overdueInvoices: number;
  paidInvoicesThisMonth: number;
  totalInvoicesThisMonth: number;
  averageInvoiceAmount: number;
  
  // Inventory & COGS
  totalCOGS: number;
  monthlyCOGS: number;
  inventoryTurnover: number;
  daysInInventory: number;
  
  // Cash Flow
  operatingCashFlow: number;
  freeCashFlow: number;
  
  // Trend Data
  revenueGrowth: number;
  expenseGrowth: number;
  profitMarginTrend: number;
  
  // Recent Activity
  recentTransactions: any[];
  recentInvoices: any[];
  recentPayments: any[];
  
  // Warehouse breakdown (for corporate overview)
  warehouseBreakdown: {
    warehouse_id: string;
    warehouse_name: string;
    revenue: number;
    expenses: number;
    netIncome: number;
    inventoryValue: number;
  }[];
  
  // Last updated
  lastUpdated: string;
}

export const useEnhancedFinancialData = () => {
  const { user } = useAuth();
  const { selectedWarehouse, canViewAllWarehouses } = useWarehouse();
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState<EnhancedFinancialMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalExpenses: 0,
    monthlyExpenses: 0,
    netIncome: 0,
    monthlyNetIncome: 0,
    grossMargin: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    cashBalance: 0,
    inventoryValue: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    equity: 0,
    currentAR: 0,
    overdueAR: 0,
    arTurnover: 0,
    avgCollectionDays: 0,
    currentAP: 0,
    overdueAP: 0,
    apTurnover: 0,
    outstandingInvoices: 0,
    overdueInvoices: 0,
    paidInvoicesThisMonth: 0,
    totalInvoicesThisMonth: 0,
    averageInvoiceAmount: 0,
    totalCOGS: 0,
    monthlyCOGS: 0,
    inventoryTurnover: 0,
    daysInInventory: 0,
    operatingCashFlow: 0,
    freeCashFlow: 0,
    revenueGrowth: 0,
    expenseGrowth: 0,
    profitMarginTrend: 0,
    recentTransactions: [],
    recentInvoices: [],
    recentPayments: [],
    warehouseBreakdown: [],
    lastUpdated: new Date().toISOString()
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;

  const fetchEnhancedFinancialData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const currentDate = new Date();
      const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

      // Base filters for warehouse scoping
      const warehouseFilter = selectedWarehouse ? { eq: selectedWarehouse } : null;

      // 1. REVENUE DATA - RLS now handles user/warehouse access
      let revenueQuery = supabase
        .from('invoices')
        .select('total_amount, status, created_at, invoice_date, due_date, client_name, warehouse_id');

      if (warehouseFilter && !isInCorporateOverview) {
        revenueQuery = revenueQuery.eq('warehouse_id', warehouseFilter.eq);
      }

      const { data: allInvoices } = await revenueQuery;

      const paidInvoices = allInvoices?.filter(inv => inv.status === 'paid') || [];
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      
      const monthlyPaidInvoices = paidInvoices.filter(inv => 
        new Date(inv.invoice_date) >= currentMonth
      );
      const monthlyRevenue = monthlyPaidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

      const previousMonthPaidInvoices = paidInvoices.filter(inv => {
        const invDate = new Date(inv.invoice_date);
        return invDate >= previousMonth && invDate <= previousMonthEnd;
      });
      const previousMonthRevenue = previousMonthPaidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

      // 2. AR DATA
      const outstandingInvoices = allInvoices?.filter(inv => 
        ['sent', 'approved', 'overdue'].includes(inv.status)
      ) || [];
      
      const accountsReceivable = outstandingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      
      const overdueInvoices = outstandingInvoices.filter(inv => {
        const dueDate = new Date(inv.due_date);
        return dueDate < currentDate;
      });
      const overdueAR = overdueInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const currentAR = accountsReceivable - overdueAR;

      // 3. EXPENSE DATA - DISABLED (journal_entries lacks total_amount column)
      const totalExpenses = 0;
      const monthlyExpenses = 0;
      const previousMonthExpenses = 0;

      // 4. CASH & BANK DATA - RLS handles access  
      let bankQuery = supabase
        .from('bank_accounts')
        .select('current_balance, account_type');

      const { data: bankAccounts } = await bankQuery;
      const cashBalance = bankAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;

      // 5. INVENTORY DATA - RLS handles access
      let inventoryQuery = supabase
        .from('products')
        .select('id, quantity, cost_price, unit_price, warehouse_id');

      if (warehouseFilter && !isInCorporateOverview) {
        inventoryQuery = inventoryQuery.eq('warehouse_id', warehouseFilter.eq);
      }

      const { data: inventory } = await inventoryQuery;
      const inventoryValue = inventory?.reduce((sum, item) => 
        sum + (item.quantity * (item.cost_price || 0)), 0) || 0;

      // 6. COGS CALCULATION (from inventory transactions) - RLS handles access
      let cogsQuery = supabase
        .from('inventory_history')
        .select('quantity, product_id, created_at, warehouse_id')
        .eq('transaction_type', 'outgoing');

      if (warehouseFilter && !isInCorporateOverview) {
        cogsQuery = cogsQuery.eq('warehouse_id', warehouseFilter.eq);
      }

      const { data: outgoingInventory } = await cogsQuery;
      
      // Calculate COGS by matching with product cost prices
      let totalCOGS = 0;
      let monthlyCOGS = 0;
      
      if (outgoingInventory && inventory) {
        for (const transaction of outgoingInventory) {
          const product = inventory.find((p: any) => p.id === transaction.product_id);
          if (product) {
            const cogsAmount = Math.abs(transaction.quantity) * (product.cost_price || 0);
            totalCOGS += cogsAmount;
            
            if (new Date(transaction.created_at) >= currentMonth) {
              monthlyCOGS += cogsAmount;
            }
          }
        }
      }

      // 7. ACCOUNTS DATA (for balance sheet) - RLS handles access
      let accountsQuery = supabase
        .from('accounts')
        .select('current_balance, account_type:account_types(category), warehouse_id')
        .eq('is_active', true);

      if (warehouseFilter && !isInCorporateOverview) {
        accountsQuery = accountsQuery.eq('warehouse_id', warehouseFilter.eq);
      }

      const { data: accounts } = await accountsQuery;
      
      const assetAccounts = accounts?.filter(acc => acc.account_type?.category === 'assets') || [];
      const liabilityAccounts = accounts?.filter(acc => acc.account_type?.category === 'liabilities') || [];
      const equityAccounts = accounts?.filter(acc => acc.account_type?.category === 'equity') || [];
      
      const totalAssets = assetAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) + inventoryValue + cashBalance;
      const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
      const equity = equityAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

      // 8. RECENT ACTIVITY - RLS handles access
      let recentTransactionsQuery = supabase
        .from('journal_entries')
        .select('id, entry_number, description, total_amount, entry_date, status, warehouse_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (warehouseFilter && !isInCorporateOverview) {
        recentTransactionsQuery = recentTransactionsQuery.eq('warehouse_id', warehouseFilter.eq);
      }

      const { data: recentTransactions } = await recentTransactionsQuery;

      const recentInvoices = allInvoices?.slice(0, 10) || [];

      // 9. WAREHOUSE BREAKDOWN (for corporate overview)
      let warehouseBreakdown: any[] = [];
      if (isInCorporateOverview) {
        const { data: warehouses } = await supabase
          .from('warehouses')
          .select('id, name')
          .eq('is_active', true);

        if (warehouses) {
          warehouseBreakdown = await Promise.all(
            warehouses.map(async (warehouse) => {
              const whRevenue = paidInvoices
                .filter(inv => inv.warehouse_id === warehouse.id)
                .reduce((sum, inv) => sum + inv.total_amount, 0);
              
              // COMMENTED OUT: allExpenses references missing total_amount column
              const whExpenses = 0;
              
              const whInventoryValue = inventory
                ?.filter(item => item.warehouse_id === warehouse.id)
                .reduce((sum, item) => sum + (item.quantity * (item.cost_price || 0)), 0) || 0;

              return {
                warehouse_id: warehouse.id,
                warehouse_name: warehouse.name,
                revenue: whRevenue,
                expenses: whExpenses,
                netIncome: whRevenue - whExpenses,
                inventoryValue: whInventoryValue
              };
            })
          );
        }
      }

      // 10. CALCULATE DERIVED METRICS
      const netIncome = totalRevenue - totalExpenses;
      const monthlyNetIncome = monthlyRevenue - monthlyExpenses;
      const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0;
      
      const revenueGrowth = previousMonthRevenue > 0 ? 
        ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;
      
      const expenseGrowth = previousMonthExpenses > 0 ? 
        ((monthlyExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 : 0;

      const averageInvoiceAmount = allInvoices?.length > 0 ? 
        totalRevenue / allInvoices.length : 0;

      const inventoryTurnover = inventoryValue > 0 ? totalCOGS / inventoryValue : 0;
      const daysInInventory = inventoryTurnover > 0 ? 365 / inventoryTurnover : 0;

      // Set the enhanced metrics
      setMetrics({
        totalRevenue,
        monthlyRevenue,
        totalExpenses,
        monthlyExpenses,
        netIncome,
        monthlyNetIncome,
        grossMargin,
        accountsReceivable,
        accountsPayable: 0, // Will be calculated from AP module
        cashBalance,
        inventoryValue,
        totalAssets,
        totalLiabilities,
        equity,
        currentAR,
        overdueAR,
        arTurnover: 0,
        avgCollectionDays: 0,
        currentAP: 0,
        overdueAP: 0,
        apTurnover: 0,
        outstandingInvoices: outstandingInvoices.length,
        overdueInvoices: overdueInvoices.length,
        paidInvoicesThisMonth: monthlyPaidInvoices.length,
        totalInvoicesThisMonth: allInvoices?.filter(inv => 
          new Date(inv.created_at) >= currentMonth
        ).length || 0,
        averageInvoiceAmount,
        totalCOGS,
        monthlyCOGS,
        inventoryTurnover,
        daysInInventory,
        operatingCashFlow: monthlyRevenue - monthlyExpenses,
        freeCashFlow: monthlyRevenue - monthlyExpenses,
        revenueGrowth,
        expenseGrowth,
        profitMarginTrend: 0,
        recentTransactions: recentTransactions || [],
        recentInvoices,
        recentPayments: [],
        warehouseBreakdown,
        lastUpdated: new Date().toISOString()
      });

      console.log('Enhanced financial data updated:', {
        totalRevenue,
        totalExpenses,
        netIncome,
        warehouse: selectedWarehouse || 'All',
        isCorpOverview: isInCorporateOverview
      });

    } catch (error) {
      console.error('Error fetching enhanced financial data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch financial data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedWarehouse, canViewAllWarehouses, isInCorporateOverview, toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channels: any[] = [];

    // Subscribe to relevant table changes - RLS filters data automatically
    const tables = ['invoices', 'journal_entries', 'products', 'accounts', 'inventory_history'];
    
    tables.forEach(tableName => {
      const channel = supabase
        .channel(`${tableName}-enhanced-realtime`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: tableName
        }, (payload) => {
          console.log(`${tableName} change detected:`, payload);
          fetchEnhancedFinancialData();
        })
        .subscribe();
      
      channels.push(channel);
    });

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, fetchEnhancedFinancialData]);

  // Initial fetch and warehouse change effect
  useEffect(() => {
    fetchEnhancedFinancialData();
  }, [fetchEnhancedFinancialData]);

  return {
    metrics,
    isLoading,
    refetch: fetchEnhancedFinancialData,
    isInCorporateOverview
  };
};