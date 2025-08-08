
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedFinancialData } from './useEnhancedFinancialData';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  journalEntriesCount: number;
  accountsCount: number;
  warehouseBreakdown: {
    warehouse_id: string;
    warehouse_name: string;
    revenue: number;
    expenses: number;
  }[];
}

export const useWarehouseScopedFinancialData = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    journalEntriesCount: 0,
    accountsCount: 0,
    warehouseBreakdown: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { selectedWarehouse, canViewAllWarehouses, warehouses } = useWarehouse();
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { userRoles } = useUserPermissions();

  const isAdmin = userRoles.some(role => role.role === 'admin');
  const currentEmployee = employees.find(emp => emp.user_id_auth === user?.id);
  const isAssignedEmployee = currentEmployee?.assigned_warehouse_id; // Prioritize warehouse assignment over admin status
  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;

  const fetchFinancialData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get user's company ID for corporate overview filtering
      const { data: userCompany } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!userCompany) {
        console.error('User not assigned to any company');
        setIsLoading(false);
        return;
      }

      // Calculate real revenue from completed orders and invoices
      let totalRevenue = 0;
      let totalExpenses = 0;
      const warehouseBreakdown: Record<string, {
        warehouse_id: string;
        warehouse_name: string;
        revenue: number;
        expenses: number;
      }> = {};

      // Get revenue from paid invoices (most accurate source)
      let invoiceQuery = supabase
        .from('invoices')
        .select(`
          total_amount,
          warehouse_id,
          warehouses (
            name,
            company_id
          )
        `)
        .eq('status', 'paid');

      // Apply warehouse-aware filtering logic
      if (isAssignedEmployee) {
        // Assigned employee sees ALL invoices for their warehouse
        invoiceQuery = invoiceQuery.eq('warehouse_id', currentEmployee.assigned_warehouse_id);
      } else if (isAdmin && isInCorporateOverview) {
        // Admin with corporate overview - get all invoices from warehouses in user's company
        const { data: companyWarehouses } = await supabase
          .from('warehouses')
          .select('id')
          .eq('company_id', userCompany.company_id);
        
        if (companyWarehouses && companyWarehouses.length > 0) {
          const warehouseIds = companyWarehouses.map(w => w.id);
          invoiceQuery = invoiceQuery.in('warehouse_id', warehouseIds);
        }
        invoiceQuery = invoiceQuery.eq('user_id', user.id);
      } else if (isAdmin && selectedWarehouse) {
        // Admin with warehouse selected - show all invoices for that warehouse
        invoiceQuery = invoiceQuery.eq('warehouse_id', selectedWarehouse);
      } else {
        // Unassigned employee - show only their own invoices
        invoiceQuery = invoiceQuery.eq('user_id', user.id);
        if (selectedWarehouse) {
          invoiceQuery = invoiceQuery.eq('warehouse_id', selectedWarehouse);
        }
      }

      const { data: invoices } = await invoiceQuery;

      // Calculate revenue from invoices
      invoices?.forEach(invoice => {
        totalRevenue += invoice.total_amount;
        
        const warehouseId = invoice.warehouse_id || 'unassigned';
        const warehouseName = invoice.warehouses?.name || 'Unassigned';
        
        if (!warehouseBreakdown[warehouseId]) {
          warehouseBreakdown[warehouseId] = {
            warehouse_id: warehouseId,
            warehouse_name: warehouseName,
            revenue: 0,
            expenses: 0
          };
        }
        warehouseBreakdown[warehouseId].revenue += invoice.total_amount;
      });

      // Get real expenses from journal entries
      let expenseQuery = supabase
        .from('journal_entries')
        .select(`
          total_amount,
          warehouse_id,
          description,
          reference,
          warehouses (
            name,
            company_id
          )
        `)
        .eq('status', 'posted');

      // Apply warehouse-aware filtering logic
      if (isAssignedEmployee) {
        // Assigned employee sees ALL journal entries for their warehouse
        expenseQuery = expenseQuery.eq('warehouse_id', currentEmployee.assigned_warehouse_id);
      } else if (isAdmin && isInCorporateOverview) {
        // Admin with corporate overview - filter by company warehouses
        const { data: companyWarehouses } = await supabase
          .from('warehouses')
          .select('id')
          .eq('company_id', userCompany.company_id);
        
        if (companyWarehouses && companyWarehouses.length > 0) {
          const warehouseIds = companyWarehouses.map(w => w.id);
          expenseQuery = expenseQuery.in('warehouse_id', warehouseIds);
        }
        expenseQuery = expenseQuery.eq('user_id', user.id);
      } else if (isAdmin && selectedWarehouse) {
        // Admin with warehouse selected - show all entries for that warehouse
        expenseQuery = expenseQuery.eq('warehouse_id', selectedWarehouse);
      } else {
        // Unassigned employee - show only their own entries
        expenseQuery = expenseQuery.eq('user_id', user.id);
        if (selectedWarehouse) {
          expenseQuery = expenseQuery.eq('warehouse_id', selectedWarehouse);
        }
      }

      const { data: journalEntries } = await expenseQuery;

      // Calculate expenses from journal entries (exclude revenue entries)
      journalEntries?.forEach(entry => {
        const isRevenue = entry.reference?.toLowerCase().includes('revenue') || 
                         entry.description?.toLowerCase().includes('revenue') ||
                         entry.reference?.toLowerCase().includes('order');
        
        if (!isRevenue) {
          totalExpenses += entry.total_amount;
          
          const warehouseId = entry.warehouse_id || 'unassigned';
          const warehouseName = entry.warehouses?.name || 'Unassigned';
          
          if (!warehouseBreakdown[warehouseId]) {
            warehouseBreakdown[warehouseId] = {
              warehouse_id: warehouseId,
              warehouse_name: warehouseName,
              revenue: 0,
              expenses: 0
            };
          }
          warehouseBreakdown[warehouseId].expenses += entry.total_amount;
        }
      });

      // Get accounts count
      let accountsQuery = supabase
        .from('accounts')
        .select('id, warehouse_id');

      // Apply warehouse-aware filtering logic
      if (isAssignedEmployee) {
        // Assigned employee sees ALL accounts for their warehouse
        accountsQuery = accountsQuery.eq('warehouse_id', currentEmployee.assigned_warehouse_id);
      } else if (isAdmin && isInCorporateOverview) {
        // Admin with corporate overview - get all accounts from company warehouses
        const { data: companyWarehouses } = await supabase
          .from('warehouses')
          .select('id')
          .eq('company_id', userCompany.company_id);
        
        if (companyWarehouses && companyWarehouses.length > 0) {
          const warehouseIds = companyWarehouses.map(w => w.id);
          accountsQuery = accountsQuery.in('warehouse_id', warehouseIds);
        }
        accountsQuery = accountsQuery.eq('user_id', user.id);
      } else if (isAdmin && selectedWarehouse) {
        // Admin with warehouse selected - show all accounts for that warehouse
        accountsQuery = accountsQuery.eq('warehouse_id', selectedWarehouse);
      } else {
        // Unassigned employee - show only their own accounts
        accountsQuery = accountsQuery.eq('user_id', user.id);
        if (selectedWarehouse) {
          accountsQuery = accountsQuery.eq('warehouse_id', selectedWarehouse);
        }
      }

      const { data: accounts } = await accountsQuery;

      // Filter warehouse breakdown to only include company warehouses
      const filteredBreakdown = Object.values(warehouseBreakdown).filter(warehouse => {
        if (isInCorporateOverview) {
          // Only include warehouses from user's company
          return warehouses.some(w => w.warehouse_id === warehouse.warehouse_id);
        }
        return true;
      });

      setMetrics({
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        journalEntriesCount: journalEntries?.length || 0,
        accountsCount: accounts?.length || 0,
        warehouseBreakdown: filteredBreakdown
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [selectedWarehouse, user, isInCorporateOverview]);

  return {
    metrics,
    isLoading,
    isInCorporateOverview,
    refetch: fetchFinancialData
  };
};
