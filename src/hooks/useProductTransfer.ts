
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BatchAllocation {
  batchId: string;
  batchNumber: string;
  quantity: number;
  maxQuantity: number;
  expirationDate?: Date | null;
  costPrice: number;
  locationId?: string;
  isUnallocated?: boolean;
}

export interface TransferItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  transferQuantity: number;
  reservedQuantity?: number;
  maxTransferQuantity?: number;
  hasBatches?: boolean;
  batchAllocations?: BatchAllocation[];
}

export interface TransferRequest {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  items: TransferItem[];
}

// Helper function to extract base SKU from warehouse-specific SKU
const getBaseSku = (warehouseSku: string): string => {
  // Remove warehouse suffix if it exists (e.g., "SKU-123-WH1" -> "SKU-123")
  return warehouseSku.replace(/-WH[^-]*$/, '');
};

// Helper function to create warehouse-specific SKU
const createWarehouseSku = (baseSku: string, warehouseId: string): string => {
  const warehouseCode = warehouseId.slice(0, 8); // Use first 8 chars of warehouse ID
  return `${baseSku}-WH${warehouseCode}`;
};

export const useProductTransfer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTransferring, setIsTransferring] = useState(false);

  // Check for active orders that would prevent full transfer
  const checkReservedQuantity = async (productId: string): Promise<number> => {
    try {
      const { data: activeOrders, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          orders!inner(status)
        `)
        .eq('product_id', productId)
        .not('orders.status', 'in', '(order-shipped,cancelled)');

      if (error) {
        console.error('Error checking reserved quantity:', error);
        return 0;
      }

      return (activeOrders || []).reduce((total, orderItem) => total + orderItem.quantity, 0);
    } catch (error) {
      console.error('Exception checking reserved quantity:', error);
      return 0;
    }
  };

  const transferProducts = async (transferRequest: TransferRequest) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsTransferring(true);

    try {
  

      for (const item of transferRequest.items) {
        // Get source product
        const { data: sourceProduct, error: sourceError } = await supabase
          .from('products')
          .select('*')
          .eq('id', item.productId)
          .eq('warehouse_id', transferRequest.sourceWarehouseId)
          .single();

        if (sourceError || !sourceProduct) {
          throw new Error(`Source product not found: ${item.sku}`);
        }

        // Check for reserved quantities from active orders
        const reservedQuantity = await checkReservedQuantity(item.productId);
        const availableForTransfer = sourceProduct.quantity - reservedQuantity;

        // Validate available quantity
        if (sourceProduct.quantity < item.transferQuantity) {
          throw new Error(`Insufficient stock for ${item.sku}. Available: ${sourceProduct.quantity}, Requested: ${item.transferQuantity}`);
        }

        if (item.transferQuantity > availableForTransfer) {
          throw new Error(`Cannot transfer ${item.transferQuantity} units of ${item.sku}. ${reservedQuantity} units are reserved for active orders. Maximum transferable: ${availableForTransfer}`);
        }

        // Handle batch-aware transfer
        if (item.hasBatches && item.batchAllocations && item.batchAllocations.length > 0) {
          // Transfer specific batches
          for (const batchAlloc of item.batchAllocations) {
            if (batchAlloc.quantity <= 0) continue;

            // Skip unallocated inventory - it's just tracked at product level
            if (batchAlloc.isUnallocated) {
              continue;
            }

            // Get source batch
            const { data: sourceBatch } = await supabase
              .from('product_batches')
              .select('*')
              .eq('id', batchAlloc.batchId)
              .single();

            if (!sourceBatch || sourceBatch.quantity < batchAlloc.quantity) {
              throw new Error(`Insufficient batch quantity for ${batchAlloc.batchNumber}`);
            }

            // Update or delete source batch
            const newBatchQuantity = sourceBatch.quantity - batchAlloc.quantity;
            if (newBatchQuantity > 0) {
              await supabase
                .from('product_batches')
                .update({ 
                  quantity: newBatchQuantity,
                  updated_at: new Date().toISOString() 
                })
                .eq('id', sourceBatch.id);
            } else {
              await supabase
                .from('product_batches')
                .delete()
                .eq('id', sourceBatch.id);
            }
          }
        }

        // Extract base SKU from the source product
        const baseSku = getBaseSku(sourceProduct.sku);
        
        // Create warehouse-specific SKU for destination
        const destinationSku = createWarehouseSku(baseSku, transferRequest.destinationWarehouseId);

        // Check if destination product already exists with the warehouse-specific SKU
        const { data: existingDestProduct } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .eq('sku', destinationSku)
          .eq('warehouse_id', transferRequest.destinationWarehouseId)
          .single();

        if (existingDestProduct) {
          // Product already exists in destination warehouse - update quantity
          const { error: updateError } = await supabase
            .from('products')
            .update({
              quantity: existingDestProduct.quantity + item.transferQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDestProduct.id);

          if (updateError) {
            throw new Error(`Failed to update destination product: ${updateError.message}`);
          }

          // Create or update batches in destination
          if (item.hasBatches && item.batchAllocations && item.batchAllocations.length > 0) {
            for (const batchAlloc of item.batchAllocations) {
              if (batchAlloc.quantity <= 0 || batchAlloc.isUnallocated) continue;

              // Check if batch already exists in destination
              const { data: existingDestBatch } = await supabase
                .from('product_batches')
                .select('*')
                .eq('product_id', existingDestProduct.id)
                .eq('batch_number', batchAlloc.batchNumber)
                .maybeSingle();

              if (existingDestBatch) {
                // Update existing batch
                await supabase
                  .from('product_batches')
                  .update({
                    quantity: existingDestBatch.quantity + batchAlloc.quantity,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingDestBatch.id);
              } else {
                // Create new batch
                await supabase
                  .from('product_batches')
                  .insert([{
                    product_id: existingDestProduct.id,
                    batch_number: batchAlloc.batchNumber,
                    quantity: batchAlloc.quantity,
                    expiration_date: batchAlloc.expirationDate ? batchAlloc.expirationDate.toISOString() : null,
                    cost_price: batchAlloc.costPrice,
                    received_date: new Date().toISOString(),
                    user_id: user.id,
                    warehouse_id: transferRequest.destinationWarehouseId,
                    company_id: existingDestProduct.company_id,
                    location_id: batchAlloc.locationId || null,
                  }]);
              }
            }
          }

          // Create incoming inventory history for destination
          await supabase
            .from('inventory_history')
            .insert({
              product_id: existingDestProduct.id,
              quantity: item.transferQuantity,
              transaction_type: 'incoming',
              reference: `Transfer from ${transferRequest.sourceWarehouseId}`,
              user_id: user.id,
              warehouse_id: transferRequest.destinationWarehouseId,
              company_id: existingDestProduct.company_id,
              remaining_stock: existingDestProduct.quantity + item.transferQuantity,
              notes: `Product transfer from another warehouse`
            });
        } else {
          // Create new product in destination warehouse with warehouse-specific SKU
          const { id, sku, ...sourceProductData } = sourceProduct;
          
          const newProductData = {
            ...sourceProductData,
            sku: destinationSku, // Use warehouse-specific SKU
            quantity: item.transferQuantity,
            warehouse_id: transferRequest.destinationWarehouseId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: newProduct, error: createError } = await supabase
            .from('products')
            .insert([newProductData])
            .select()
            .single();

          if (createError || !newProduct) {
            throw new Error(`Failed to create product in destination: ${createError?.message}`);
          }

          // Create batches in destination for new product
          if (item.hasBatches && item.batchAllocations && item.batchAllocations.length > 0) {
            for (const batchAlloc of item.batchAllocations) {
              if (batchAlloc.quantity <= 0 || batchAlloc.isUnallocated) continue;

              await supabase
                .from('product_batches')
                .insert([{
                  product_id: newProduct.id,
                  batch_number: batchAlloc.batchNumber,
                  quantity: batchAlloc.quantity,
                  expiration_date: batchAlloc.expirationDate ? batchAlloc.expirationDate.toISOString() : null,
                  cost_price: batchAlloc.costPrice,
                  received_date: new Date().toISOString(),
                  user_id: user.id,
                  warehouse_id: transferRequest.destinationWarehouseId,
                  company_id: newProduct.company_id,
                  location_id: batchAlloc.locationId || null,
                }]);
            }
          }

          // Create incoming inventory history for new product
          await supabase
            .from('inventory_history')
            .insert({
              product_id: newProduct.id,
              quantity: item.transferQuantity,
              transaction_type: 'incoming',
              reference: `Transfer from ${transferRequest.sourceWarehouseId}`,
              user_id: user.id,
              warehouse_id: transferRequest.destinationWarehouseId,
              company_id: newProduct.company_id,
              remaining_stock: item.transferQuantity,
              notes: `Product transfer from another warehouse`
            });
        }

        // Handle source product based on transfer type
        const newSourceQuantity = sourceProduct.quantity - item.transferQuantity;
        
        // Always update quantity instead of deleting to prevent constraint violations
        const { error: sourceUpdateError } = await supabase
          .from('products')
          .update({
            quantity: newSourceQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', sourceProduct.id);

        if (sourceUpdateError) {
          throw new Error(`Failed to update source product: ${sourceUpdateError.message}`);
        }

        // Create outgoing inventory history for source
        await supabase
          .from('inventory_history')
          .insert({
            product_id: sourceProduct.id,
            quantity: -item.transferQuantity,
            transaction_type: 'outgoing',
            reference: `Transfer to ${transferRequest.destinationWarehouseId}`,
            user_id: user.id,
            warehouse_id: transferRequest.sourceWarehouseId,
            company_id: sourceProduct.company_id,
            remaining_stock: newSourceQuantity,
            notes: `Product transfer to another warehouse`
          });
      }

      toast({
        title: "Transfer Successful",
        description: `Successfully transferred ${transferRequest.items.length} product(s)`,
        variant: "default",
      });

    
    } catch (error) {
      console.error('Product transfer failed:', error);
      toast({
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsTransferring(false);
    }
  };

  return {
    transferProducts,
    isTransferring,
    checkReservedQuantity
  };
};
