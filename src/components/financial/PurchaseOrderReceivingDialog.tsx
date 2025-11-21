import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PurchaseOrder, POItem } from '@/hooks/usePurchaseOrders';
import { supabase } from '@/integrations/supabase/client';

interface PurchaseOrderReceivingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onReceivingComplete: () => void;
}

interface ReceivingItem extends POItem {
  receivingQuantity: number;
  isSelected: boolean;
}

export const PurchaseOrderReceivingDialog: React.FC<PurchaseOrderReceivingDialogProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onReceivingComplete
}) => {
  const { toast } = useToast();
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (purchaseOrder?.po_items) {
      setReceivingItems(
        purchaseOrder.po_items.map(item => ({
          ...item,
          receivingQuantity: item.quantity - item.received_quantity,
          isSelected: true
        }))
      );
    }
  }, [purchaseOrder]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setReceivingItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, receivingQuantity: Math.max(0, Math.min(quantity, item.quantity - item.received_quantity)) }
          : item
      )
    );
  };

  const handleItemSelection = (itemId: string, isSelected: boolean) => {
    setReceivingItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, isSelected } : item
      )
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    setReceivingItems(prev =>
      prev.map(item => ({ ...item, isSelected }))
    );
  };

  const handleReceive = async () => {
    if (!purchaseOrder) return;

    const selectedItems = receivingItems.filter(item => item.isSelected && item.receivingQuantity > 0);
    
    if (selectedItems.length === 0) {
      toast({ title: "Please select at least one item to receive", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      // Update received quantities for each item
      for (const item of selectedItems) {
        const newReceivedQuantity = item.received_quantity + item.receivingQuantity;
        
        // Update the PO item
        const { error: updateError } = await supabase
          .from('po_items')
          .update({ received_quantity: newReceivedQuantity })
          .eq('id', item.id);

        if (updateError) throw updateError;

        // Update inventory if product_id exists
        if (item.product_id) {
          // Get current product quantity
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
              quantity: (product.quantity || 0) + item.receivingQuantity
            })
            .eq('id', item.product_id);

          if (inventoryError) throw inventoryError;

          // Create inventory history record
          await supabase
            .from('inventory_history')
            .insert([{
              product_id: item.product_id,
              quantity: item.receivingQuantity,
              transaction_type: 'incoming',
              reference: `PO: ${purchaseOrder.po_number}`,
              user_id: purchaseOrder.user_id,
              warehouse_id: purchaseOrder.warehouse_id,
              company_id: purchaseOrder.company_id,
              remaining_stock: 0, // Will be updated by trigger
              notes: `Received via Purchase Order ${purchaseOrder.po_number} - Partial: ${item.receivingQuantity}/${item.quantity}`
            }]);
        }
      }

      // Check if all items are fully received
      const allItemsReceived = receivingItems.every(item => 
        item.received_quantity + (item.isSelected ? item.receivingQuantity : 0) >= item.quantity
      );

      // Update PO status
      const newStatus = allItemsReceived ? 'received' : 'partially_received';
      const { error: statusError } = await supabase
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', purchaseOrder.id);

      if (statusError) throw statusError;

      toast({ 
        title: allItemsReceived ? "All items received successfully" : "Items partially received",
        description: `PO ${purchaseOrder.po_number} updated`
      });
      
      onReceivingComplete();
      onClose();
    } catch (error) {
      console.error('Error receiving items:', error);
      toast({ title: "Failed to receive items", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTotalReceivingValue = () => {
    return receivingItems
      .filter(item => item.isSelected)
      .reduce((sum, item) => sum + (item.receivingQuantity * item.unit_price), 0);
  };

  if (!purchaseOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Purchase Order - {purchaseOrder.po_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Vendor</Label>
              <p className="text-sm">{purchaseOrder.vendor_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Order Date</Label>
              <p className="text-sm">{new Date(purchaseOrder.order_date).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-medium">Items to Receive</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={receivingItems.every(item => item.isSelected)}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm">Select All</Label>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Previously Received</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Receiving Now</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivingItems.map((item) => {
                  const remaining = item.quantity - item.received_quantity;
                  const lineTotal = item.receivingQuantity * item.unit_price;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={item.isSelected}
                          onCheckedChange={(checked) => handleItemSelection(item.id, checked as boolean)}
                          disabled={remaining <= 0}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.item_sku}</TableCell>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={item.received_quantity > 0 ? "default" : "secondary"}>
                          {item.received_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={remaining > 0 ? "destructive" : "default"}>
                          {remaining}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={remaining}
                          value={item.receivingQuantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          disabled={!item.isSelected || remaining <= 0}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={item.isSelected ? "font-medium" : "text-muted-foreground"}>
                          ${lineTotal.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Receiving Value</p>
              <p className="text-lg font-bold">${getTotalReceivingValue().toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleReceive} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Receive Items"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};