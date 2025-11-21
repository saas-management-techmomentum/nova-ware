
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ShipmentItem {
  sku: string;
  name: string;
  expected_qty: number;
  received_qty?: number;
  damaged_qty?: number;
  notes?: string;
}

interface ShipmentItemsManagerProps {
  items: ShipmentItem[];
  onItemsChange: (items: ShipmentItem[]) => void;
  isReceiving?: boolean;
}

const ShipmentItemsManager = ({ items, onItemsChange, isReceiving = false }: ShipmentItemsManagerProps) => {
  const { inventoryItems } = useInventory();
  const [newItem, setNewItem] = useState<ShipmentItem>({
    sku: '',
    name: '',
    expected_qty: 0
  });
  const [isNewProductMode, setIsNewProductMode] = useState(false);

  const addItem = () => {
    if (!newItem.sku || !newItem.name || newItem.expected_qty <= 0) return;
    
    onItemsChange([...items, { ...newItem }]);
    setNewItem({ sku: '', name: '', expected_qty: 0 });
    setIsNewProductMode(false);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  const updateItem = (index: number, field: keyof ShipmentItem, value: any) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onItemsChange(updatedItems);
  };

  const handleSkuSelect = (value: string) => {
    const product = inventoryItems.find(p => p.sku === value);
    if (product) {
      setNewItem({
        ...newItem,
        sku: value,
        name: product.name
      });
    }
  };

  const isExistingProduct = (sku: string) => {
    return inventoryItems.some(p => p.sku === sku);
  };

  if (isReceiving) {
    return (
      <div className="space-y-4">
        <h4 className="text-md font-medium">Shipment Items</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Damaged</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const currentProduct = inventoryItems.find(p => p.sku === item.sku);
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.expected_qty}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={item.received_qty || ''}
                      onChange={(e) => updateItem(index, 'received_qty', parseInt(e.target.value) || 0)}
                      className="w-20 text-slate-900"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={item.damaged_qty || ''}
                      onChange={(e) => updateItem(index, 'damaged_qty', parseInt(e.target.value) || 0)}
                      className="w-20 text-slate-900"
                    />
                  </TableCell>
                  <TableCell>
                    {currentProduct ? (
                      <span className="text-sm text-muted-foreground">
                        Current: {currentProduct.stock}
                      </span>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                        New Product
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.notes || ''}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      placeholder="Notes..."
                      className="w-32"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium">Expected Items</h4>
      
      {/* Add new item form */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-neutral-300">SKU</Label>
            {!isNewProductMode ? (
              <>
                <Select
                  value={newItem.sku || undefined}
                  onValueChange={handleSkuSelect}
                >
                  <SelectTrigger className="w-full text-foreground bg-background border-input">
                    <SelectValue placeholder="Select existing product SKU" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {inventoryItems.map((product) => (
                      <SelectItem key={product.sku} value={product.sku}>
                        <span className="font-medium">{product.sku}</span>
                        {' – '}
                        <span className="text-xs text-muted-foreground">
                          {product.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Select from inventory</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsNewProductMode(true);
                      setNewItem({ sku: '', name: '', expected_qty: 0 });
                    }}
                    className="h-auto p-1 text-xs"
                  >
                    New product
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Input
                  value={newItem.sku}
                  onChange={(e) =>
                    setNewItem({ ...newItem, sku: e.target.value.trim() })
                  }
                  placeholder="Enter new product SKU"
                  className="text-foreground bg-background border-input"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">New Product</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsNewProductMode(false);
                      setNewItem({ sku: '', name: '', expected_qty: 0 });
                    }}
                    className="h-auto p-1 text-xs"
                  >
                    Use existing
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300">Product Name</Label>
            <Input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder={
                !isNewProductMode && isExistingProduct(newItem.sku) 
                  ? 'Auto-filled from product'
                  : 'Enter name for new product'
              }
              disabled={!isNewProductMode && isExistingProduct(newItem.sku)}
              className="text-foreground bg-background border-input disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-300">Expected Quantity</Label>
          <Input
            type="number"
            min="1"
            value={newItem.expected_qty || ''}
            onChange={(e) => setNewItem({ ...newItem, expected_qty: parseInt(e.target.value) || 0 })}
            placeholder="Qty"
            className="text-foreground bg-background border-input"
          />
          </div>
          <Button 
            onClick={addItem} 
            className="gap-2"
            disabled={!newItem.sku || !newItem.name || !newItem.expected_qty}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Expected Qty</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const currentProduct = inventoryItems.find(p => p.sku === item.sku);
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.expected_qty}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {currentProduct ? currentProduct.stock : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ShipmentItemsManager;
