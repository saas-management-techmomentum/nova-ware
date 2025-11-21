import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Check } from 'lucide-react';
import { useWarehouseScopedInventory } from '@/hooks/useWarehouseScopedInventory';
import { InventoryItem } from '@/contexts/InventoryContext';
import { CreatePOItemData } from '@/hooks/usePurchaseOrders';

interface InventoryItemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: CreatePOItemData) => void;
  selectedItems: CreatePOItemData[];
}

export const InventoryItemSelector: React.FC<InventoryItemSelectorProps> = ({
  isOpen,
  onClose,
  onSelectItem,
  selectedItems
}) => {
  const { inventoryItems, isLoading } = useWarehouseScopedInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter items based on search and category
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(inventoryItems.map(item => item.category).filter(Boolean)));

  const isItemSelected = (item: InventoryItem) => {
    return selectedItems.some(selected => selected.item_sku === item.sku);
  };

  const handleSelectItem = (item: InventoryItem) => {
    if (isItemSelected(item)) return;

    const poItem: CreatePOItemData = {
      item_sku: item.sku,
      item_name: item.name,
      quantity: 1,
      unit_price: item.cost_price || 0
    };

    onSelectItem(poItem);
  };

  const getStockBadge = (stock: number, threshold?: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (threshold && stock <= threshold) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return <Badge variant="default">In Stock</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Inventory Items</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded-md px-3 py-2 bg-background"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading inventory items...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.category || 'Uncategorized'}</TableCell>
                      <TableCell>{item.stock}</TableCell>
                      <TableCell>${(item.cost_price || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {getStockBadge(item.stock, item.low_stock_threshold)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSelectItem(item)}
                          disabled={isItemSelected(item)}
                          variant={isItemSelected(item) ? "secondary" : "default"}
                        >
                          {isItemSelected(item) ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Selected
                            </>
                          ) : (
                            'Select'
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};