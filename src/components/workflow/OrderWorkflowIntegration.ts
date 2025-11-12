import { supabase } from '@/integrations/supabase/client';

// This module handles the integration between Order Workflow and Outgoing Shipments
// When an order reaches "Ready to Ship" status through the workflow, 
// the database trigger will automatically create an outgoing shipment

export const updateOrderStatusWithWorkflow = async (orderId: string, newStatus: string) => {
  try {
    // Update order status - this will trigger the database function to create outgoing shipment
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }

    console.log(`Order ${orderId} status updated to ${newStatus}`);
    
    // If status is 'order-ready' (Ready to Ship), the trigger will automatically:
    // 1. Create an outgoing shipment record
    // 2. Transfer order items to shipment items
    // 3. Link the shipment back to the order
    
    return { success: true };
  } catch (error) {
    console.error('Exception in updateOrderStatusWithWorkflow:', error);
    throw error;
  }
};

export const getOrderShipmentInfo = async (orderId: string) => {
  try {
    // Get the outgoing shipment linked to this order
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        id,
        status,
        expected_date,
        tracking_number,
        customer_name,
        shipping_address,
        shipment_items(
          id,
          sku,
          name,
          expected_qty
        )
      `)
      .eq('source_order_id', orderId)
      .eq('shipment_type', 'outgoing')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching order shipment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in getOrderShipmentInfo:', error);
    return null;
  }
};