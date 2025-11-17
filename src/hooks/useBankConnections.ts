// COMMENTED OUT: Depends on bank_accounts schema that needs updates
// This feature requires database schema updates before it can be enabled

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

// Stub export to maintain compatibility
export const useBankConnections = () => ({
  connectedAccounts: [] as ConnectedBankAccount[],
  transactions: [] as BankTransaction[],
  isLoading: false,
  error: null,
  initiateConnection: async () => {},
  disconnectAccount: async (accountId: string) => {},
  refreshAccounts: async () => {},
  syncTransactions: async () => {},
  matchTransaction: async (transactionId: string, matchType: 'invoice' | 'bill' | 'payroll', matchId: string) => {},
  refetch: () => {}
});
