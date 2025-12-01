import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Order } from '@/hooks/useWarehouseScopedOrders';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrders } from '@/contexts/OrdersContext';
import { Calendar, Package, Truck, Hash, FileText } from 'lucide-react';

interface OutgoingShipmentModalProps {
  order: Order | null;
  shipment?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const OutgoingShipmentModal: React.FC<OutgoingShipmentModalProps> = ({
  order,
  shipment,
  open,
  onOpenChange,
  onUpdate
}) => {
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [shipDate, setShipDate] = useState('');
  const [shipmentStatus, setShipmentStatus] = useState('pending');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { orders } = useOrders();

  // Filter orders that don't have shipments yet
  const ordersWithoutShipments = orders.filter(order => 
    order.status !== 'order-shipped' && order.invoice_number
  );

  // Reset form when order/shipment changes or modal opens
  useEffect(() => {
    if (order) {
      // Initialize with existing values from the order
      setCarrier(order.carrier || '');
      setTrackingNumber(order.tracking_number || '');
      setShippingMethod(order.shipping_method || '');
      setShipDate(order.ship_date || '');
      setShipmentStatus(order.shipment_status?.toLowerCase() || 'pending');
      setSelectedOrderId(''); // Reset order selection for existing orders
    } else if (shipment) {
      // Initialize with existing values from the shipment
      setCarrier(shipment.carrier || '');
      setTrackingNumber(shipment.tracking_number || '');
      setShippingMethod(shipment.shipping_method || '');
      setShipDate(shipment.expected_date || '');
      setShipmentStatus(shipment.status?.toLowerCase() || 'pending');
      setSelectedOrderId(''); // Reset order selection for existing shipments
    } else if (open) {
      // Reset form for new shipment
      setCarrier('');
      setTrackingNumber('');
      setShippingMethod('');
      setShipDate('');
      setShipmentStatus('pending');
      setSelectedOrderId('');
    }
  }, [order, shipment, open]);

  const handleSave = async () => {
    // Validate required fields for new shipments
    if (!order && !shipment && !selectedOrderId) {
      toast({
        title: "Error",
        description: "Please select an order for the new shipment",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (order) {
        // Update existing order - only update specific fields to avoid overwriting required fields
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        // Only update fields that have values
        if (carrier) updateData.carrier = carrier;
        if (trackingNumber) updateData.tracking_number = trackingNumber;
        if (shippingMethod) updateData.shipping_method = shippingMethod;
        if (shipDate) updateData.ship_date = shipDate;
        if (shipmentStatus) {
          updateData.shipment_status = shipmentStatus;
          // Update order status if shipment is shipped
          if (shipmentStatus === 'shipped') updateData.status = 'order-shipped';
        }

        const { error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', order.id);

        if (error) {
          console.error('Error updating order:', error);
          toast({
            title: "Error",
            description: "Failed to update shipment information",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Shipment information updated successfully",
        });
      } else if (shipment) {
        // Update existing shipment - only update specific fields to avoid overwriting required fields
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        // Only update fields that have values or allow clearing
        if (carrier !== undefined) updateData.carrier = carrier;
        if (trackingNumber !== undefined) updateData.tracking_number = trackingNumber;
        if (shippingMethod !== undefined) updateData.shipping_method = shippingMethod;
        if (shipDate !== undefined) updateData.expected_date = shipDate || null;
        if (shipmentStatus) updateData.status = shipmentStatus;

        const { error } = await supabase
          .from('shipments')
          .update(updateData)
          .eq('id', shipment.id);

        if (error) {
          console.error('Error updating shipment:', error);
          toast({
            title: "Error",
            description: "Failed to update shipment information",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Shipment information updated successfully",
        });
      } else {
        // Get the selected order
        const selectedOrder = orders.find(o => o.id === selectedOrderId);
        if (!selectedOrder) {
          toast({
            title: "Error",
            description: "Selected order not found",
            variant: "destructive",
          });
          return;
        }

        // Get user and warehouse info
        const { data: { user } } = await supabase.auth.getUser();
        const { data: orderData } = await supabase
          .from('orders')
          .select('warehouse_id, company_id, items:order_items(*)')
          .eq('id', selectedOrderId)
          .single();

        // Create new outgoing shipment linked to the order
        const { data: newShipment, error: shipmentError } = await supabase
          .from('shipments')
          .insert([{
            order_id: selectedOrderId,
            order_reference: selectedOrder.invoice_number || selectedOrderId,
            supplier: selectedOrder.customer_name,
            expected_date: shipDate || new Date().toISOString().split('T')[0],
            status: shipmentStatus,
            shipment_type: 'outgoing',
            user_id: user?.id,
            warehouse_id: orderData?.warehouse_id,
            company_id: orderData?.company_id
          }])
          .select()
          .single();

        if (shipmentError) {
          console.error('Error creating shipment:', shipmentError);
          toast({
            title: "Error",
            description: "Failed to create shipment",
            variant: "destructive",
          });
          return;
        }

        // Create shipment items from order items
        if (newShipment && orderData?.items && orderData.items.length > 0) {
          const shipmentItems = orderData.items.map((item: any) => ({
            shipment_id: newShipment.id,
            sku: item.sku,
            name: item.sku,
            expected_qty: item.quantity,
            received_qty: 0
          }));
          
          await supabase.from('shipment_items').insert(shipmentItems);
        }

        toast({
          title: "Success",
          description: `New shipment created for Order ${selectedOrder.invoice_number}`,
        });
      }

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Exception saving shipment:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-neutral-900 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Package className="h-5 w-5" />
            {order ? `Update Shipment - Order ${order.id}` : 
             shipment ? `Update Shipment - ${shipment.order_reference}` : 
             'Create New Shipment'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order/Shipment Information - only show if editing existing */}
          {(order || shipment) && (
            <div className="bg-neutral-800/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-neutral-300 mb-2">
                {order ? 'Order Information' : 'Shipment Information'}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-400">Customer:</span>
                  <span className="ml-2 text-white">
                    {order ? order.customer_name : shipment?.customer_name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400">{order ? 'Order Date:' : 'Created Date:'}</span>
                  <span className="ml-2 text-white">
                    {new Date((order || shipment).created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Order Selection - Required for new shipments */}
          {!order && !shipment && (
            <div className="space-y-2">
              <Label htmlFor="order-select" className="text-neutral-300 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Select Order *
              </Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger className="bg-neutral-800/50 border-neutral-700 text-white">
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  {ordersWithoutShipments.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No available orders
                    </div>
                  ) : (
                    ordersWithoutShipments.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.invoice_number} - {order.customer_name} ({order.status})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!selectedOrderId && (
                <p className="text-xs text-amber-300">
                  * Order selection is required for new shipments
                </p>
              )}
            </div>
          )}

          {/* Shipping Information Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carrier" className="text-neutral-300 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Carrier
              </Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger className="bg-neutral-800/50 border-neutral-700 text-white">
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="usps">USPS</SelectItem>
                  <SelectItem value="shipstation">ShipStation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping-method" className="text-neutral-300">
                Shipping Method
              </Label>
              <Select value={shippingMethod} onValueChange={setShippingMethod}>
                <SelectTrigger className="bg-neutral-800/50 border-neutral-700 text-white">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="expedited">Expedited</SelectItem>
                  <SelectItem value="overnight">Overnight</SelectItem>
                  <SelectItem value="two-day">Two Day</SelectItem>
                  <SelectItem value="ground">Ground</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking-number" className="text-neutral-300 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Tracking Number
            </Label>
            <Input
              id="tracking-number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ship-date" className="text-neutral-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ship Date
              </Label>
              <Input
                id="ship-date"
                type="date"
                value={shipDate}
                onChange={(e) => setShipDate(e.target.value)}
                className="bg-neutral-800/50 border-neutral-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipment-status" className="text-neutral-300">
                Shipment Status
              </Label>
              <Select value={shipmentStatus} onValueChange={setShipmentStatus}>
                <SelectTrigger className="bg-neutral-800/50 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {shipmentStatus === 'shipped' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg">
              <p className="text-sm text-emerald-300">
                ⚠️ Setting status to "Shipped" will update the order status to "Shipped"
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-gray-800 hover:bg-gray-900"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OutgoingShipmentModal;