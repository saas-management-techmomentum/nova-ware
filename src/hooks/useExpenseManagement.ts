// COMMENTED OUT: Expense management schema incomplete
// This feature requires database schema updates before it can be enabled

export interface ExpenseRecord {
  id: string;
  entry_date: string;
  description: string;
  vendor: string | null;
  category: string;
  amount: number;
  payment_method: string | null;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'overdue';
  reference: string | null;
  notes: string | null;
  warehouse_id: string | null;
  warehouse_name?: string;
  journal_entry_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseMetrics {
  totalThisMonth: number;
  lastMonthChange: number;
  totalUnpaid: number;
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  topVendor: {
    name: string;
    amount: number;
  } | null;
  recurringExpenses: number;
  categoriesBreakdown: Record<string, number>;
}

// Stub export to maintain compatibility
export const useExpenseManagement = () => ({
  expenses: [] as ExpenseRecord[],
  metrics: {
    totalThisMonth: 0,
    lastMonthChange: 0,
    totalUnpaid: 0,
    topCategories: [],
    topVendor: null,
    recurringExpenses: 0,
    categoriesBreakdown: {}
  } as ExpenseMetrics,
  isLoading: false,
  fetchExpenses: async () => {},
  addExpense: async () => {},
  updateExpense: async () => {},
  deleteExpense: async () => {},
  refetch: async () => {}
});
