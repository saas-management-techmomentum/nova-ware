// COMMENTED OUT: General ledger depends on incomplete financial schema
// This feature requires database schema updates before it can be enabled

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

// Stub export to maintain compatibility
export const useGeneralLedger = () => ({
  journalEntries: [] as any[],
  glSummary: null as GLSummary | null,
  isLoading: false,
  selectedWarehouse: null as string | null,
  isInCorporateOverview: false,
  fetchJournalEntries: async () => {},
  fetchTrialBalance: async () => [] as TrialBalanceItem[],
  getTrialBalance: async () => [] as TrialBalanceItem[],
  refetch: async () => {}
});
