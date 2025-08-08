import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useBankAccounts } from './useBankAccounts';
import { useBankTransactions } from './useBankTransactions';

export interface PettyCashEntry {
  id: string;
  user_id: string;
  warehouse_id?: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  reference_number?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePettyCashEntry {
  date: string;
  description: string;
  amount: number;
  category: string;
  reference_number?: string;
  warehouse_id?: string;
}

export interface BankDashboardMetrics {
  totalBalance: number;
  monthlyIncoming: number;
  monthlyOutgoing: number;
  unmatchedTransactions: number;
  pettyCashBalance: number;
  upcomingPayments: number;
}

export interface MatchSuggestion {
  transactionId: string;
  matchType: 'invoice' | 'bill' | 'expense';
  matchId: string;
  matchDescription: string;
  confidence: number;
}

export const useBankCashManagement = () => {
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const { bankAccounts } = useBankAccounts();
  const { bankTransactions } = useBankTransactions();
  
  const [pettyCashEntries, setPettyCashEntries] = useState<PettyCashEntry[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<BankDashboardMetrics>({
    totalBalance: 0,
    monthlyIncoming: 0,
    monthlyOutgoing: 0,
    unmatchedTransactions: 0,
    pettyCashBalance: 0,
    upcomingPayments: 0
  });
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPettyCashEntries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('petty_cash_entries' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setPettyCashEntries((data as unknown as PettyCashEntry[]) || []);
    } catch (err) {
      console.error('Error fetching petty cash entries:', err);
    }
  };

  const addPettyCashEntry = async (entryData: CreatePettyCashEntry) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('petty_cash_entries' as any)
        .insert([{
          ...entryData,
          user_id: user.id,
          warehouse_id: entryData.warehouse_id || selectedWarehouse
        }])
        .select()
        .single();

      if (error) throw error;

      setPettyCashEntries(prev => [(data as unknown as PettyCashEntry), ...prev]);
      await calculateDashboardMetrics();
      return data;
    } catch (err) {
      console.error('Error adding petty cash entry:', err);
      throw err;
    }
  };

  const calculateDashboardMetrics = async () => {
    try {
      // Calculate total bank balance
      const totalBalance = bankAccounts.reduce((sum, account) => sum + account.current_balance, 0);

      // Calculate monthly incoming/outgoing transactions
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const monthlyTransactions = bankTransactions.filter(t => 
        new Date(t.transaction_date) >= startOfMonth
      );

      const monthlyIncoming = monthlyTransactions
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyOutgoing = monthlyTransactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      // Count unmatched transactions
      const unmatchedTransactions = bankTransactions.filter(t => t.status === 'unmatched').length;

      // Calculate petty cash balance
      const pettyCashBalance = pettyCashEntries.reduce((sum, entry) => sum + entry.amount, 0);

      // Get upcoming payments from AP
      const { data: upcomingBills } = await supabase
        .from('vendor_bills')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('status', 'open')
        .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

      const upcomingPayments = upcomingBills?.reduce((sum, bill) => sum + (bill as any).amount, 0) || 0;

      setDashboardMetrics({
        totalBalance,
        monthlyIncoming,
        monthlyOutgoing,
        unmatchedTransactions,
        pettyCashBalance,
        upcomingPayments
      });
    } catch (err) {
      console.error('Error calculating dashboard metrics:', err);
    }
  };

  const generateMatchSuggestions = async () => {
    if (!user) return;

    try {
      const suggestions: MatchSuggestion[] = [];
      const unmatchedTransactions = bankTransactions.filter(t => t.status === 'unmatched');

      for (const transaction of unmatchedTransactions) {
        // Match incoming transactions with AR invoices
        if (transaction.transaction_type === 'credit') {
          const { data: invoices } = await supabase
            .from('invoices')
            .select('id, invoice_number, total_amount')
            .eq('user_id', user.id)
            .eq('status', 'sent')
            .gte('total_amount', transaction.amount * 0.95)
            .lte('total_amount', transaction.amount * 1.05);

          if (invoices) {
            invoices.forEach(invoice => {
              suggestions.push({
                transactionId: transaction.id,
                matchType: 'invoice',
                matchId: invoice.id,
                matchDescription: `Invoice ${invoice.invoice_number} - $${invoice.total_amount}`,
                confidence: Math.abs(invoice.total_amount - transaction.amount) < 1 ? 95 : 80
              });
            });
          }
        }

        // Match outgoing transactions with AP bills
        if (transaction.transaction_type === 'debit') {
          const { data: bills } = await supabase
            .from('vendor_bills')
            .select('id, bill_number, amount')
            .eq('user_id', user.id)
            .eq('status', 'open')
            .gte('amount', transaction.amount * 0.95)
            .lte('amount', transaction.amount * 1.05);

          if (bills) {
            bills.forEach(bill => {
              suggestions.push({
                transactionId: transaction.id,
                matchType: 'bill',
                matchId: bill.id,
                matchDescription: `Bill ${(bill as any).bill_number} - $${(bill as any).amount}`,
                confidence: Math.abs((bill as any).amount - transaction.amount) < 1 ? 95 : 80
              });
            });
          }
        }
      }

      setMatchSuggestions(suggestions);
    } catch (err) {
      console.error('Error generating match suggestions:', err);
    }
  };

  const matchTransaction = async (transactionId: string, matchType: string, matchId: string) => {
    try {
      // Update transaction status to matched
      await supabase
        .from('bank_transactions')
        .update({ 
          status: 'matched',
          gl_reference_id: matchId
        })
        .eq('id', transactionId);

      // Update the corresponding invoice/bill status
      if (matchType === 'invoice') {
        await supabase
          .from('invoices')
          .update({ status: 'paid', payment_date: new Date().toISOString() })
          .eq('id', matchId);
      } else if (matchType === 'bill') {
        await supabase
          .from('vendor_bills')
          .update({ status: 'paid' })
          .eq('id', matchId);
      }

      // Create journal entry for the matched transaction
      await createJournalEntryForMatch(transactionId, matchType, matchId);
      
      // Refresh data
      await calculateDashboardMetrics();
      await generateMatchSuggestions();
    } catch (err) {
      console.error('Error matching transaction:', err);
      throw err;
    }
  };

  const createJournalEntryForMatch = async (transactionId: string, matchType: string, matchId: string) => {
    try {
      const transaction = bankTransactions.find(t => t.id === transactionId);
      if (!transaction) return;

      const entryNumber = `JE-BANK-${Date.now()}`;
      
      // Create journal entry
      const { data: journalEntry, error: jeError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: entryNumber,
          entry_date: transaction.transaction_date,
          description: `Bank reconciliation - ${transaction.description}`,
          total_amount: Math.abs(transaction.amount),
          status: 'posted',
          user_id: user?.id,
          created_by: user?.id,
          reference: `Bank Transaction: ${transactionId}`,
          warehouse_id: selectedWarehouse
        })
        .select()
        .single();

      if (jeError) throw jeError;

      // Get account IDs
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, account_code')
        .eq('user_id', user?.id);

      const bankAccount = accounts?.find(acc => acc.account_code === '1000'); // Cash/Bank
      const arAccount = accounts?.find(acc => acc.account_code === '1100'); // Accounts Receivable
      const apAccount = accounts?.find(acc => acc.account_code === '2000'); // Accounts Payable

      if (!bankAccount) return;

      // Create journal entry lines based on match type
      const lines = [];
      
      if (matchType === 'invoice' && arAccount) {
        // Customer payment: Debit Bank, Credit AR
        lines.push(
          {
            journal_entry_id: journalEntry.id,
            account_id: bankAccount.id,
            line_number: 1,
            description: 'Customer payment received',
            debit_amount: transaction.amount,
            credit_amount: 0
          },
          {
            journal_entry_id: journalEntry.id,
            account_id: arAccount.id,
            line_number: 2,
            description: 'Accounts receivable payment',
            debit_amount: 0,
            credit_amount: transaction.amount
          }
        );
      } else if (matchType === 'bill' && apAccount) {
        // Vendor payment: Debit AP, Credit Bank
        lines.push(
          {
            journal_entry_id: journalEntry.id,
            account_id: apAccount.id,
            line_number: 1,
            description: 'Vendor payment made',
            debit_amount: Math.abs(transaction.amount),
            credit_amount: 0
          },
          {
            journal_entry_id: journalEntry.id,
            account_id: bankAccount.id,
            line_number: 2,
            description: 'Bank payment',
            debit_amount: 0,
            credit_amount: Math.abs(transaction.amount)
          }
        );
      }

      if (lines.length > 0) {
        await supabase
          .from('journal_entry_lines')
          .insert(lines);
      }
    } catch (err) {
      console.error('Error creating journal entry for match:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPettyCashEntries();
      calculateDashboardMetrics();
      generateMatchSuggestions();
    }
  }, [user, selectedWarehouse, bankAccounts, bankTransactions]);

  useEffect(() => {
    if (bankAccounts.length > 0 || bankTransactions.length > 0) {
      calculateDashboardMetrics();
      setIsLoading(false);
    }
  }, [bankAccounts, bankTransactions, pettyCashEntries]);

  return {
    pettyCashEntries,
    dashboardMetrics,
    matchSuggestions,
    isLoading,
    addPettyCashEntry,
    matchTransaction,
    refetch: () => {
      fetchPettyCashEntries();
      calculateDashboardMetrics();
      generateMatchSuggestions();
    }
  };
};