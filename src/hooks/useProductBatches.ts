import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { ProductBatch } from '@/types/inventory';

export const useProductBatches = (productId?: string) => {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();

  const fetchBatches = async (id?: string) => {
    if (!user || !id) return;
    
    setIsLoading(true);
    try {
      let query = supabase
      .from('product_batches')
      .select('*')
        .eq('product_id', id)
        .eq('user_id', user.id)
        .order('expiration_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (selectedWarehouse) {
        query = query.eq('warehouse_id', selectedWarehouse);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching batches:', error);
        return;
      }

      const transformedBatches: ProductBatch[] = (data || []).map(batch => ({
        id: batch.id,
        product_id: batch.product_id,
        batch_number: batch.batch_number,
        expiration_date: batch.expiration_date ? new Date(batch.expiration_date) : null,
        quantity: batch.quantity,
        cost_price: batch.cost_price || 0,
        received_date: new Date(batch.received_date),
        supplier_reference: batch.supplier_reference,
        notes: batch.notes,
        user_id: batch.user_id,
        warehouse_id: batch.warehouse_id,
        company_id: batch.company_id,
        location_id: batch.location_id,
        location_name: undefined, // pallet_locations relation disabled
        created_at: new Date(batch.created_at),
        updated_at: new Date(batch.updated_at)
      }));

      setBatches(transformedBatches);
    } catch (error) {
      console.error('Exception fetching batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBatch = async (batchData: Partial<ProductBatch>) => {
    if (!user || !productId) return;

    try {
      // Validate quantity against available stock
      const { data: product } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', productId)
        .single();

      if (product) {
        const totalBatchQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
        const availableStock = product.quantity - totalBatchQuantity;
        
        if ((batchData.quantity || 0) > availableStock) {
          throw new Error(`Quantity exceeds available stock. Maximum: ${availableStock} units`);
        }
      }

      // Get warehouse and company info if warehouse is selected
      let warehouseId = selectedWarehouse;
      let companyId = null;
      
      if (selectedWarehouse) {
        const { data: warehouseData } = await supabase
          .from('warehouses')
          .select('company_id')
          .eq('id', selectedWarehouse)
          .single();
        
        companyId = warehouseData?.company_id;
      }

      // Generate batch number if not provided
      let batchNumber = batchData.batch_number;
      if (!batchNumber) {
        const { data: generatedNumber } = await supabase
          .rpc('generate_batch_number', {
            product_uuid: productId,
            user_uuid: user.id
          });
        batchNumber = generatedNumber;
      }

      const { data, error } = await supabase
        .from('product_batches')
        .insert([{
          product_id: productId,
          batch_number: batchNumber,
          expiration_date: batchData.expiration_date?.toISOString(),
          quantity: batchData.quantity || 0,
          cost_price: batchData.cost_price || 0,
          supplier_reference: batchData.supplier_reference,
          notes: batchData.notes,
          location_id: batchData.location_id,
          user_id: user.id,
          warehouse_id: warehouseId,
          company_id: companyId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating batch:', error);
        throw error;
      }

      await fetchBatches(productId);
      return data;
    } catch (error) {
      console.error('Exception creating batch:', error);
      throw error;
    }
  };

  const updateBatch = async (batchId: string, updates: Partial<ProductBatch>) => {
    if (!user) return;

    try {
      // Validate quantity against available stock (excluding current batch)
      const { data: product } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', productId)
        .single();

      if (product && updates.quantity !== undefined) {
        const totalOtherBatchQuantity = batches
          .filter(batch => batch.id !== batchId)
          .reduce((sum, batch) => sum + batch.quantity, 0);
        const availableStock = product.quantity - totalOtherBatchQuantity;
        
        if (updates.quantity > availableStock) {
          throw new Error(`Quantity exceeds available stock. Maximum: ${availableStock} units`);
        }
      }

      const { error } = await supabase
        .from('product_batches')
        .update({
          expiration_date: updates.expiration_date?.toISOString(),
          quantity: updates.quantity,
          cost_price: updates.cost_price,
          supplier_reference: updates.supplier_reference,
          notes: updates.notes,
          location_id: updates.location_id
        })
        .eq('id', batchId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating batch:', error);
        throw error;
      }

      await fetchBatches(productId);
    } catch (error) {
      console.error('Exception updating batch:', error);
      throw error;
    }
  };

  const deleteBatch = async (batchId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('product_batches')
        .delete()
        .eq('id', batchId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting batch:', error);
        throw error;
      }

      await fetchBatches(productId);
    } catch (error) {
      console.error('Exception deleting batch:', error);
      throw error;
    }
  };

  const allocateInventory = async (requiredQuantity: number) => {
    if (!user || !productId) return [];

    try {
      const { data, error } = await supabase
        .rpc('allocate_inventory_fefo', {
          product_uuid: productId,
          required_quantity: requiredQuantity,
          user_uuid: user.id,
          warehouse_uuid: selectedWarehouse
        });

      if (error) {
        console.error('Error allocating inventory:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exception allocating inventory:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (productId) {
      fetchBatches(productId);
    }
  }, [productId, selectedWarehouse, user]);

  return {
    batches,
    isLoading,
    refetch: () => fetchBatches(productId),
    createBatch,
    updateBatch,
    deleteBatch,
    allocateInventory
  };
};