import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useToast } from '@/hooks/use-toast';

export interface BatchAllocation {
  id: string;
  order_id: string;
  order_item_id: string;
  batch_id: string;
  product_id: string;
  quantity: number;
  allocation_strategy: 'FIFO' | 'LIFO' | 'FEFO';
  allocated_at: string;
  batch_number?: string;
  location_name?: string;
}

export interface AllocationResult {
  batch_id: string;
  allocated_qty: number;
  batch_number: string;
  location_name: string;
  allocation_id: string;
}

export const useBatchAllocation = () => {
  const [isAllocating, setIsAllocating] = useState(false);
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const { toast } = useToast();

  /**
   * Allocate inventory for an order item using specified strategy
   */
  const allocateInventory = async (
    orderId: string,
    orderItemId: string,
    productId: string,
    quantity: number,
    strategy: 'FIFO' | 'LIFO' | 'FEFO' = 'FIFO'
  ): Promise<AllocationResult[]> => {
    if (!user || !selectedWarehouse) {
      throw new Error('User or warehouse not found');
    }

    setIsAllocating(true);

    try {
      // Get warehouse company_id
      const { data: warehouseData, error: warehouseError } = await supabase
        .from('warehouses')
        .select('company_id')
        .eq('id', selectedWarehouse)
        .single();

      if (warehouseError) throw warehouseError;

      const companyId = warehouseData.company_id;

      // Call the allocation RPC function
      const { data, error } = await supabase.rpc('allocate_and_deduct_inventory', {
        p_order_id: orderId,
        p_order_item_id: orderItemId,
        p_product_id: productId,
        p_quantity: quantity,
        p_strategy: strategy,
        p_user_id: user.id,
        p_warehouse_id: selectedWarehouse,
        p_company_id: companyId
      });

      if (error) {
        console.error('Allocation error:', error);
        
        if (error.message.includes('Insufficient inventory')) {
          // Check if product has stock in products table but no batches
          const { data: product } = await supabase
            .from('products')
            .select('quantity, name, sku')
            .eq('id', productId)
            .single();
          
          if (product && product.quantity >= quantity) {
            // Auto-create a default batch from product stock
            const batchNumber = `BATCH-${Date.now()}`;
            const { error: batchError } = await supabase.from('product_batches').insert({
              product_id: productId,
              batch_number: batchNumber,
              quantity: product.quantity,
              cost_price: 0,
              received_date: new Date().toISOString(),
              user_id: user.id,
              warehouse_id: selectedWarehouse,
              company_id: companyId
            });

            if (batchError) {
              console.error('Failed to create auto-batch:', batchError);
              throw batchError;
            }
            
            // Retry allocation with the newly created batch
            const { data: retryData, error: retryError } = await supabase.rpc('allocate_and_deduct_inventory', {
              p_order_id: orderId,
              p_order_item_id: orderItemId,
              p_product_id: productId,
              p_quantity: quantity,
              p_strategy: strategy,
              p_user_id: user.id,
              p_warehouse_id: selectedWarehouse,
              p_company_id: companyId
            });

            if (retryError) {
              console.error('Retry allocation error:', retryError);
              throw retryError;
            }

            return retryData as AllocationResult[];
          }
          
          toast({
            title: "Insufficient Inventory",
            description: `Not enough inventory available for this product.`,
            variant: "destructive"
          });
        }
        
        throw error;
      }

      
      
      return data as AllocationResult[];
    } catch (error) {
      console.error('Error allocating inventory:', error);
      throw error;
    } finally {
      setIsAllocating(false);
    }
  };

  /**
   * Get all allocations for an order
   */
  const getAllocations = async (orderId: string): Promise<BatchAllocation[]> => {
    if (!user) {
      throw new Error('User not found');
    }

    try {
      const { data, error } = await supabase
        .from('batch_allocations')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;

      return (data || []) as BatchAllocation[];
    } catch (error) {
      console.error('Error fetching allocations:', error);
      throw error;
    }
  };

  /**
   * Reverse allocation for an order (e.g., when order is cancelled)
   * Restores inventory quantities back to batches
   */
  const reverseAllocation = async (orderId: string): Promise<void> => {
    if (!user) {
      throw new Error('User not found');
    }

    setIsAllocating(true);

    try {
      // Get all allocations for this order
      const { data: allocations, error: fetchError } = await supabase
        .from('batch_allocations')
        .select('*')
        .eq('order_id', orderId);

      if (fetchError) throw fetchError;

      if (!allocations || allocations.length === 0) {
  
        return;
      }

      // Restore quantities to batches
      for (const allocation of allocations) {
        // First get current quantity
        const { data: batchData, error: fetchError } = await supabase
          .from('product_batches')
          .select('quantity')
          .eq('id', allocation.batch_id)
          .single();

        if (fetchError) {
          console.error('Error fetching batch:', fetchError);
          throw fetchError;
        }

        // Then update with restored quantity
        const { error: updateError } = await supabase
          .from('product_batches')
          .update({
            quantity: (batchData?.quantity || 0) + allocation.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', allocation.batch_id);

        if (updateError) {
          console.error('Error restoring batch quantity:', updateError);
          throw updateError;
        }
      }

      // Delete the allocation records
      const { error: deleteError } = await supabase
        .from('batch_allocations')
        .delete()
        .eq('order_id', orderId);

      if (deleteError) throw deleteError;

      console.log(`Reversed allocations for order ${orderId}:`, allocations);
      toast({
        title: "Allocation Reversed",
        description: "Inventory has been restored to batches.",
      });
    } catch (error) {
      console.error('Error reversing allocation:', error);
      toast({
        title: "Error",
        description: "Failed to reverse allocation",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsAllocating(false);
    }
  };

  /**
   * Get allocation summary for an order (grouped by product)
   */
  const getAllocationSummary = async (orderId: string) => {
    try {
      const allocations = await getAllocations(orderId);
      
      // Group by product
      const summary = allocations.reduce((acc, allocation) => {
        if (!acc[allocation.product_id]) {
          acc[allocation.product_id] = {
            product_id: allocation.product_id,
            total_allocated: 0,
            batches: [],
            strategy: allocation.allocation_strategy
          };
        }
        
        acc[allocation.product_id].total_allocated += allocation.quantity;
        acc[allocation.product_id].batches.push({
          batch_id: allocation.batch_id,
          batch_number: allocation.batch_number,
          location_name: allocation.location_name,
          quantity: allocation.quantity
        });
        
        return acc;
      }, {} as Record<string, any>);

      return Object.values(summary);
    } catch (error) {
      console.error('Error getting allocation summary:', error);
      throw error;
    }
  };

  return {
    allocateInventory,
    getAllocations,
    reverseAllocation,
    getAllocationSummary,
    isAllocating
  };
};
