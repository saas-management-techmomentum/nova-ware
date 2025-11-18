// COMMENTED OUT: billing_transactions table does not exist in schema
// This hook is disabled until the database schema includes billing_transactions

import { useState, useEffect } from 'react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  date: string;
  warehouse_name?: string;
  warehouse_id?: string;
}

export const useWarehouseScopedExpenses = () => {
  const [expenses] = useState<Expense[]>([]);
  const [isLoading] = useState(false);

  useEffect(() => {
    console.warn('useWarehouseScopedExpenses: billing_transactions table not available');
  }, []);

  return {
    expenses,
    totalExpenses: 0,
    pendingExpenses: 0,
    expensesByCategory: {} as Record<string, number>,
    isLoading,
    refetch: async () => {},
  };
};
