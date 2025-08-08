
import { useOrdersQuery } from './queries/useOrdersQuery';

// Legacy hook - use useOrdersQuery for better performance

export interface OrderItem {
  id: string;
  order_id: string;
  sku: string;
  quantity: number;
  product_id?: string;
  unit_price?: number;
  created_at: string;
  updated_at: string;
}

export interface OrderDocument {
  id: string;
  order_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  warehouse_id?: string;
  company_id?: string;
  carrier?: string;
  tracking_number?: string;
  shipping_method?: string;
  ship_date?: string;
  shipment_status?: string;
  shipping_address?: string;
  items?: OrderItem[];
  documents?: OrderDocument[];
}

export const useWarehouseScopedOrders = () => {
  const { data, isLoading, refetch } = useOrdersQuery();
  
  return {
    orders: data?.data || [],
    isLoading,
    refetch: () => refetch().then(() => {}),
  };
};
