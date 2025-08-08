import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Package } from 'lucide-react';
import { useWarehouseScopedInventory } from '@/hooks/useWarehouseScopedInventory';

interface OrderItem {
  id?: string;
  sku: string;
  name?: string;
  quantity: number;
  unit_price?: number;
  product_id?: string;
  products?: {
    name: string;
    unit_price: number;
  };
}

interface EditOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    customer_name: string;
    status: string;
    created_at: string;
    items?: OrderItem[];
  } | null;
  onUpdate: (orderId: string, updates: any) => Promise<void>;
}

const EditOrderDialog: React.FC<EditOrderDialogProps> = ({
  isOpen,
  onClose,
  order,
  onUpdate
}) => {
  const { toast } = useToast();
  const { inventoryItems } = useWarehouseScopedInventory();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Non-editable statuses
  const nonEditableStatuses = ['order-shipped', 'shipped', 'cancelled'];

  useEffect(() => {
    if (order) {
      setOrderItems(order.items || []);
    }
  }, [order]);

  const canEditOrder = order && !nonEditableStatuses.includes(order.status);

  const addOrderItem = () => {
    const newItem: OrderItem = {
      sku: '',
      quantity: 1,
      unit_price: 0
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...orderItems];
    
    if (field === 'sku') {
      // Find product by SKU and auto-populate data
      const product = inventoryItems.find(p => p.sku === value);
      if (product) {
        updatedItems[index] = {
          ...updatedItems[index],
          sku: value,
          name: product.name,
          product_id: product.id,
          unit_price: product.unit_price || 0
        };
      } else {
        updatedItems[index] = {
          ...updatedItems[index],
          sku: value,
          name: undefined,
          product_id: undefined,
          unit_price: 0
        };
      }
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
    }
    
    setOrderItems(updatedItems);
  };

  const getProductBySku = (sku: string) => {
    return inventoryItems.find(p => p.sku === sku);
  };

  const validateOrder = () => {
    if (orderItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one order item is required",
        variant: "destructive"
      });
      return false;
    }

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.sku.trim()) {
        toast({
          title: "Validation Error",
          description: `Item ${i + 1}: SKU is required`,
          variant: "destructive"
        });
        return false;
      }

      if (item.quantity <= 0) {
        toast({
          title: "Validation Error",
          description: `Item ${i + 1}: Quantity must be greater than 0`,
          variant: "destructive"
        });
        return false;
      }

      // Check inventory availability for new items or increased quantities
      const product = getProductBySku(item.sku);
      if (product && product.stock < item.quantity) {
        toast({
          title: "Insufficient Inventory",
          description: `Item ${i + 1}: Only ${product.stock} units available for ${item.sku}`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!order || !canEditOrder) return;

    if (!validateOrder()) return;

    setIsLoading(true);
    try {
      const updates = {
        items: orderItems
      };

      await onUpdate(order.id, updates);
      
      toast({
        title: "Order Updated",
        description: "Order has been successfully updated",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.quantity * (item.unit_price || 0));
    }, 0);
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-400" />
            Edit Order - {order.id}
          </DialogTitle>
        </DialogHeader>

        {!canEditOrder ? (
          <div className="py-6">
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-800">
                  <Badge className="bg-amber-500">{order.status}</Badge>
                  <span>This order cannot be edited in its current status.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="customer">Customer Name</Label>
                     <Input
                       id="customer"
                       value={order.customer_name}
                       disabled
                       className="bg-slate-100"
                     />
                   </div>
                  <div>
                    <Label>Order Date</Label>
                    <Input
                      value={new Date(order.created_at).toLocaleDateString()}
                      disabled
                      className="bg-slate-100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Order Items</CardTitle>
                <Button onClick={addOrderItem} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No items in this order. Click "Add Item" to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item, index) => {
                      const product = getProductBySku(item.sku);
                      return (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Item {index + 1}</span>
                            <Button
                              onClick={() => removeOrderItem(index)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <Label>SKU</Label>
                              <Select
                                value={item.sku}
                                onValueChange={(value) => updateOrderItem(index, 'sku', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select SKU" />
                                </SelectTrigger>
                                <SelectContent>
                                  {inventoryItems.map((product) => (
                                    <SelectItem key={product.id} value={product.sku}>
                                      <div className="flex flex-col">
                                        <span>{product.sku}</span>
                                        <span className="text-xs text-slate-500">{product.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label>Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              />
                              {product && (
                                <div className="text-xs text-slate-500 mt-1">
                                  Available: {product.stock}
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <Label>Unit Price</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_price || 0}
                                onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            
                            <div>
                              <Label>Total</Label>
                              <Input
                                value={`$${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}`}
                                disabled
                                className="bg-slate-100"
                              />
                            </div>
                          </div>
                          
                          {product && (
                            <div className="text-sm text-slate-600">
                              Product: {product.name}
                            </div>
                          )}
                          
                          {item.sku && !product && (
                            <div className="text-sm text-amber-600">
                              Warning: SKU not found in inventory
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Order Total:</span>
                        <span className="text-lg font-bold">${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {canEditOrder && (
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Order'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderDialog;