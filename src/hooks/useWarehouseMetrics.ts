
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';

export interface WarehouseMetrics {
  warehouse_efficiency: number;
  efficiency_change: number;
  task_completion_rate: number;  
  completion_rate_change: number;
  order_processing_speed: number;
  processing_speed_change: number;
  inventory_accuracy: number;
  accuracy_change: number;
  warehouse_context: 'corporate_overview' | 'warehouse_specific';
  warehouse_id?: string;
  warehouse_name?: string;
  warehouse_code?: string;
  company_name?: string;
  total_orders: number;
  completed_orders: number;
  active_orders: number;
  pending_shipments: number;
  total_products: number;
  critical_stock_items: number;
  warning_stock_items: number;
  healthy_stock_items: number;
  historical_data: Array<{
    month: string;
    efficiency: number;
    orders: number;
    completed_orders: number;
  }>;
  last_updated: string;
}

export const useWarehouseMetrics = () => {
  const { selectedWarehouse } = useWarehouse();

  return useQuery({
    queryKey: ['warehouseMetrics', selectedWarehouse],
    queryFn: async (): Promise<WarehouseMetrics> => {

      
      const { data, error } = await supabase.rpc('calculate_warehouse_metrics_enhanced', {
        warehouse_uuid: selectedWarehouse
      });

      if (error) {
        console.error('Error fetching warehouse metrics:', error);
        throw error;
      }

      // Safely convert the JSON response to WarehouseMetrics
      const metrics = data as unknown as WarehouseMetrics;
      
      // Validate that we have the expected structure
      if (!metrics || typeof metrics !== 'object') {
        throw new Error('Invalid metrics data received from database');
      }

      return metrics;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};
