import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';

export interface OrderStatus {
  id: string;
  name: string;
  color: string;
  order_index: number;
  user_id: string;
  company_id: string;
  warehouse_id?: string;
  created_at: string;
  updated_at: string;
}

export const useOrderStatuses = () => {
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrderStatuses = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('order_statuses')
        .select('*')
        .order('order_index', { ascending: true });

      if (selectedWarehouse) {
        query = query.or(`warehouse_id.eq.${selectedWarehouse},warehouse_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrderStatuses(data || []);
    } catch (error) {
      console.error('Error fetching order statuses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatuses();
  }, [user, selectedWarehouse]);

  const addOrderStatus = async (statusData: Partial<OrderStatus> & { company_id?: string; warehouse_id?: string }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('order_statuses')
        .insert([{
          name: statusData.name!,
          color: statusData.color,
          order_index: statusData.order_index!,
          user_id: user.id,
          company_id: statusData.company_id,
          warehouse_id: statusData.warehouse_id || selectedWarehouse,
        }]);

      if (error) throw error;
      await fetchOrderStatuses();
    } catch (error) {
      console.error('Error adding order status:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (statusId: string, updates: Partial<OrderStatus>) => {
    try {
      const { error } = await supabase
        .from('order_statuses')
        .update(updates)
        .eq('id', statusId);

      if (error) throw error;
      await fetchOrderStatuses();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const updateOrderStatusesOrder = async (statusUpdates: { id: string; order_index: number }[]) => {
    try {
      const updates = statusUpdates.map((update) =>
        supabase
          .from('order_statuses')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      );

      await Promise.all(updates);
      await fetchOrderStatuses();
    } catch (error) {
      console.error('Error updating order statuses order:', error);
      throw error;
    }
  };

  const deleteOrderStatus = async (statusId: string) => {
    try {
      const { error } = await supabase
        .from('order_statuses')
        .delete()
        .eq('id', statusId);

      if (error) throw error;
      await fetchOrderStatuses();
    } catch (error) {
      console.error('Error deleting order status:', error);
      throw error;
    }
  };

  return {
    orderStatuses,
    isLoading,
    addOrderStatus,
    updateOrderStatus,
    updateOrderStatusesOrder,
    deleteOrderStatus,
    fetchOrderStatuses,
  };
};
