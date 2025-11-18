
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Search, Check, ChevronsUpDown } from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
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
  const [skuComboboxOpen, setSkuComboboxOpen] = useState(false);
  const [skuSearch, setSkuSearch] = useState('');

  const addItem = () => {
    if (!newItem.sku || !newItem.name || newItem.expected_qty <= 0) return;
    
    onItemsChange([...items, { ...newItem }]);
    setNewItem({ sku: '', name: '', expected_qty: 0 });
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
      setSkuSearch('');
    } else {
      // Manual entry - new product
      setNewItem({
        ...newItem,
        sku: value,
        name: '' // Clear name so user can enter it
      });
      setSkuSearch('');
    }
    setSkuComboboxOpen(false);
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
      <div className="grid grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <Label className="text-neutral-300">SKU</Label>
          <Popover open={skuComboboxOpen} onOpenChange={setSkuComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={skuComboboxOpen}
                className="w-full justify-between text-foreground bg-background border-input hover:bg-accent hover:text-accent-foreground"
              >
                <span className="flex items-center gap-2">
                  {newItem.sku || "Type or select SKU..."}
                  {newItem.sku && (
                    isExistingProduct(newItem.sku) ? (
                      <Badge variant="secondary" className="ml-2 text-xs bg-green-500/20 text-green-400 border-green-500/30">
                        Existing
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2 text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                        New
                      </Badge>
                    )
                  )}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-popover border-border" align="start">
              <Command className="bg-popover">
                <CommandInput 
                  placeholder="Search or enter new SKU..." 
                  value={skuSearch}
                  onValueChange={setSkuSearch}
                  className="text-foreground"
                />
                <CommandEmpty>
                  <div className="p-2 text-sm text-muted-foreground">
                    {skuSearch ? (
                      <button
                        onClick={() => handleSkuSelect(skuSearch)}
                        className="w-full text-left p-2 hover:bg-accent rounded-md text-foreground"
                      >
                        Use "{skuSearch}" as new SKU
                      </button>
                    ) : (
                      "Type to add new SKU..."
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {inventoryItems.map((product) => (
                    <CommandItem
                      key={product.sku}
                      value={product.sku}
                      onSelect={handleSkuSelect}
                      className="text-foreground hover:bg-accent"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          newItem.sku === product.sku ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{product.sku}</span>
                        <span className="text-xs text-muted-foreground">{product.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="text-neutral-300">Product Name</Label>
          <Input
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder={isExistingProduct(newItem.sku) ? "Auto-filled from product" : "Enter name for new product"}
            disabled={isExistingProduct(newItem.sku)}
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
