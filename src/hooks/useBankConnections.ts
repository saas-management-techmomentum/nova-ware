import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ConnectedBankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  current_balance: number;
  is_active: boolean;
  last_sync?: string | null;
  plaid_account_id?: string;
  plaid_access_token?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  warehouse_id?: string;
  company_id?: string;
  currency?: string;
  opening_balance?: number;
}

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: string;
  status: string;
  reference_number?: string;
  category?: string;
  plaid_transaction_id?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  gl_reference_id?: string;
}

export const useBankConnections = () => {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedBankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchConnectedAccounts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConnectedAccounts(data || []);
    } catch (err) {
      console.error('Error fetching connected accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bank accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (error) throw error;

      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    }
  };

  const initiateConnection = async (): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Call Supabase Edge Function to initiate Plaid Link
      const { data, error } = await supabase.functions.invoke('initiate-bank-connection', {
        body: { user_id: user.id }
      });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Try to get more details from the error
        const errorMessage = error.message || 'Edge function error';
        throw new Error(errorMessage);
      }

      // Check if the response contains an error
      if (data?.error) {
        console.error('Edge function returned error:', data);
        
        // Show detailed error information
        let errorMessage = data.error;
        if (data.details) {
          errorMessage += ` (Client ID: ${data.details.clientId ? 'present' : 'missing'}, Secret: ${data.details.secret ? 'present' : 'missing'}, Env: ${data.details.env})`;
        }
        
        throw new Error(errorMessage);
      }

      // Open Plaid Link in a popup or redirect
      if (data.link_token) {
        await openPlaidLink(data.link_token);
      } else {
        throw new Error('No link token received from Plaid');
      }
    } catch (err: any) {
      console.error('Error initiating bank connection:', err);
      
      // Pass through the actual error message instead of generic one
      if (err.message) {
        throw new Error(err.message);
      } else {
        throw new Error('Failed to initiate bank connection');
      }
    }
  };

  const openPlaidLink = async (linkToken: string): Promise<void> => {
    // This would typically use the Plaid Link SDK
    // For now, we'll simulate the connection process
    return new Promise((resolve, reject) => {
      // Simulate async bank connection
      setTimeout(async () => {
        try {
          // In a real implementation, this would be handled by Plaid's callback
          const mockAccount = {
            bank_name: 'Demo Bank',
            account_number: '****1234',
            account_type: 'checking',
            current_balance: 5000.00,
            opening_balance: 5000.00,
            plaid_account_id: 'demo_account_id',
            plaid_access_token: 'demo_access_token'
          };

          const { error } = await supabase
            .from('bank_accounts')
            .insert([{ ...mockAccount, user_id: user?.id }]);

          if (error) throw error;

          await fetchConnectedAccounts();
          resolve();
        } catch (err) {
          reject(err);
        }
      }, 2000);
    });
  };

  const disconnectAccount = async (accountId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', accountId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchConnectedAccounts();
    } catch (err) {
      console.error('Error disconnecting account:', err);
      throw new Error('Failed to disconnect account');
    }
  };

  const refreshAccounts = async (): Promise<void> => {
    try {
      // Call Edge Function to refresh account balances from Plaid
      const { error } = await supabase.functions.invoke('refresh-bank-accounts', {
        body: { user_id: user?.id }
      });

      if (error) throw error;

      await fetchConnectedAccounts();
    } catch (err) {
      console.error('Error refreshing accounts:', err);
      throw new Error('Failed to refresh accounts');
    }
  };

  const syncTransactions = async (): Promise<void> => {
    try {
      // Call Edge Function to sync transactions from Plaid
      const { error } = await supabase.functions.invoke('sync-bank-transactions', {
        body: { user_id: user?.id }
      });

      if (error) throw error;

      await fetchTransactions();
    } catch (err) {
      console.error('Error syncing transactions:', err);
      throw new Error('Failed to sync transactions');
    }
  };

  const matchTransaction = async (transactionId: string, matchType: 'invoice' | 'bill' | 'payroll', matchId: string): Promise<void> => {
    try {
      const { error } = await supabase.functions.invoke('match-transaction', {
        body: { 
          transaction_id: transactionId,
          match_type: matchType,
          match_id: matchId,
          user_id: user?.id
        }
      });

      if (error) throw error;

      await fetchTransactions();
    } catch (err) {
      console.error('Error matching transaction:', err);
      throw new Error('Failed to match transaction');
    }
  };

  useEffect(() => {
    if (user) {
      fetchConnectedAccounts();
      fetchTransactions();
    }
  }, [user]);

  return {
    connectedAccounts,
    transactions,
    isLoading,
    error,
    initiateConnection,
    disconnectAccount,
    refreshAccounts,
    syncTransactions,
    matchTransaction,
    refetch: () => {
      fetchConnectedAccounts();
      fetchTransactions();
    }
  };
};