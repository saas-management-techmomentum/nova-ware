import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useWarehouseMetricsRealtime = (selectedWarehouse?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for warehouse metrics');

    // Subscribe to orders changes
    const ordersChannel = supabase
      .channel('warehouse-metrics-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}${selectedWarehouse ? ` and warehouse_id=eq.${selectedWarehouse}` : ''}`
        },
        (payload) => {
          console.log('Orders changed, refreshing metrics:', payload);
          
          // Show notification for significant order status changes
          if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            const newOrder = payload.new as any;
            const oldOrder = payload.old as any;
            
            if (newOrder.status !== oldOrder.status && newOrder.status === 'order-shipped') {
              toast({
                title: "Order Completed",
                description: `Order ${newOrder.id} has been shipped - metrics updated`,
                duration: 3000,
              });
            }
          }
          
          // Invalidate and refetch warehouse metrics
          queryClient.invalidateQueries({ queryKey: ['warehouseMetrics', selectedWarehouse] });
        }
      )
      .subscribe();

    // Subscribe to products changes  
    const productsChannel = supabase
      .channel('warehouse-metrics-products')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}${selectedWarehouse ? ` and warehouse_id=eq.${selectedWarehouse}` : ''}`
        },
        (payload) => {
          console.log('Products changed, refreshing metrics:', payload);
          queryClient.invalidateQueries({ queryKey: ['warehouseMetrics', selectedWarehouse] });
        }
      )
      .subscribe();

    // Subscribe to inventory history changes
    const inventoryChannel = supabase
      .channel('warehouse-metrics-inventory')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_history',
          filter: `user_id=eq.${user.id}${selectedWarehouse ? ` and warehouse_id=eq.${selectedWarehouse}` : ''}`
        },
        (payload) => {
          console.log('Inventory history changed, refreshing metrics:', payload);
          queryClient.invalidateQueries({ queryKey: ['warehouseMetrics', selectedWarehouse] });
          
          // Show toast notification for significant inventory changes
          if (payload.eventType === 'INSERT' && payload.new) {
            const transaction = payload.new as any;
            if (Math.abs(transaction.quantity) >= 50) { // Large quantity changes
              toast({
                title: "Inventory Update",
                description: `Large ${transaction.transaction_type} of ${Math.abs(transaction.quantity)} units recorded`,
                duration: 3000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(inventoryChannel);
    };
  }, [user, selectedWarehouse, queryClient]);
};