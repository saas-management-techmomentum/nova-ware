import { useState } from 'react';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  vendor?: string;
  warehouse_id: string;
}

export const useWarehouseScopedExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return {
    expenses,
    isLoading,
    fetchExpenses: async () => {},
    addExpense: async () => {},
    updateExpense: async () => {},
    deleteExpense: async () => {},
  };
};
