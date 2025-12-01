import React, { createContext, useContext, ReactNode } from 'react';
import { useWarehouseScopedOrders } from '@/hooks/useWarehouseScopedOrders';
import { useWarehouseScopedShipments, Shipment, ShipmentItem } from '@/hooks/useWarehouseScopedShipments';
import { useShipmentsRealtime } from '@/hooks/useShipmentsRealtime';
import { useOrderStatuses, OrderStatus } from '@/hooks/useOrderStatuses';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from './WarehouseContext';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useBatchAllocation } from '@/hooks/useBatchAllocation';

// Define the item type for creating new shipments (without id and shipment_id)
interface CreateShipmentItem {
  sku: string;
  name: string;
  expected_qty: number;
  received_qty?: number;
  damaged_qty?: number;
  notes?: string;
}

interface OrdersContextType {
  orders: any[];
  isLoading: boolean;
  refetch: () => void;
  addOrder: (order: any, allocationStrategy?: 'FIFO' | 'LIFO' | 'FEFO') => Promise<void>;
  updateOrder: (id: string, updates: any) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  shipments: Shipment[];
  shipmentsLoading: boolean;
  updateShipment: (shipment: Shipment) => Promise<void>;
  addShipment: (shipment: Omit<Shipment, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'items'> & { items?: CreateShipmentItem[] }) => Promise<void>;
  orderStatuses: OrderStatus[];
  orderStatusesLoading: boolean;
  addOrderStatus: (status: Omit<OrderStatus, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateOrderStatusesOrder: (statusUpdates: { id: string; order_index: number }[]) => void;
  deleteOrderStatus: (id: string) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};

interface OrdersProviderProps {
  children: ReactNode;
}

export const OrdersProvider: React.FC<OrdersProviderProps> = ({ children }) => {
  const { orders, isLoading, refetch } = useWarehouseScopedOrders();
  const { shipments, isLoading: shipmentsLoading, refetch: refetchShipments } = useWarehouseScopedShipments();
  const { 
    orderStatuses, 
    isLoading: orderStatusesLoading, 
    addOrderStatus: addStatus, 
    updateOrderStatusesOrder: updateStatusesOrder,
    deleteOrderStatus: deleteStatus 
  } = useOrderStatuses();
  const { selectedWarehouse } = useWarehouse();
  const { user } = useAuth();
  const { toast } = useToast();
  const { allocateInventory, reverseAllocation } = useBatchAllocation();

  // Set up real-time updates for shipments
  useShipmentsRealtime({
    onShipmentChange: () => {
      console.log('Real-time update triggered, refetching shipments...');
      refetchShipments();
    },
    warehouseId: selectedWarehouse || undefined,
  });

  const addOrder = async (orderData: any, allocationStrategy: 'FIFO' | 'LIFO' | 'FEFO' = 'FIFO') => {
    if (!user) {
      console.error('No user found');
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      throw new Error('User not authenticated');
    }

    if (!selectedWarehouse) {
      console.error('No warehouse selected');
      toast({
        title: "Error", 
        description: "Please select a warehouse first",
        variant: "destructive"
      });
      throw new Error('No warehouse selected');
    }

    try {
      console.log('Adding order to database with allocation strategy:', allocationStrategy, orderData);
      
      // Get warehouse and company info
      const { data: warehouseData, error: warehouseError } = await supabase
        .from('warehouses')
        .select('company_id')
        .eq('id', selectedWarehouse)
        .single();
      
      if (warehouseError) {
        console.error('Error fetching warehouse data:', warehouseError);
        throw warehouseError;
      }

      const companyId = warehouseData?.company_id;

      // Insert the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          invoice_id: orderData.invoice_id,
          invoice_number: orderData.invoice_number,
          customer_name: orderData.client,
          status: orderData.status,
          user_id: user.id,
          warehouse_id: selectedWarehouse,
          company_id: companyId
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Error adding order:', orderError);
        toast({
          title: "Error",
          description: "Failed to create order",
          variant: "destructive"
        });
        throw orderError;
      }

      console.log('Order added successfully:', order);

      // If there are items, add them and allocate inventory using batch system
      if (orderData.items && orderData.items.length > 0) {
        try {
          // First, insert order items
          const { data: insertedItems, error: itemsError } = await supabase
            .from('order_items')
            .insert(
              orderData.items.map((item: any) => ({
                order_id: order.id,
                sku: item.sku,
                quantity: item.qty,
                product_id: item.product_id,
                unit_price: item.unit_price
              }))
            )
            .select();

          if (itemsError) {
            console.error('Error adding order items:', itemsError);
            await supabase.from('orders').delete().eq('id', order.id);
            toast({
              title: "Error",
              description: "Failed to add order items: " + itemsError.message,
              variant: "destructive"
            });
            throw itemsError;
          }

          // Now allocate inventory from batches for each item
          for (const orderItem of insertedItems || []) {
            try {
              const allocations = await allocateInventory(
                order.id,
                orderItem.id,
                orderItem.product_id!,
                orderItem.quantity,
                allocationStrategy
              );
              
              console.log(`Allocated ${orderItem.quantity} units for ${orderItem.sku} using ${allocationStrategy}:`, allocations);
            } catch (allocationError: any) {
              console.error('Allocation error:', allocationError);
              
              // Rollback: delete order and items
              await supabase.from('orders').delete().eq('id', order.id);
              
              toast({
                title: "Allocation Failed",
                description: allocationError.message || "Failed to allocate inventory from batches",
                variant: "destructive"
              });
              throw allocationError;
            }
          }

          console.log(`Order items added and inventory allocated using ${allocationStrategy} strategy`);
          
        } catch (error) {
          console.error('Error in order items/allocation:', error);
          throw error;
        }
      }

      toast({
        title: "Success",
        description: `Order created successfully using ${allocationStrategy} allocation`,
      });

      // Trigger refetch to show the new order
      await refetch();
    } catch (error) {
      console.error('Exception adding order:', error);
      throw error;
    }
  };

  const updateOrder = async (id: string, updates: any) => {
    if (!user) {
      console.error('No user found');
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Updating order:', id, updates);
      
      // Map UI status values to database status values if needed
      let dbUpdates = { ...updates };
      if (updates.status) {
        // Handle status mapping - some statuses need to be mapped to DB equivalents
        const statusMap: { [key: string]: string } = {
          'shipped': 'order-shipped',
          'ready-to-ship': 'order-ready',
          // Keep other statuses as-is
        };
        
        dbUpdates.status = statusMap[updates.status] || updates.status;
      }

      const { error } = await supabase
        .from('orders')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating order:', error);
        toast({
          title: "Error",
          description: "Failed to update order: " + error.message,
          variant: "destructive"
        });
        throw error;
      }

      // Auto-create outgoing shipment when order status changes to any shipping status
      const outgoingShipmentStatuses = ['order-ready', 'ready-to-ship', 'shipped', 'order-shipped'];
      if (outgoingShipmentStatuses.includes(dbUpdates.status)) {
        console.log('Order marked as shipped/ready, checking for outgoing shipment...');
        
        // Get the order details to create shipment
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('id', id)
          .single();
        
        if (orderData) {
          // Check if outgoing shipment already exists for this order
          const { data: existingShipment } = await supabase
            .from('shipments')
            .select('id')
            .eq('order_reference', orderData.invoice_number || id)
            .eq('shipment_type', 'outgoing')
            .maybeSingle();

          if (!existingShipment) {
            console.log('Creating outgoing shipment for order:', id);
            
            // Get warehouse and company info
            const { data: warehouseData } = await supabase
              .from('warehouses')
              .select('company_id')
              .eq('id', selectedWarehouse)
              .single();
            
            // Create outgoing shipment record
            const { data: newShipment, error: shipmentError } = await supabase
              .from('shipments')
              .insert([{
                order_id: id,
                supplier: orderData.customer_name,
                order_reference: orderData.invoice_number || id,
                expected_date: orderData.ship_date || new Date().toISOString().split('T')[0],
                status: (() => {
                  const statusMapping: { [key: string]: string } = {
                    'order-ready': 'ready-to-ship',
                    'ready-to-ship': 'ready-to-ship',
                    'shipped': 'shipped',
                    'order-shipped': 'shipped'
                  };
                  return statusMapping[dbUpdates.status] || 'ready-to-ship';
                })(),
                user_id: user.id,
                warehouse_id: selectedWarehouse,
                company_id: warehouseData?.company_id,
                shipment_type: 'outgoing'
              }])
              .select()
              .single();

            if (shipmentError) {
              console.error('Error creating outgoing shipment:', shipmentError);
            } else if (newShipment && orderData.items && orderData.items.length > 0) {
              // Create shipment items from order items
              const shipmentItems = orderData.items.map((item: any) => ({
                shipment_id: newShipment.id,
                sku: item.sku,
                name: item.sku,
                expected_qty: item.quantity,
                received_qty: 0
              }));
              
              const { error: itemsError } = await supabase
                .from('shipment_items')
                .insert(shipmentItems);

              if (itemsError) {
                console.error('Error creating shipment items:', itemsError);
              } else {
                console.log('Outgoing shipment created successfully:', newShipment.id);
              }
            }
          } else {
            console.log('Outgoing shipment already exists for this order');
          }
        }
      }

      toast({
        title: "Success",
        description: "Order updated successfully",
      });

      // Trigger refetch to show updated data
      await refetch();
    } catch (error) {
      console.error('Exception updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteOrder = async (id: string) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      console.log('Deleting order:', id);
      
      // First, reverse any batch allocations
      try {
        await reverseAllocation(id);
        console.log('Batch allocations reversed for order:', id);
      } catch (reverseError) {
        console.warn('Error reversing allocations (order may not have allocations):', reverseError);
      }
      
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting order:', error);
        toast({
          title: "Error",
          description: "Failed to delete order",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Order deleted and inventory restored",
      });
      
      refetch();
    } catch (error) {
      console.error('Exception deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive"
      });
    }
  };

  const addShipment = async (shipmentData: Omit<Shipment, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'items'> & { items?: CreateShipmentItem[] }) => {
    if (!user) {
      console.error('No user found');
      throw new Error('User not authenticated');
    }

    try {
      console.log('Adding shipment to database:', shipmentData);
      
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

      // Insert the shipment
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .insert([{
          supplier: shipmentData.supplier,
          order_reference: shipmentData.order_reference,
          expected_date: shipmentData.expected_date,
          status: shipmentData.status || 'pending',
          user_id: user.id,
          warehouse_id: warehouseId,
          company_id: companyId
        }])
        .select()
        .single();

      if (shipmentError) {
        console.error('Error adding shipment:', shipmentError);
        throw shipmentError;
      }

      console.log('Shipment added successfully:', shipment);

      // If there are items, add them
      if (shipmentData.items && shipmentData.items.length > 0) {
        const itemsToInsert = shipmentData.items.map(item => ({
          shipment_id: shipment.id,
          sku: item.sku,
          name: item.name,
          expected_qty: item.expected_qty,
          received_qty: item.received_qty || 0,
          damaged_qty: item.damaged_qty || 0,
          notes: item.notes
        }));

        const { error: itemsError } = await supabase
          .from('shipment_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error adding shipment items:', itemsError);
          throw itemsError;
        }
      }

      // Trigger refetch
      await refetchShipments();
    } catch (error) {
      console.error('Exception adding shipment:', error);
      throw error;
    }
  };

  const updateShipment = async (shipmentData: Shipment) => {
    if (!user) {
      console.error('No user found');
      throw new Error('User not authenticated');
    }

    try {
      console.log('Updating shipment:', shipmentData.id, shipmentData);
      
      // Update the shipment
      const { error: shipmentError } = await supabase
        .from('shipments')
        .update({
          supplier: shipmentData.supplier,
          order_reference: shipmentData.order_reference,
          expected_date: shipmentData.expected_date,
          received_date: shipmentData.received_date,
          status: shipmentData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', shipmentData.id)
        .eq('user_id', user.id);

      if (shipmentError) {
        console.error('Error updating shipment:', shipmentError);
        throw shipmentError;
      }

      // Update shipment items
      if (shipmentData.items && shipmentData.items.length > 0) {
        // Delete existing items and recreate them (simpler approach)
        await supabase
          .from('shipment_items')
          .delete()
          .eq('shipment_id', shipmentData.id);

        const itemsToInsert = shipmentData.items.map(item => ({
          shipment_id: shipmentData.id,
          sku: item.sku,
          name: item.name,
          expected_qty: item.expected_qty,
          received_qty: item.received_qty || 0,
          damaged_qty: item.damaged_qty || 0,
          notes: item.notes
        }));

        const { error: itemsError } = await supabase
          .from('shipment_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error updating shipment items:', itemsError);
          throw itemsError;
        }
      }

      console.log('Shipment updated successfully');
      await refetchShipments();
    } catch (error) {
      console.error('Exception updating shipment:', error);
      throw error;
    }
  };

  const addOrderStatus = (status: Omit<OrderStatus, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    addStatus(status);
  };

  const updateOrderStatusesOrder = (statusUpdates: { id: string; order_index: number }[]) => {
    updateStatusesOrder(statusUpdates);
  };

  const deleteOrderStatus = (id: string) => {
    deleteStatus(id);
  };

  const value = {
    orders,
    isLoading,
    refetch,
    addOrder,
    updateOrder,
    deleteOrder,
    shipments,
    shipmentsLoading,
    updateShipment,
    addShipment,
    orderStatuses,
    orderStatusesLoading,
    addOrderStatus,
    updateOrderStatusesOrder,
    deleteOrderStatus,
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};
