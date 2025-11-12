import { useState } from 'react';

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  expiration_date?: string;
  manufacturing_date?: string;
  location_id?: string;
  notes?: string;
}

export const useProductBatches = (productId?: string) => {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return {
    batches,
    isLoading,
    refetch: async () => {},
    createBatch: async () => {},
    updateBatch: async () => {},
    deleteBatch: async () => {},
    allocateInventory: async () => ({ success: false, allocations: [] }),
  };
};
