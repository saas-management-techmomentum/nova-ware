// COMMENTED OUT: order_statuses table does not exist
// Requires database schema updates

export interface OrderStatus {
  id: string;
  name: string;
  color: string;
  order_index: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useOrderStatuses = () => ({
  orderStatuses: [] as OrderStatus[],
  isLoading: false,
  addOrderStatus: async (statusData: any) => {},
  updateOrderStatus: async (statusId: string, updates: any) => {},
  updateOrderStatusesOrder: async (statusUpdates: any[]) => {},
  deleteOrderStatus: async (statusId: string) => {},
  fetchOrderStatuses: async () => {},
});
