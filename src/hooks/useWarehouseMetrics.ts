import { useState } from 'react';

export const useWarehouseMetrics = (warehouseId?: string) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  return {
    metrics,
    data: null,
    isLoading,
    dataUpdatedAt: Date.now(),
    refetch: async (id?: string) => {},
  };
};
