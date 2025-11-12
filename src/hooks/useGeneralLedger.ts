import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';

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
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  module?: string;
  reference_id?: string;
  warehouses?: {
    name: string;
    code: string;
  };
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  line_number: number;
  account_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  account?: {
    account_name: string;
    account_code: string;
  };
}

interface JournalEntryWithLines extends JournalEntry {
  journal_entry_lines: Array<{
    id: string;
    line_number: number;
    account_id: string;
    description?: string;
    debit_amount: number;
    credit_amount: number;
    accounts?: {
      account_name: string;
      account_code: string;
    };
  }>;
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
  const [journalEntries, setJournalEntries] = useState<JournalEntryWithLines[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [glSummary, setGlSummary] = useState<GLSummary | null>(null);
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

      console.log('🔄 Fetching GL journal entries via RLS policies for warehouse:', selectedWarehouse);
      
      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          warehouses (
            name,
            code
          ),
          journal_entry_lines (
            id,
            line_number,
            account_id,
            description,
            debit_amount,
            credit_amount,
            accounts (
              account_name,
              account_code
            )
          )
        `)
        .order('entry_date', { ascending: false });

      // Apply warehouse filtering - RLS handles user/warehouse access control
      if (selectedWarehouse && !isInCorporateOverview) {
        // Filter by specific warehouse when selected
        query = query.eq('warehouse_id', selectedWarehouse);
      }
      // Corporate overview shows all accessible data via RLS

      const { data, error } = await query;
      
      console.log('📊 GL journal entries query result:', { data: data?.length || 0, error });

      if (error) throw error;
      setJournalEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries for GL:', error);
      toast({
        title: 'Error fetching ledger data',
        description: 'Could not load general ledger entries',
        variant: 'destructive',
      });
    }
  };

  // Calculate GL summary
  const calculateGLSummary = async () => {
    if (!user) return;

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

      console.log('🔄 Calculating GL summary via RLS policies for warehouse:', selectedWarehouse);
      
      let query = supabase
        .from('journal_entries')
        .select(`
          total_amount,
          status,
          created_at,
          journal_entry_lines(debit_amount, credit_amount)
        `);

      // Apply warehouse filtering - RLS handles user/warehouse access control
      if (selectedWarehouse && !isInCorporateOverview) {
        query = query.eq('warehouse_id', selectedWarehouse);
      }
      // Corporate overview shows all accessible data via RLS

      const { data: entries, error } = await query;
      
      console.log('📊 GL summary query result:', { data: entries?.length || 0, error });

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let totalDebits = 0;
      let totalCredits = 0;
      let unbalancedEntries = 0;
      let entriesThisMonth = 0;

      entries?.forEach((entry: any) => {
        const entryDate = new Date(entry.created_at);
        if (entryDate >= startOfMonth) {
          entriesThisMonth++;
        }

        let entryDebits = 0;
        let entryCredits = 0;

        entry.journal_entry_lines?.forEach((line: any) => {
          totalDebits += line.debit_amount || 0;
          totalCredits += line.credit_amount || 0;
          entryDebits += line.debit_amount || 0;
          entryCredits += line.credit_amount || 0;
        });

        // Check if entry is unbalanced (difference > 0.01 to account for rounding)
        if (Math.abs(entryDebits - entryCredits) > 0.01) {
          unbalancedEntries++;
        }
      });

      setGlSummary({
        totalDebits,
        totalCredits,
        totalEntries: entries?.length || 0,
        unbalancedEntries,
        entriesThisMonth
      });
    } catch (err) {
      console.error('Error calculating GL summary:', err);
    }
  };

  // Create manual journal entry
  const createJournalEntry = async (entryData: {
    entry_date: string;
    description: string;
    reference?: string;
    lines: Array<{
      account_id: string;
      description?: string;
      debit_amount: number;
      credit_amount: number;
    }>;
  }): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Calculate total amount
      const totalAmount = entryData.lines.reduce((sum, line) => 
        sum + Math.max(line.debit_amount, line.credit_amount), 0
      );

      // Validate that debits equal credits
      const totalDebits = entryData.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
      const totalCredits = entryData.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error('Total debits must equal total credits');
      }

      // Generate entry number
      const entryNumber = `JE-MANUAL-${Date.now()}`;

      // Create journal entry
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{
          entry_number: entryNumber,
          entry_date: entryData.entry_date,
          description: entryData.description,
          total_amount: totalAmount,
          status: 'posted',
          reference: entryData.reference,
          user_id: user.id,
          created_by: user.id,
          warehouse_id: selectedWarehouse,
          company_id: null
        }])
        .select()
        .single();

      if (entryError) throw entryError;

      // Create journal entry lines
      const lines = entryData.lines.map((line, index) => ({
        journal_entry_id: journalEntry.id,
        account_id: line.account_id,
        line_number: index + 1,
        description: line.description,
        debit_amount: line.debit_amount || 0,
        credit_amount: line.credit_amount || 0
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) throw linesError;

      await refetch();

      toast({
        title: "Success",
        description: "Journal entry created successfully",
      });

    } catch (err) {
      console.error('Error creating journal entry:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create journal entry",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Get trial balance
  const getTrialBalance = async (): Promise<TrialBalanceItem[]> => {
    if (!user) return [];

    try {
      let query = supabase
        .from('journal_entry_lines')
        .select(`
          debit_amount,
          credit_amount,
          accounts(
            account_code,
            account_name
          ),
          journal_entries!inner(
            warehouse_id
          )
        `);

      if (selectedWarehouse && !isInCorporateOverview) {
        query = query.eq('journal_entries.warehouse_id', selectedWarehouse);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by account and calculate totals
      const accountTotals: Record<string, TrialBalanceItem> = {};

      data?.forEach((line: any) => {
        if (!line.accounts) return;
        
        const accountKey = `${line.accounts.account_code}-${line.accounts.account_name}`;
        
        if (!accountTotals[accountKey]) {
          accountTotals[accountKey] = {
            account_code: line.accounts.account_code,
            account_name: line.accounts.account_name,
            total_debits: 0,
            total_credits: 0,
            balance: 0
          };
        }

        accountTotals[accountKey].total_debits += line.debit_amount || 0;
        accountTotals[accountKey].total_credits += line.credit_amount || 0;
        accountTotals[accountKey].balance = 
          accountTotals[accountKey].total_debits - accountTotals[accountKey].total_credits;
      });

      return Object.values(accountTotals).sort((a, b) => a.account_code.localeCompare(b.account_code));
    } catch (err) {
      console.error('Error getting trial balance:', err);
      throw err;
    }
  };

  const refetch = async () => {
    setIsLoading(true);
    await Promise.all([fetchJournalEntries(), calculateGLSummary()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (employees.length > 0) { // Wait for employees to load
      refetch();
    }
  }, [selectedWarehouse, user, employees.length]);

  return {
    journalEntries,
    isLoading,
    refetch,
    selectedWarehouse,
    isInCorporateOverview,
    glSummary,
    createJournalEntry,
    getTrialBalance
  };
};