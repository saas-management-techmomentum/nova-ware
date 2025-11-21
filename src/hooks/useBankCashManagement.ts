// COMMENTED OUT: Depends on bank_accounts schema that needs updates
// This feature requires database schema updates before it can be enabled

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

// Stub export to maintain compatibility
export const useBankCashManagement = () => ({
  pettyCashEntries: [] as PettyCashEntry[],
  dashboardMetrics: {
    totalBalance: 0,
    monthlyIncoming: 0,
    monthlyOutgoing: 0,
    unmatchedTransactions: 0,
    pettyCashBalance: 0,
    upcomingPayments: 0
  } as BankDashboardMetrics,
  matchSuggestions: [] as MatchSuggestion[],
  isLoading: false,
  addPettyCashEntry: async (entry: Omit<PettyCashEntry, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {},
  reconcileAccount: async (accountId: string, endingBalance: number) => {},
  matchTransaction: async (transactionId: string, matchType: string, matchId: string) => {},
  applyMatchSuggestion: async (suggestion: MatchSuggestion) => {},
  refetch: async () => {}
});
