// NOTE: billing_transactions table not available; this hook returns empty data
export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  warehouse_id?: string;
  warehouse_name?: string;
}

export const useWarehouseScopedExpenses = () => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('useWarehouseScopedExpenses is disabled: billing_transactions table not available');
  }

  return {
    expenses: [] as Expense[],
    isLoading: false,
    refetch: async () => {},
  };
};
