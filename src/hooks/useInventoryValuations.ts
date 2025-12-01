import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';

export interface InventoryValuationData {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  cost_price: number;
  unit_price: number;
  total_value: number;
  category: string | null;
  warehouse_id: string | null;
  last_updated: string;
  low_stock_threshold: number;
}

export interface CogsEntry {
  id: string;
  date: string;
  type: 'Sale' | 'Adjustment' | 'Damage' | 'Shrinkage';
  product_name: string;
  sku: string;
  quantity: number;
  unit_cost: number;
  total_cogs: number;
  reference: string | null;
  notes: string | null;
}

export interface InventoryAdjustment {
  id: string;
  product_id: string;
  quantity: number;
  adjustment_type: 'damage' | 'shrinkage' | 'writeoff' | 'correction';
  reason: string;
  total_value: number;
  created_at: string;
  reference: string;
}

export interface ValuationMetrics {
  totalInventoryValue: number;
  cogsThisMonth: number;
  adjustmentsMade: number;
  grossMargin: number;
  topProducts: Array<{
    name: string;
    value: number;
    sku: string;
  }>;
  valuationMethod: 'FIFO' | 'LIFO' | 'Weighted Average';
}

export const useInventoryValuations = () => {
  const [valuations, setValuations] = useState<InventoryValuationData[]>([]);
  const [cogsEntries, setCogsEntries] = useState<CogsEntry[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [metrics, setMetrics] = useState<ValuationMetrics>({
    totalInventoryValue: 0,
    cogsThisMonth: 0,
    adjustmentsMade: 0,
    grossMargin: 0,
    topProducts: [],
    valuationMethod: 'FIFO'
  });
  const [isLoading, setIsLoading] = useState(true);
  const { selectedWarehouse, companyId } = useWarehouse();
  const { user } = useAuth();

  const fetchInventoryValuations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch real inventory data with current values
      let query = supabase
        .from('products')
        .select(`
          id,
          sku,
          name,
          quantity,
          cost_price,
          unit_price,
          category,
          warehouse_id,
          updated_at,
          low_stock_threshold
        `)
        .eq('user_id', user.id)
        .order('name');

      if (selectedWarehouse) {
        query = query.eq('warehouse_id', selectedWarehouse);
      }

      const { data: products, error } = await query;

      if (error) {
        console.error('Error fetching inventory valuations:', error);
        return;
      }

      const valuationData: InventoryValuationData[] = (products || []).map(product => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        quantity: product.quantity || 0,
        cost_price: product.cost_price || 0,
        unit_price: product.unit_price || 0,
        total_value: (product.quantity || 0) * (product.cost_price || 0),
        category: product.category,
        warehouse_id: product.warehouse_id,
        last_updated: product.updated_at,
        low_stock_threshold: product.low_stock_threshold || 0
      }));

      setValuations(valuationData);

      // Calculate total inventory value
      const totalValue = valuationData.reduce((sum, item) => sum + item.total_value, 0);

      // Get top products by value
      const topProducts = valuationData
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, 5)
        .map(product => ({
          name: product.name,
          value: product.total_value,
          sku: product.sku
        }));

      setMetrics(prev => ({
        ...prev,
        totalInventoryValue: totalValue,
        topProducts
      }));

    } catch (error) {
      console.error('Error fetching inventory valuations:', error);
    }
  };

  const fetchCogsEntries = async () => {
    if (!user) return;

    try {
      // First get all cancelled invoice IDs to exclude their references
      const { data: cancelledInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'cancelled');

      const cancelledInvoiceIds = cancelledInvoices?.map(inv => inv.id) || [];

      // Fetch COGS from inventory history (real transactions)
      let historyQuery = supabase
        .from('inventory_history')
        .select(`
          id,
          created_at,
          quantity,
          transaction_type,
          reference,
          notes,
          products (
            name,
            sku,
            cost_price
          )
        `)
        .eq('user_id', user.id)
        .eq('transaction_type', 'outgoing')
        .order('created_at', { ascending: false })
        .limit(50);

      if (selectedWarehouse) {
        historyQuery = historyQuery.eq('warehouse_id', selectedWarehouse);
      }

      const { data: historyData, error: historyError } = await historyQuery;

      if (historyError) {
        console.error('Error fetching COGS entries:', historyError);
        return;
      }

      // Filter out entries that reference cancelled invoices
      const filteredHistoryData = (historyData || []).filter(entry => {
        if (!entry.reference) return true;
        
        // Check if this entry references a cancelled invoice
        for (const cancelledId of cancelledInvoiceIds) {
          if (entry.reference.includes(cancelledId)) {
            return false; // Exclude this entry
          }
        }
        return true;
      });

      const cogsData: CogsEntry[] = filteredHistoryData.map(entry => {
        const product = entry.products as any;
        const unitCost = product?.cost_price || 0;
        const quantity = Math.abs(entry.quantity); // Make positive for display
        
        return {
          id: entry.id,
          date: new Date(entry.created_at).toISOString().split('T')[0],
          type: entry.reference?.includes('Order') ? 'Sale' : 'Adjustment',
          product_name: product?.name || 'Unknown Product',
          sku: product?.sku || '',
          quantity: quantity,
          unit_cost: unitCost,
          total_cogs: quantity * unitCost,
          reference: entry.reference,
          notes: entry.notes
        };
      });

      setCogsEntries(cogsData);

      // Calculate COGS for this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyCogsTotal = cogsData
        .filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        })
        .reduce((sum, entry) => sum + entry.total_cogs, 0);

      setMetrics(prev => ({
        ...prev,
        cogsThisMonth: monthlyCogsTotal
      }));

    } catch (error) {
      console.error('Error fetching COGS entries:', error);
    }
  };

  const fetchAdjustments = async () => {
    if (!user) return;

    try {
      // Fetch inventory adjustments from inventory_history
      let adjustmentQuery = supabase
        .from('inventory_history')
        .select(`
          id,
          created_at,
          quantity,
          notes,
          reference,
          product_id,
          products (
            name,
            sku,
            cost_price
          )
        `)
        .eq('user_id', user.id)
        .or('notes.ilike.%damage%,notes.ilike.%shrinkage%,notes.ilike.%writeoff%,notes.ilike.%adjustment%')
        .order('created_at', { ascending: false })
        .limit(20);

      if (selectedWarehouse) {
        adjustmentQuery = adjustmentQuery.eq('warehouse_id', selectedWarehouse);
      }

      const { data: adjustmentData, error } = await adjustmentQuery;

      if (error) {
        console.error('Error fetching adjustments:', error);
        return;
      }

      const adjustmentsList: InventoryAdjustment[] = (adjustmentData || []).map(adj => {
        const product = adj.products as any;
        const unitCost = product?.cost_price || 0;
        const adjustmentType = 
          adj.notes?.toLowerCase().includes('damage') ? 'damage' :
          adj.notes?.toLowerCase().includes('shrinkage') ? 'shrinkage' :
          adj.notes?.toLowerCase().includes('writeoff') ? 'writeoff' : 'correction';

        return {
          id: adj.id,
          product_id: adj.product_id,
          quantity: Math.abs(adj.quantity),
          adjustment_type: adjustmentType,
          reason: adj.notes || 'No reason provided',
          total_value: Math.abs(adj.quantity) * unitCost,
          created_at: adj.created_at,
          reference: adj.reference || ''
        };
      });

      setAdjustments(adjustmentsList);

      // Count adjustments made this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyAdjustments = adjustmentsList.filter(adj => {
        const adjDate = new Date(adj.created_at);
        return adjDate.getMonth() === currentMonth && adjDate.getFullYear() === currentYear;
      }).length;

      setMetrics(prev => ({
        ...prev,
        adjustmentsMade: monthlyAdjustments
      }));

    } catch (error) {
      console.error('Error fetching adjustments:', error);
    }
  };

  const calculateGrossMargin = async () => {
    if (!user) return;

    try {
      // Get revenue from paid invoices this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString();

      let invoiceQuery = supabase
        .from('invoices')
        .select('total_amount')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      if (selectedWarehouse) {
        invoiceQuery = invoiceQuery.eq('warehouse_id', selectedWarehouse);
      }

      const { data: invoices } = await invoiceQuery;
      const monthlyRevenue = (invoices || []).reduce((sum, inv) => sum + inv.total_amount, 0);

      const grossMargin = monthlyRevenue > 0 ? 
        ((monthlyRevenue - metrics.cogsThisMonth) / monthlyRevenue) * 100 : 0;

      setMetrics(prev => ({
        ...prev,
        grossMargin
      }));

    } catch (error) {
      console.error('Error calculating gross margin:', error);
    }
  };

  const createInventoryAdjustment = async (adjustmentData: {
    product_id: string;
    quantity: number;
    adjustment_type: 'damage' | 'shrinkage' | 'writeoff' | 'correction';
    reason: string;
  }) => {
    if (!user) return { success: false, error: 'No user authenticated' };
    if (!companyId) return { success: false, error: 'No company context available' };

    try {
      // Get product details for cost calculation
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name, sku, cost_price, quantity')
        .eq('id', adjustmentData.product_id)
        .single();

      if (productError || !product) {
        return { success: false, error: 'Product not found' };
      }

      // Create inventory history record
      const { error: historyError } = await supabase
        .from('inventory_history')
        .insert({
          product_id: adjustmentData.product_id,
          quantity: -adjustmentData.quantity, // Negative for outgoing adjustment
          transaction_type: 'outgoing',
          reference: `ADJ-${Date.now()}`,
          notes: `${adjustmentData.adjustment_type}: ${adjustmentData.reason}`,
          user_id: user.id,
          warehouse_id: selectedWarehouse,
          company_id: companyId,
          remaining_stock: product.quantity - adjustmentData.quantity
        });

      if (historyError) {
        return { success: false, error: historyError.message };
      }

      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          quantity: product.quantity - adjustmentData.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', adjustmentData.product_id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Refresh data
      await Promise.all([
        fetchInventoryValuations(),
        fetchCogsEntries(),
        fetchAdjustments()
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error creating inventory adjustment:', error);
      return { success: false, error: 'Failed to create adjustment' };
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchInventoryValuations(),
      fetchCogsEntries(),
      fetchAdjustments()
    ]);
    await calculateGrossMargin();
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedWarehouse, user]);

  return {
    valuations,
    cogsEntries,
    adjustments,
    metrics,
    isLoading,
    createInventoryAdjustment,
    refetch: fetchAllData
  };
};