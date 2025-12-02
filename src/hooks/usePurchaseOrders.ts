import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { queryClient } from '@/lib/queryClient';

export interface PurchaseOrder {
  id: string;
  user_id: string;
  warehouse_id?: string;
  company_id?: string;
  vendor_name: string;
  vendor_contact?: string;
  vendor_email?: string;
  po_number: string;
  order_date: string;
  expected_delivery_date?: string;
  total_amount: number;
  status: 'draft' | 'approved' | 'confirmed' | 'received' | 'partially_received' | 'closed';
  notes?: string;
  created_at: string;
  updated_at: string;
  po_items?: POItem[];
}

export interface POItem {
  id: string;
  po_id: string;
  product_id?: string;
  item_sku: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  received_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePurchaseOrderData {
  vendor_name: string;
  vendor_contact?: string;
  vendor_email?: string;
  order_date: string;
  expected_delivery_date?: string;
  notes?: string;
  warehouse_id?: string;
  company_id?: string;
  items: CreatePOItemData[];
}

export interface CreatePOItemData {
  product_id?: string;
  item_sku: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

export const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();

  const fetchPurchaseOrders = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
   
      
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          po_items (*)
        `)
        .order('created_at', { ascending: false });


      if (error) throw error;

      setPurchaseOrders((data || []) as PurchaseOrder[]);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch purchase orders');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePONumber = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_po_number');
    if (error) throw error;
    return data;
  };

  const createPurchaseOrder = async (orderData: CreatePurchaseOrderData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Generate PO number
      const poNumber = await generatePONumber();
      
      // Calculate total amount
      const totalAmount = orderData.items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0
      );

      // Get user's company info for warehouse assignment
      const { data: companyData } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      // Create the purchase order with warehouse and company context
      const { items, ...poDataWithoutItems } = orderData;
      
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          ...poDataWithoutItems,
          user_id: user.id,
          warehouse_id: orderData.warehouse_id || selectedWarehouse || undefined,
          company_id: companyData?.company_id,
          po_number: poNumber,
          total_amount: totalAmount
        }])
        .select()
        .single();

      if (poError) throw poError;

      // Create the PO items
      const poItems = orderData.items.map(item => ({
        po_id: poData.id,
        ...item,
        subtotal: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('po_items')
        .insert(poItems);

      if (itemsError) throw itemsError;

      // Fetch the complete PO with items
      const { data: completePO, error: fetchError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          po_items (*)
        `)
        .eq('id', poData.id)
        .single();

      if (fetchError) throw fetchError;

      setPurchaseOrders(prev => [completePO as PurchaseOrder, ...prev]);
      return completePO;
    } catch (err) {
      console.error('Error creating purchase order:', err);
      throw err;
    }
  };

  const updatePurchaseOrderStatus = async (id: string, status: PurchaseOrder['status']) => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          po_items (*)
        `)
        .single();

      if (error) throw error;

      // If status is 'approved', create pending vendor bill for AP
      if (status === 'approved') {
        await createPendingVendorBillFromPO(data as PurchaseOrder);
      }

      // If status is 'received', update inventory and create accounting entries
      if (status === 'received') {
        await processReceivedPO(data as PurchaseOrder);
      }

      setPurchaseOrders(prev => 
        prev.map(po => po.id === id ? data as PurchaseOrder : po)
      );
      return data;
    } catch (err) {
      console.error('Error updating purchase order status:', err);
      throw err;
    }
  };

  const processReceivedPO = async (po: PurchaseOrder) => {
    try {
      // Update inventory for each item
      if (po.po_items) {
        for (const item of po.po_items) {
          if (item.product_id) {
            // Get current product to calculate new quantity
            const { data: product, error: getError } = await supabase
              .from('products')
              .select('quantity')
              .eq('id', item.product_id)
              .single();

            if (getError) throw getError;

            // Update product quantity
            const { error: inventoryError } = await supabase
              .from('products')
              .update({
                quantity: (product.quantity || 0) + item.quantity
              })
              .eq('id', item.product_id);

            if (inventoryError) throw inventoryError;

            // Create inventory history record
            await supabase
              .from('inventory_history')
              .insert([{
                product_id: item.product_id,
                quantity: item.quantity,
                transaction_type: 'incoming',
                reference: `PO: ${po.po_number}`,
                user_id: po.user_id,
                warehouse_id: po.warehouse_id,
                company_id: po.company_id,
                remaining_stock: 0, // Will be updated by trigger
                notes: `Received via Purchase Order ${po.po_number}`
              }]);
          }
        }
      }

      // Create accounts payable entry automatically
      await createVendorBillFromPO(po);
      
    } catch (err) {
      console.error('Error processing received PO:', err);
      throw err;
    }
  };

  // Create pending vendor bill when PO is approved (forecasted liability)
  const createPendingVendorBillFromPO = async (po: PurchaseOrder) => {
    try {
      // Check if a vendor bill already exists for this PO
      const { data: existingBills, error: checkError } = await supabase
        .from('vendor_bills')
        .select('id')
        .eq('po_id', po.id);

      if (checkError) throw checkError;

      // If a bill already exists, don't create another one
      if (existingBills && existingBills.length > 0) {

        return;
      }

      // Generate bill number
      const billNumber = `PENDING-${po.po_number}`;
      
      // Calculate expected due date based on vendor payment terms (assume 30 days from PO date)
      const expectedDueDate = new Date(po.order_date);
      expectedDueDate.setDate(expectedDueDate.getDate() + 30);

      const vendorBill = {
        bill_number: billNumber,
        vendor_name: po.vendor_name,
        po_id: po.id,
        issue_date: po.order_date,
        due_date: expectedDueDate.toISOString().split('T')[0],
        amount: po.total_amount,
        status: 'pending_invoice',
        description: `Forecasted liability for approved PO ${po.po_number}`,
        notes: `Auto-generated from approved Purchase Order ${po.po_number}. Status will update when vendor invoice is received.`,
        user_id: po.user_id,
        warehouse_id: po.warehouse_id,
        company_id: po.company_id
      };

      const { error } = await supabase
        .from('vendor_bills')
        .insert([vendorBill]);

      if (error) throw error;
      
    } catch (err) {
      console.error('Error creating pending vendor bill from PO:', err);
    }
  };

  // Create actual vendor bill when PO is received (for inventory updates)
  const createVendorBillFromPO = async (po: PurchaseOrder) => {
    try {
      // Check if we need to update existing pending bill to received status
      const { data: existingBills, error: checkError } = await supabase
        .from('vendor_bills')
        .select('*')
        .eq('po_id', po.id);

      if (checkError) throw checkError;

      if (existingBills && existingBills.length > 0) {
        // Update existing pending bill to unpaid status (actual invoice received)
        const existingBill = existingBills[0];
        if (existingBill.status === 'pending_invoice') {
          const { error: updateError } = await supabase
            .from('vendor_bills')
            .update({
              status: 'unpaid',
              bill_number: `BILL-${po.po_number}-${Date.now()}`,
              issue_date: new Date().toISOString().split('T')[0],
              notes: `Updated from pending to actual vendor bill for received PO ${po.po_number}`
            })
            .eq('id', existingBill.id);

          if (updateError) throw updateError;
     
        }
        return;
      }

      // If no existing bill, create new one (fallback case)
      const billNumber = `BILL-${po.po_number}-${Date.now()}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const vendorBill = {
        bill_number: billNumber,
        vendor_name: po.vendor_name,
        po_id: po.id,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        amount: po.total_amount,
        status: 'unpaid',
        description: `Vendor bill for received PO ${po.po_number}`,
        notes: `Auto-generated from received Purchase Order ${po.po_number}`,
        user_id: po.user_id,
        warehouse_id: po.warehouse_id,
        company_id: po.company_id
      };

      const { error } = await supabase
        .from('vendor_bills')
        .insert([vendorBill]);

      if (error) throw error;
  
      
    } catch (err) {
      console.error('Error creating vendor bill from PO:', err);
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    try {
      // First delete all PO items (they should cascade delete, but let's be explicit)
      const { error: itemsError } = await supabase
        .from('po_items')
        .delete()
        .eq('po_id', id);

      if (itemsError) throw itemsError;

      // Then delete the purchase order
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPurchaseOrders(prev => prev.filter(po => po.id !== id));
    } catch (err) {
      console.error('Error deleting purchase order:', err);
      throw err;
    }
  };

  const updatePurchaseOrder = async (id: string, orderData: CreatePurchaseOrderData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Calculate total amount
      const totalAmount = orderData.items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0
      );

      // Update the purchase order
      const { items, ...poDataWithoutItems } = orderData;
      
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .update({
          ...poDataWithoutItems,
          total_amount: totalAmount
        })
        .eq('id', id)
        .select()
        .single();

      if (poError) throw poError;

      // Delete existing PO items
      const { error: deleteItemsError } = await supabase
        .from('po_items')
        .delete()
        .eq('po_id', id);

      if (deleteItemsError) throw deleteItemsError;

      // Create updated PO items
      if (orderData.items.length > 0) {
        const poItems = orderData.items.map(item => ({
          po_id: id,
          product_id: item.product_id || null,
          item_sku: item.item_sku,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.quantity * item.unit_price,
          received_quantity: 0
        }));

        const { error: itemsError } = await supabase
          .from('po_items')
          .insert(poItems);

        if (itemsError) throw itemsError;
      }

      await fetchPurchaseOrders();
      return poData;
    } catch (err) {
      console.error('Error updating purchase order:', err);
      throw err;
    }
  };

  const confirmPurchaseOrder = async (po: PurchaseOrder) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update PO status to confirmed
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: 'confirmed' })
        .eq('id', po.id);

      if (updateError) throw updateError;

      // Create shipment record
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .insert([{
          order_reference: po.po_number,
          supplier: po.vendor_name,
          expected_date: po.expected_delivery_date || new Date().toISOString().split('T')[0],
          status: 'pending',
          user_id: user.id,
          warehouse_id: po.warehouse_id,
          company_id: po.company_id,
          source_po_id: po.id
        }])
        .select()
        .single();

      if (shipmentError) throw shipmentError;

      // Create shipment items from PO items
      if (po.po_items && po.po_items.length > 0) {
        const shipmentItems = po.po_items.map(item => ({
          shipment_id: shipmentData.id,
          sku: item.item_sku,
          name: item.item_name,
          expected_qty: item.quantity,
          received_qty: 0,
          damaged_qty: 0
        }));

        const { error: itemsError } = await supabase
          .from('shipment_items')
          .insert(shipmentItems);

        if (itemsError) throw itemsError;
      }

      // Update local state
      setPurchaseOrders(prev => 
        prev.map(order => 
          order.id === po.id 
            ? { ...order, status: 'confirmed' as PurchaseOrder['status'] }
            : order
        )
      );

      // Invalidate shipments cache to show new incoming shipment immediately
      queryClient.invalidateQueries({ queryKey: ['shipments'] });

    } catch (err) {
      console.error('Error confirming purchase order:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [user]);

  return {
    purchaseOrders,
    isLoading,
    error,
    createPurchaseOrder,
    updatePurchaseOrder,
    updatePurchaseOrderStatus,
    deletePurchaseOrder,
    createPendingVendorBillFromPO,
    createVendorBillFromPO,
    confirmPurchaseOrder,
    refetch: fetchPurchaseOrders
  };
};