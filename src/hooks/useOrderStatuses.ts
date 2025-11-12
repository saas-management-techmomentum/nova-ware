
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface OrderStatus {
  id: string;
  name: string;
  color: string;
  order_index: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useOrderStatuses = () => {
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOrderStatuses = async () => {
    if (!user) {
      setOrderStatuses([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('order_statuses')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching order statuses:', error);
        toast({
          title: "Error",
          description: "Failed to load order statuses",
          variant: "destructive"
        });
        return;
      }

      setOrderStatuses(data || []);
    } catch (error) {
      console.error('Exception fetching order statuses:', error);
      toast({
        title: "Error", 
        description: "Failed to load order statuses",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addOrderStatus = async (statusData: Omit<OrderStatus, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('order_statuses')
        .insert([{
          ...statusData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding order status:', error);
        toast({
          title: "Error",
          description: "Failed to add order status",
          variant: "destructive"
        });
        return;
      }

      setOrderStatuses(prev => [...prev, data].sort((a, b) => a.order_index - b.order_index));
      toast({
        title: "Success",
        description: "Order status added successfully"
      });
    } catch (error) {
      console.error('Exception adding order status:', error);
      toast({
        title: "Error",
        description: "Failed to add order status", 
        variant: "destructive"
      });
    }
  };

  const updateOrderStatus = async (statusId: string, updates: Partial<OrderStatus>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('order_statuses')
        .update(updates)
        .eq('id', statusId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating order status:', error);
        toast({
          title: "Error",
          description: "Failed to update order status",
          variant: "destructive"
        });
        return;
      }

      setOrderStatuses(prev => 
        prev.map(status => 
          status.id === statusId ? { ...status, ...updates } : status
        ).sort((a, b) => a.order_index - b.order_index)
      );
    } catch (error) {
      console.error('Exception updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const updateOrderStatusesOrder = async (statusUpdates: { id: string; order_index: number }[]) => {
    if (!user) return;

    try {
      // Optimistically update the UI
      const previousStatuses = [...orderStatuses];
      const updatedStatuses = orderStatuses.map(status => {
        const update = statusUpdates.find(u => u.id === status.id);
        return update ? { ...status, order_index: update.order_index } : status;
      }).sort((a, b) => a.order_index - b.order_index);
      
      setOrderStatuses(updatedStatuses);

      // Use a transaction-like approach: update all at once with a single query
      // First, we'll temporarily set all affected statuses to negative indices to avoid conflicts
      const tempUpdates = statusUpdates.map((update, index) => ({
        ...update,
        order_index: -(index + 1000) // Use negative values to avoid conflicts
      }));

      // Step 1: Set temporary negative indices
      for (const update of tempUpdates) {
        const { error } = await supabase
          .from('order_statuses')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error in temp update:', error);
          // Revert optimistic update
          setOrderStatuses(previousStatuses);
          toast({
            title: "Error",
            description: "Failed to reorder statuses",
            variant: "destructive"
          });
          return;
        }
      }

      // Step 2: Set final positive indices
      for (const update of statusUpdates) {
        const { error } = await supabase
          .from('order_statuses')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error in final update:', error);
          // Revert optimistic update
          setOrderStatuses(previousStatuses);
          toast({
            title: "Error",
            description: "Failed to reorder statuses",
            variant: "destructive"
          });
          return;
        }
      }

      toast({
        title: "Success",
        description: "Status order updated successfully"
      });
    } catch (error) {
      console.error('Exception updating order statuses order:', error);
      toast({
        title: "Error",
        description: "Failed to reorder statuses",
        variant: "destructive"
      });
    }
  };

  const deleteOrderStatus = async (statusId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('order_statuses')
        .delete()
        .eq('id', statusId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting order status:', error);
        toast({
          title: "Error",
          description: "Failed to delete order status",
          variant: "destructive"
        });
        return;
      }

      setOrderStatuses(prev => prev.filter(status => status.id !== statusId));
      toast({
        title: "Success",
        description: "Order status deleted successfully"
      });
    } catch (error) {
      console.error('Exception deleting order status:', error);
      toast({
        title: "Error",
        description: "Failed to delete order status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchOrderStatuses();
  }, [user]);

  return {
    orderStatuses,
    isLoading,
    addOrderStatus,
    updateOrderStatus,
    updateOrderStatusesOrder,
    deleteOrderStatus,
    refetch: fetchOrderStatuses
  };
};
