
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useInventory } from '@/contexts/InventoryContext';
import { Calendar, Package, Truck, Save, X, Eye } from 'lucide-react';
import { Shipment, ShipmentItem } from '@/hooks/useWarehouseScopedShipments';
import { supabase } from '@/integrations/supabase/client';

interface ShipmentDetailsDialogProps {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

interface EditableShipmentItem extends ShipmentItem {
  currentStock?: number;
}

const ShipmentDetailsDialog: React.FC<ShipmentDetailsDialogProps> = ({
  shipment,
  open,
  onOpenChange,
  onUpdate
}) => {
  const [items, setItems] = useState<EditableShipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { processShipmentItems } = useInventory();

  // Load shipment items when dialog opens
  useEffect(() => {
    if (shipment && open) {
      loadShipmentItems();
    }
  }, [shipment, open]);

  const loadShipmentItems = async () => {
    if (!shipment) return;

    try {
      // Get current stock for each item by matching both SKU and name
      const skus = shipment.items.map(item => item.sku);
      const { data: products } = await supabase
        .from('products')
        .select('sku, name, quantity')
        .in('sku', skus);

      // Create a map using both SKU and name as key to handle duplicate SKUs
      const productStockMap = products?.reduce((acc, product) => {
        const key = `${product.sku}-${product.name}`;
        acc[key] = product.quantity;
        return acc;
      }, {} as Record<string, number>) || {};

      const enhancedItems = shipment.items.map(item => {
        const key = `${item.sku}-${item.name}`;
        return {
          ...item,
          currentStock: productStockMap[key] || 0
        };
      });

      setItems(enhancedItems);
    } catch (error) {
      console.error('Error loading shipment items:', error);
      setItems(shipment.items.map(item => ({ ...item, currentStock: 0 })));
    }
  };

  const handleItemChange = (index: number, field: keyof EditableShipmentItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = async () => {
    if (!shipment) return;

    setIsLoading(true);
    try {
      // Update shipment items
      for (const item of items) {
        const { error } = await supabase
          .from('shipment_items')
          .update({
            received_qty: item.received_qty,
            damaged_qty: item.damaged_qty,
            notes: item.notes
          })
          .eq('id', item.id);

        if (error) {
          throw error;
        }
      }

      // Calculate if shipment is fully received
      const allReceived = items.every(item => 
        item.received_qty && item.received_qty >= item.expected_qty
      );
      
      const hasPartialReceived = items.some(item => 
        item.received_qty && item.received_qty > 0
      );

      let newStatus = shipment.status;
      if (allReceived) {
        newStatus = 'received';
      } else if (hasPartialReceived) {
        newStatus = 'partially-received';
      }

      // Update shipment status if needed
      if (newStatus !== shipment.status) {
        const { error } = await supabase
          .from('shipments')
          .update({
            status: newStatus,
            received_date: newStatus === 'received' ? new Date().toISOString().split('T')[0] : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', shipment.id);

        if (error) {
          throw error;
        }
      }

      // Update inventory for received items only when quantities are actually received
      const receivedItems = items
        .filter(item => (item.received_qty && item.received_qty > 0) || (item.damaged_qty && item.damaged_qty > 0))
        .map(item => ({
          sku: item.sku,
          name: item.name,
          received_qty: item.received_qty || 0,
          damaged_qty: item.damaged_qty || 0,
          expected_qty: item.expected_qty,
          shipment_id: shipment.id,
          notes: item.notes
        }));

      // Only update inventory if there are items actually received
      if (receivedItems.length > 0) {
        console.log('Processing received items for inventory update:', receivedItems);
        await processShipmentItems(receivedItems);
      } else {
        console.log('No items received - inventory will not be updated');
      }

      toast({
        title: "Shipment Updated",
        description: "Shipment details and inventory have been updated successfully.",
      });

      onUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving shipment:', error);
      toast({
        title: "Error",
        description: "Failed to save shipment details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500 text-white">Pending</Badge>;
      case 'partially-received':
        return <Badge className="bg-blue-500 text-white">Partially Received</Badge>;
      case 'received':
        return <Badge className="bg-emerald-500 text-white">Received</Badge>;
      case 'inspected':
        return <Badge className="bg-indigo-500 text-white">Inspected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!shipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-auto bg-slate-800/95 backdrop-blur-md border border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-400" />
            Shipment Details
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            View and edit shipment information and item details
          </DialogDescription>
        </DialogHeader>

        {/* Shipment Header Info */}
        <div className="bg-slate-700/50 rounded-lg p-4 space-y-3 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white">{shipment.id}</h3>
              <p className="text-sm text-slate-400">
                {shipment.supplier} - PO: {shipment.order_reference}
              </p>
            </div>
            {getStatusBadge(shipment.status)}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">Expected: {shipment.expected_date}</span>
            </div>
            {shipment.received_date && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">Received: {shipment.received_date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Items</h4>
          <div className="border border-slate-600/50 rounded-lg overflow-hidden bg-slate-800/30">
            <div className="bg-slate-700/50 px-4 py-3 grid grid-cols-12 gap-3 text-sm font-medium text-slate-300">
              <div className="col-span-2">SKU</div>
              <div className="col-span-3">Product Name</div>
              <div className="col-span-1">Expected</div>
              <div className="col-span-1">Received</div>
              <div className="col-span-1">Damaged</div>
              <div className="col-span-1">Stock</div>
              <div className="col-span-3">Notes</div>
            </div>
            
            <div className="divide-y divide-slate-600/50">
              {items.map((item, index) => (
                <div key={item.id} className="px-4 py-3 grid grid-cols-12 gap-3 text-sm bg-slate-800/20">
                  <div className="col-span-2">
                    <span className="font-medium text-white">{item.sku}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-slate-300">{item.expected_qty}</span>
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={item.received_qty || 0}
                      onChange={(e) => handleItemChange(index, 'received_qty', parseInt(e.target.value) || 0)}
                      className="h-8 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                      min="0"
                    />
                    {item.received_qty && item.received_qty > item.expected_qty && (
                      <div className="text-xs text-amber-400 mt-1">
                        ⚠️ Overage: +{item.received_qty - item.expected_qty}
                      </div>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={item.damaged_qty || 0}
                      onChange={(e) => handleItemChange(index, 'damaged_qty', parseInt(e.target.value) || 0)}
                      className="h-8 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                      min="0"
                    />
                  </div>
                  <div className="col-span-1">
                    <span className="text-slate-300">{item.currentStock}</span>
                  </div>
                  <div className="col-span-3">
                    <Textarea
                      value={item.notes || ''}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      className="h-8 min-h-8 resize-none bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                      placeholder="Add notes..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white bg-slate-800/50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentDetailsDialog;
