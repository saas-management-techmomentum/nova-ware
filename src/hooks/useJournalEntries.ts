import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface JournalEntry {
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
  created_at: string;
  updated_at: string;
}

export const useJournalEntries = () => {
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJournalEntries = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('journal_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (selectedWarehouse) {
        query = query.eq('warehouse_id', selectedWarehouse);
      }

      const { data, error } = await query;

      if (error) throw error;
      setJournalEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching journal entries:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJournalEntries();
  }, [user, selectedWarehouse]);

  const createJournalEntry = async (entryData: Partial<JournalEntry>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      // First get user's company_id
      const { data: companyData } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('approval_status', 'approved')
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from('journal_entries')
        .insert([{
          user_id: user.id,
          entry_number: entryData.entry_number!,
          entry_date: entryData.entry_date!,
          description: entryData.description!,
          total_amount: entryData.total_amount || 0,
          status: entryData.status || 'draft',
          reference: entryData.reference,
          warehouse_id: selectedWarehouse || entryData.warehouse_id,
          company_id: companyData?.company_id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Journal entry created successfully');
      await fetchJournalEntries();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating journal entry:', error);
      toast.error('Failed to create journal entry');
      return { success: false, error: error.message };
    }
  };

  return {
    journalEntries,
    isLoading,
    refetch: fetchJournalEntries,
    createJournalEntry,
    selectedWarehouse,
    isInCorporateOverview: selectedWarehouse === null,
  };
};
