
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
      console.log('Fetching warehouse metrics for:', selectedWarehouse || 'corporate overview');
      
      const { data, error } = await supabase.rpc('calculate_warehouse_metrics', 
        selectedWarehouse ? { warehouse_uuid: selectedWarehouse } : {}
      );

      if (error) {
        console.error('Error fetching warehouse metrics:', error);
        // Return empty metrics instead of throwing for 404/missing function
        if (error.code === 'PGRST202' || error.message?.includes('not found')) {
          console.warn('Warehouse metrics function not available, returning defaults');
          return {
            warehouse_efficiency: 0,
            efficiency_change: 0,
            task_completion_rate: 0,
            completion_rate_change: 0,
            order_processing_speed: 0,
            processing_speed_change: 0,
            inventory_accuracy: 0,
            accuracy_change: 0,
            warehouse_context: selectedWarehouse ? 'warehouse_specific' : 'corporate_overview',
            warehouse_id: selectedWarehouse,
            total_orders: 0,
            completed_orders: 0,
            active_orders: 0,
            pending_shipments: 0,
            total_products: 0,
            critical_stock_items: 0,
            warning_stock_items: 0,
            healthy_stock_items: 0,
            historical_data: [],
            last_updated: new Date().toISOString()
          };
        }
        throw error;
      }

      const metrics = data as unknown as WarehouseMetrics;
      
      if (!metrics || typeof metrics !== 'object') {
        throw new Error('Invalid metrics data received from database');
      }

      return metrics;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
};
