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
import { useBilling, Invoice } from '@/hooks/useBilling';
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
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { invoices, fetchBillingData } = useBilling();

  // Fetch billing data when modal opens
  useEffect(() => {
    if (open) {
      fetchBillingData();
    }
  }, [open, fetchBillingData]);

  // Reset form when order/shipment changes or modal opens
  useEffect(() => {
    if (order) {
      // Initialize with existing values from the order
      setCarrier(order.carrier || '');
      setTrackingNumber(order.tracking_number || '');
      setShippingMethod(order.shipping_method || '');
      setShipDate(order.ship_date || '');
      setShipmentStatus(order.shipment_status?.toLowerCase() || 'pending');
      setSelectedInvoiceId(''); // Reset invoice selection for existing orders
    } else if (shipment) {
      // Initialize with existing values from the shipment
      setCarrier(shipment.carrier || '');
      setTrackingNumber(shipment.tracking_number || '');
      setShippingMethod(shipment.shipping_method || '');
      setShipDate(shipment.expected_date || '');
      setShipmentStatus(shipment.status?.toLowerCase() || 'pending');
      setSelectedInvoiceId(''); // Reset invoice selection for existing shipments
    } else if (open) {
      // Reset form for new shipment
      setCarrier('');
      setTrackingNumber('');
      setShippingMethod('');
      setShipDate('');
      setShipmentStatus('pending');
      setSelectedInvoiceId('');
    }
  }, [order, shipment, open]);

  const handleSave = async () => {
    // Validate required fields for new shipments
    if (!order && !shipment && !selectedInvoiceId) {
      toast({
        title: "Error",
        description: "Please select an invoice for the new shipment",
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
        // Get the selected invoice details
        const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);
        if (!selectedInvoice) {
          toast({
            title: "Error",
            description: "Selected invoice not found",
            variant: "destructive",
          });
          return;
        }

        // Create new outgoing shipment order linked to the invoice
        const user = await supabase.auth.getUser();
        const newOrderId = `SHIP-${selectedInvoice.invoice_number}-${Date.now()}`;
        
        const { error } = await supabase
          .from('orders')
          .insert([{
            id: newOrderId,
            customer_name: selectedInvoice.client_id || 'Customer', // We'll need to fetch client name if needed
            status: 'Ship order',
            shipment_status: shipmentStatus,
            carrier,
            tracking_number: trackingNumber,
            shipping_method: shippingMethod,
            ship_date: shipDate || null,
            user_id: user.data.user?.id,
            // Link to the invoice for reference
            notes: `Created from Invoice: ${selectedInvoice.invoice_number}`
          }]);

        if (error) {
          console.error('Error creating shipment:', error);
          toast({
            title: "Error",
            description: "Failed to create shipment",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: `New shipment created for Invoice ${selectedInvoice.invoice_number}`,
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
      <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700 text-white">
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
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-slate-300 mb-2">
                {order ? 'Order Information' : 'Shipment Information'}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Customer:</span>
                  <span className="ml-2 text-white">
                    {order ? order.customer_name : shipment?.customer_name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">{order ? 'Order Date:' : 'Created Date:'}</span>
                  <span className="ml-2 text-white">
                    {new Date((order || shipment).created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Selection - Required for new shipments */}
          {!order && !shipment && (
            <div className="space-y-2">
              <Label htmlFor="invoice-select" className="text-slate-300 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Invoice Number *
              </Label>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select an invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices
                    .filter(invoice => invoice.status === 'sent' || invoice.status === 'approved' || invoice.status === 'paid')
                    .map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - ${invoice.total_amount.toFixed(2)} ({invoice.status})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {!selectedInvoiceId && (
                <p className="text-xs text-amber-300">
                  * Invoice selection is required for new shipments
                </p>
              )}
            </div>
          )}

          {/* Shipping Information Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carrier" className="text-slate-300 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Carrier
              </Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
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
              <Label htmlFor="shipping-method" className="text-slate-300">
                Shipping Method
              </Label>
              <Select value={shippingMethod} onValueChange={setShippingMethod}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
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
            <Label htmlFor="tracking-number" className="text-slate-300 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Tracking Number
            </Label>
            <Input
              id="tracking-number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ship-date" className="text-slate-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ship Date
              </Label>
              <Input
                id="ship-date"
                type="date"
                value={shipDate}
                onChange={(e) => setShipDate(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipment-status" className="text-slate-300">
                Shipment Status
              </Label>
              <Select value={shipmentStatus} onValueChange={setShipmentStatus}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
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

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
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