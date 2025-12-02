import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useToast } from '@/hooks/use-toast';

export interface Vendor {
  id: string;
  user_id: string;
  company_id?: string;
  warehouse_id?: string;
  vendor_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms: string;
  notes?: string;
  is_active: boolean;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface VendorTransaction {
  id: string;
  vendor_id: string;
  user_id: string;
  transaction_type: 'purchase_order' | 'invoice' | 'payment' | 'expense';
  reference_id?: string;
  amount: number;
  description?: string;
  transaction_date: string;
  status: string;
  created_at: string;
}

export interface CreateVendorData {
  vendor_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  notes?: string;
  rating?: number;
  is_active?: boolean;
}

export interface VendorDashboardData {
  totalActiveVendors: number;
  topVendorsBySpend: Array<{
    vendor_id: string;
    vendor_name: string;
    total_spend: number;
  }>;
  outstandingPayables: number;
  recentActivity: VendorTransaction[];
}

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { selectedWarehouse, warehouses } = useWarehouse();
  const { toast } = useToast();

  const fetchVendors = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get companyId from warehouses
      const companyId = warehouses.length > 0 ? warehouses[0].company_id : null;

      let query = supabase
        .from('vendors')
        .select('*');

      // Filter vendors by company (corporate view or specific warehouse)
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      // Apply warehouse filtering if specific warehouse is selected
      if (selectedWarehouse) {
        query = query.eq('warehouse_id', selectedWarehouse);
      }

      const { data, error } = await query.order('vendor_name');

      if (error) throw error;

      setVendors(data || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vendors');
    } finally {
      setIsLoading(false);
    }
  };

  const createVendor = async (vendorData: CreateVendorData): Promise<Vendor | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a vendor",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Get company_id from the selected warehouse
      const selectedWarehouseData = warehouses.find(w => w.warehouse_id === selectedWarehouse);
      const companyId = selectedWarehouseData?.company_id;
      
      // Validation: Ensure we have a company_id
      if (!companyId) {
        console.error('No company_id found for warehouse:', selectedWarehouse);
        toast({
          title: "Error",
          description: "Could not determine company for this vendor. Please select a warehouse.",
          variant: "destructive",
        });
        return null;
      }

      const newVendor = {
        ...vendorData,
        user_id: user.id,
        warehouse_id: selectedWarehouse,
        company_id: companyId,
        payment_terms: vendorData.payment_terms || 'Net 30',
        is_active: true,
      };

      const { data, error } = await supabase
        .from('vendors')
        .insert([newVendor])
        .select()
        .single();

      if (error) throw error;

      setVendors(prev => [...prev, data]);
      
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });

      return data;
    } catch (err) {
      console.error('Error creating vendor:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create vendor',
        variant: "destructive",
      });
      return null;
    }
  };

  const updateVendor = async (id: string, updates: Partial<CreateVendorData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setVendors(prev => 
        prev.map(vendor => 
          vendor.id === id ? { ...vendor, ...updates } : vendor
        )
      );

      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });

      return true;
    } catch (err) {
      console.error('Error updating vendor:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update vendor',
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteVendor = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setVendors(prev => prev.filter(vendor => vendor.id !== id));

      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });

      return true;
    } catch (err) {
      console.error('Error deleting vendor:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete vendor',
        variant: "destructive",
      });
      return false;
    }
  };

  const getVendorDashboardData = async (): Promise<VendorDashboardData | null> => {
    if (!user) return null;

    try {

      
      // Get total active vendors
      const { data: activeVendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (vendorsError) {
        console.error('Error fetching vendors:', vendorsError);
      }

      // Get vendor transactions for analytics
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('vendor_transactions')
        .select(`
          *,
          vendors:vendor_id (vendor_name)
        `)
        .eq('user_id', user.id);

      if (transactionsError) {
        console.error('Error fetching vendor transactions:', transactionsError);
      } 

      // Calculate top vendors by spend
      const vendorSpendMap = new Map<string, { vendor_name: string; total_spend: number }>();
      
      transactionsData?.forEach(transaction => {
        const vendorName = (transaction.vendors as any)?.vendor_name || 'Unknown';
        const existing = vendorSpendMap.get(transaction.vendor_id);
        
        if (existing) {
          existing.total_spend += Number(transaction.amount);
        } else {
          vendorSpendMap.set(transaction.vendor_id, {
            vendor_name: vendorName,
            total_spend: Number(transaction.amount),
          });
        }
      });

      const topVendorsBySpend = Array.from(vendorSpendMap.entries())
        .map(([vendor_id, data]) => ({ vendor_id, ...data }))
        .sort((a, b) => b.total_spend - a.total_spend)
        .slice(0, 5);

      // Calculate outstanding payables (invoices not paid)
      const outstandingPayables = transactionsData
        ?.filter(t => t.transaction_type === 'invoice' && t.status !== 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get recent activity (last 10 transactions)
      const recentActivity = transactionsData
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10) || [];

      const dashboardData = {
        totalActiveVendors: activeVendorsData?.length || 0,
        topVendorsBySpend,
        outstandingPayables,
        recentActivity: recentActivity as VendorTransaction[],
      };

  
      return dashboardData;
    } catch (err) {
      console.error('Error fetching vendor dashboard data:', err);
      return null;
    }
  };

  const addVendorTransaction = async (transaction: Omit<VendorTransaction, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('vendor_transactions')
        .insert([{
          ...transaction,
          user_id: user.id,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor transaction added successfully",
      });

      return true;
    } catch (err) {
      console.error('Error adding vendor transaction:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to add vendor transaction',
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [user, selectedWarehouse]);

  return {
    vendors,
    isLoading,
    error,
    createVendor,
    updateVendor,
    deleteVendor,
    getVendorDashboardData,
    addVendorTransaction,
    refetch: fetchVendors,
  };
}