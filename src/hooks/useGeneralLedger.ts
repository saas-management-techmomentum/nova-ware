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
  warehouses?: {
    name: string;
    code: string;
  };
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  account?: {
    account_name: string;
    account_code: string;
  };
}

export interface GLSummary {
  totalDebits: number;
  totalCredits: number;
  totalEntries: number;
  unbalancedEntries: number;
  entriesThisMonth: number;
}

export interface TrialBalanceItem {
  account_code: string;
  account_name: string;
  total_debits: number;
  total_credits: number;
  balance: number;
}

export const useGeneralLedger = () => {
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [glSummary, setGlSummary] = useState<GLSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJournalEntries = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          warehouses:warehouse_id(name, code)
        `)
        .order('entry_date', { ascending: false });

      if (selectedWarehouse) {
        query = query.eq('warehouse_id', selectedWarehouse);
      }

      const { data, error } = await query;

      if (error) throw error;

      setJournalEntries(data || []);
      await calculateGLSummary(data || []);
    } catch (error: any) {
      console.error('Error fetching journal entries:', error);
      toast.error('Failed to load general ledger');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGLSummary = async (entries: JournalEntry[]) => {
    try {
      if (entries.length === 0) {
        setGlSummary({
          totalDebits: 0,
          totalCredits: 0,
          totalEntries: 0,
          unbalancedEntries: 0,
          entriesThisMonth: 0
        });
        return;
      }

      const entryIds = entries.map(e => e.id);
      const { data: lines, error } = await supabase
        .from('journal_entry_lines')
        .select('debit_amount, credit_amount')
        .in('journal_entry_id', entryIds);

      if (error) throw error;

      const totalDebits = lines?.reduce((sum, line) => sum + (line.debit_amount || 0), 0) || 0;
      const totalCredits = lines?.reduce((sum, line) => sum + (line.credit_amount || 0), 0) || 0;

      // Get entries this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const entriesThisMonth = entries.filter(e => 
        new Date(e.entry_date) >= startOfMonth
      ).length;

      setGlSummary({
        totalDebits,
        totalCredits,
        totalEntries: entries.length,
        unbalancedEntries: Math.abs(totalDebits - totalCredits) > 0.01 ? 1 : 0,
        entriesThisMonth
      });
    } catch (error: any) {
      console.error('Error calculating GL summary:', error);
    }
  };

  const fetchTrialBalance = async (): Promise<TrialBalanceItem[]> => {
    try {
      let entryQuery = supabase.from('journal_entries').select('id');

      if (selectedWarehouse) {
        entryQuery = entryQuery.eq('warehouse_id', selectedWarehouse);
      }

      const { data: entries, error: entriesError } = await entryQuery;

      if (entriesError) throw entriesError;
      if (!entries || entries.length === 0) return [];

      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .select(`
          debit_amount,
          credit_amount,
          account:account_id(account_code, account_name)
        `)
        .in('journal_entry_id', entries.map(e => e.id));

      if (linesError) throw linesError;

      // Group by account
      const accountMap = new Map<string, TrialBalanceItem>();

      lines?.forEach((line: any) => {
        if (!line.account) return;

        const key = line.account.account_code;
        if (!accountMap.has(key)) {
          accountMap.set(key, {
            account_code: line.account.account_code,
            account_name: line.account.account_name,
            total_debits: 0,
            total_credits: 0,
            balance: 0
          });
        }

        const item = accountMap.get(key)!;
        item.total_debits += line.debit_amount || 0;
        item.total_credits += line.credit_amount || 0;
        item.balance = item.total_debits - item.total_credits;
      });

      return Array.from(accountMap.values()).sort((a, b) => 
        a.account_code.localeCompare(b.account_code)
      );
    } catch (error: any) {
      console.error('Error fetching trial balance:', error);
      toast.error('Failed to load trial balance');
      return [];
    }
  };

  useEffect(() => {
    fetchJournalEntries();
  }, [user, selectedWarehouse]);

  return {
    journalEntries,
    glSummary,
    isLoading,
    selectedWarehouse,
    isInCorporateOverview: selectedWarehouse === null,
    fetchJournalEntries,
    fetchTrialBalance,
    getTrialBalance: fetchTrialBalance,
    refetch: fetchJournalEntries
  };
};
