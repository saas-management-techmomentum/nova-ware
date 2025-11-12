import { useState } from 'react';

export const useEnhancedFinancialData = () => {
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: async () => {},
  };
};
