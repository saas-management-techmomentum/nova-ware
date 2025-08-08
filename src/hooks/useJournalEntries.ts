
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  reference?: string;
  description: string;
  total_amount: number;
  status: string;
  user_id: string;
  company_id?: string;
  warehouse_id?: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  warehouses?: {
    name: string;
    code: string;
  };
}

export const useJournalEntries = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedWarehouse, canViewAllWarehouses } = useWarehouse();
  const { user } = useAuth();
  const { employees } = useEmployees();

  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;

  const fetchJournalEntries = async () => {
    if (!user) {
      setJournalEntries([]);
      return;
    }

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
        .from('journal_entries')
        .select(`
          *,
          warehouses (
            name,
            code
          )
        `)
        .order('entry_date', { ascending: false });

      // Apply filtering logic based on user type
      if (isAssignedEmployee) {
        // Warehouse-assigned employees see ALL journal entries for their assigned warehouse
        query = query.eq('warehouse_id', employees.assigned_warehouse_id);
      } else if (isAdmin && selectedWarehouse && !isInCorporateOverview) {
        // Admin with warehouse selected - show all entries for that warehouse
        query = query.eq('warehouse_id', selectedWarehouse);
      } else if (isAdmin && isInCorporateOverview) {
        // Admin with "All Warehouses" - show all entries for user
        query = query.eq('user_id', user.id);
      } else {
        // Unassigned employee - show only their own entries
        query = query.eq('user_id', user.id);
        if (selectedWarehouse && !isInCorporateOverview) {
          query = query.eq('warehouse_id', selectedWarehouse);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setJournalEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast({
        title: 'Error fetching journal entries',
        description: 'Could not load journal entries',
        variant: 'destructive',
      });
    }
  };

  const refetch = async () => {
    setIsLoading(true);
    await fetchJournalEntries();
    setIsLoading(false);
  };

  useEffect(() => {
    if (employees.length > 0) { // Wait for employees to load
      refetch();
    }
  }, [selectedWarehouse, user, employees.length]);

  const createJournalEntry = async (entryData: any) => {
    if (!user) {
      toast({
        title: 'Error creating journal entry',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      throw new Error('User not authenticated');
    }

    // Only require warehouse selection when not in corporate overview
    if (!isInCorporateOverview && !selectedWarehouse) {
      toast({
        title: 'Error creating journal entry',
        description: 'Please select a warehouse to create journal entries',
        variant: 'destructive',
      });
      throw new Error('No warehouse selected');
    }

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert([{
          ...entryData,
          user_id: user.id,
          created_by: user.id,
          warehouse_id: isInCorporateOverview ? null : selectedWarehouse
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Journal entry created',
        description: 'New journal entry has been recorded',
      });

      return data;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast({
        title: 'Error creating journal entry',
        description: 'Could not create journal entry',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    journalEntries,
    isLoading,
    refetch,
    createJournalEntry,
    selectedWarehouse,
    isInCorporateOverview,
  };
};
