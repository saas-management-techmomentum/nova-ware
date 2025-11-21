
import { useShipmentsQuery } from './queries/useShipmentsQuery';

// Legacy hook - use useShipmentsQuery for better performance

export interface Shipment {
  id: string;
  supplier: string;
  order_reference: string;
  expected_date: string;
  received_date?: string;
  status: 'pending' | 'partially-received' | 'received' | 'inspected';
  user_id: string;
  warehouse_id?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
  items: ShipmentItem[];
}

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  sku: string;
  name: string;
  expected_qty: number;
  received_qty?: number;
  damaged_qty?: number;
  notes?: string;
}

export const useWarehouseScopedShipments = () => {
  const { data, isLoading, refetch } = useShipmentsQuery();
  
  return {
    shipments: data?.data || [],
    isLoading,
    refetch: () => refetch().then(() => {}),
  };
};
