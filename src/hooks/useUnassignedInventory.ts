import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';

export interface UnassignedInventoryItem {
  id: string;
  name: string;
  sku: string;
  totalQuantity: number;
  assignedQuantity: number;
  unassignedQuantity: number;
}

export const useUnassignedInventory = () => {
  const [unassignedItems, setUnassignedItems] = useState<UnassignedInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();

  const fetchUnassignedItems = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Use the fallback approach directly for now to avoid RPC complexity
      await fetchUnassignedItemsFallback();
    } catch (error) {
      console.error('Exception fetching unassigned inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback method using separate queries
  const fetchUnassignedItemsFallback = async () => {
    if (!user) return;
    
    try {
      // Get all products with positive quantities
      let productQuery = supabase
        .from('products')
        .select('id, name, sku, quantity')
        .eq('user_id', user.id)
        .gt('quantity', 0);

      if (selectedWarehouse) {
        productQuery = productQuery.eq('warehouse_id', selectedWarehouse);
      }

      const { data: products, error: productsError } = await productQuery;

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return;
      }

      // For each product, calculate unassigned quantities
      const unassignedItems: UnassignedInventoryItem[] = [];

      for (const product of products || []) {
        let batchQuery = supabase
          .from('product_batches')
          .select('quantity')
          .eq('product_id', product.id)
          .eq('user_id', user.id);

        if (selectedWarehouse) {
          batchQuery = batchQuery.eq('warehouse_id', selectedWarehouse);
        }

        const { data: batchData } = await batchQuery;
        
        const assignedQuantity = (batchData || []).reduce((sum, batch) => sum + batch.quantity, 0);
        const unassignedQuantity = product.quantity - assignedQuantity;

        if (unassignedQuantity > 0) {
          unassignedItems.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            totalQuantity: product.quantity,
            assignedQuantity,
            unassignedQuantity
          });
        }
      }

      setUnassignedItems(unassignedItems);
    } catch (error) {
      console.error('Exception in fallback fetch:', error);
    }
  };

  useEffect(() => {
    fetchUnassignedItems();
  }, [user, selectedWarehouse]);

  return {
    unassignedItems,
    isLoading,
    refetch: fetchUnassignedItems,
    hasUnassignedItems: unassignedItems.length > 0,
    totalUnassignedProducts: unassignedItems.length,
    totalUnassignedQuantity: unassignedItems.reduce((sum, item) => sum + item.unassignedQuantity, 0)
  };
};