import { supabase } from '@/integrations/supabase/client';

// Workflow features are disabled - missing database tables

export const updateOrderStatusWithWorkflow = async (orderId: string, newStatus: string) => {
  try {
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

    return { success: true };
  } catch (error) {
    console.error('Exception in updateOrderStatusWithWorkflow:', error);
    throw error;
  }
};

export const getOrderShipmentInfo = async (orderId: string) => {
  try {
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

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching order shipment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in getOrderShipmentInfo:', error);
    return null;
  }
};

// Disabled workflow feature
export const createWorkflowForOrder = async () => {
  return null;
};
