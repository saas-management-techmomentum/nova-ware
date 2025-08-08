
import { useInventoryQuery } from './queries/useInventoryQuery';

// Legacy hook - use useInventoryQuery for better performance
export const useWarehouseScopedInventory = (ignoreWarehouseFilter: boolean = false) => {
  const { data, isLoading, refetch } = useInventoryQuery({ ignoreWarehouseFilter });
  
  return {
    inventoryItems: data?.data || [],
    isLoading,
    refetch: () => refetch().then(() => {}),
  };
};
