// Stub hook for order statuses - to be implemented with proper database schema
export interface OrderStatus {
  id: string;
  name: string;
  color: string;
  position: number;
  order_index?: number;
}

export const useOrderStatuses = () => {
  const orderStatuses: OrderStatus[] = [
    { id: '1', name: 'Pending', color: 'bg-yellow-500', position: 0, order_index: 0 },
    { id: '2', name: 'Processing', color: 'bg-blue-500', position: 1, order_index: 1 },
    { id: '3', name: 'Shipped', color: 'bg-purple-500', position: 2, order_index: 2 },
    { id: '4', name: 'Delivered', color: 'bg-green-500', position: 3, order_index: 3 },
  ];

  const addOrderStatus = async (data: any) => {
    console.warn('addOrderStatus not implemented - requires database schema');
  };

  const updateOrderStatus = async (id: string, data: any) => {
    console.warn('updateOrderStatus not implemented - requires database schema');
  };

  const deleteOrderStatus = async (id: string) => {
    console.warn('deleteOrderStatus not implemented - requires database schema');
  };

  const reorderStatuses = async () => {
    console.warn('reorderStatuses not implemented - requires database schema');
  };

  const updateOrderStatusesOrder = async (updates: any) => {
    console.warn('updateOrderStatusesOrder not implemented - requires database schema');
  };

  return {
    orderStatuses,
    addOrderStatus,
    updateOrderStatus,
    deleteOrderStatus,
    reorderStatuses,
    updateOrderStatusesOrder,
    isLoading: false,
  };
};
