
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowRight, Package, Warehouse, AlertTriangle } from 'lucide-react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useProductTransfer, TransferItem, BatchAllocation } from '@/hooks/useProductTransfer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface ProductTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWarehouse?: string;
}

export const ProductTransferDialog: React.FC<ProductTransferDialogProps> = ({
  open,
  onOpenChange,
  currentWarehouse
}) => {
  const { warehouses, isUserAdmin, selectedWarehouse } = useWarehouse();
  const { inventoryItems, refetch } = useInventory();
  const { transferProducts, isTransferring, checkReservedQuantity } = useProductTransfer();

  const [searchTerm, setSearchTerm] = useState('');
  const [sourceWarehouse, setSourceWarehouse] = useState<string>(currentWarehouse || '');
  const [destinationWarehouse, setDestinationWarehouse] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<TransferItem[]>([]);
  const [productReservations, setProductReservations] = useState<Record<string, number>>({});

  // Update source warehouse when currentWarehouse prop changes
  React.useEffect(() => {
    if (currentWarehouse && open) {
      setSourceWarehouse(currentWarehouse);
    }
  }, [currentWarehouse, open]);

  // Filter products based on search and selected source warehouse
  const availableProducts = inventoryItems.filter(item => {
    if (!sourceWarehouse || item.warehouse_id !== sourceWarehouse) return false;
    if (item.stock <= 0) return false;
    
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const addProductToTransfer = async (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product || selectedProducts.find(p => p.productId === productId)) return;

    const reservedQuantity = productReservations[productId] || 0;
    const maxTransferQuantity = Math.max(0, product.stock - reservedQuantity);

    const hasBatches = product.has_batches && product.batches && product.batches.length > 0;
    const batchAllocations: BatchAllocation[] = hasBatches
      ? product.batches!.map(batch => ({
          batchId: batch.id,
          batchNumber: batch.batch_number,
          quantity: 0,
          maxQuantity: batch.quantity,
          expirationDate: batch.expiration_date ? new Date(batch.expiration_date) : null,
          costPrice: batch.cost_price || product.unit_price || 0,
          locationId: batch.location_id,
        }))
      : [];

    const transferItem: TransferItem = {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      currentStock: product.stock,
      transferQuantity: hasBatches ? 0 : Math.min(1, maxTransferQuantity),
      reservedQuantity,
      maxTransferQuantity,
      hasBatches,
      batchAllocations,
    };

    setSelectedProducts(prev => [...prev, transferItem]);
  };

  const addAllProducts = async () => {
    const newProducts = await Promise.all(
      availableProducts
        .filter(product => !selectedProducts.find(p => p.productId === product.id))
        .map(async product => {
          const reservedQuantity = productReservations[product.id] || 0;
          const maxTransferQuantity = Math.max(0, product.stock - reservedQuantity);
          
          return {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            currentStock: product.stock,
            transferQuantity: Math.min(1, maxTransferQuantity),
            reservedQuantity,
            maxTransferQuantity
          };
        })
    );
    
    setSelectedProducts(prev => [...prev, ...newProducts.filter(p => p.maxTransferQuantity > 0)]);
  };

  const setAllToMax = () => {
    setSelectedProducts(prev => 
      prev.map(p => ({ 
        ...p, 
        transferQuantity: p.maxTransferQuantity || p.currentStock 
      }))
    );
  };

  const transferEverything = async () => {
    const allProducts = await Promise.all(
      availableProducts.map(async product => {
        const reservedQuantity = productReservations[product.id] || 0;
        const maxTransferQuantity = Math.max(0, product.stock - reservedQuantity);
        
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          currentStock: product.stock,
          transferQuantity: maxTransferQuantity,
          reservedQuantity,
          maxTransferQuantity
        };
      })
    );
    
    setSelectedProducts(allProducts.filter(p => p.maxTransferQuantity > 0));
  };

  const clearAllSelections = () => {
    setSelectedProducts([]);
  };

  const removeProductFromTransfer = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const updateTransferQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(prev => 
      prev.map(p => 
        p.productId === productId 
          ? { 
              ...p, 
              transferQuantity: Math.max(1, Math.min(quantity, p.maxTransferQuantity || p.currentStock)) 
            }
          : p
      )
    );
  };

  const updateBatchQuantity = (productId: string, batchId: string, quantity: number) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p.productId !== productId || !p.batchAllocations) return p;

        const updatedAllocations = p.batchAllocations.map(b =>
          b.batchId === batchId
            ? { ...b, quantity: Math.max(0, Math.min(quantity, b.maxQuantity)) }
            : b
        );

        const totalTransferQty = updatedAllocations.reduce((sum, b) => sum + b.quantity, 0);

        return {
          ...p,
          batchAllocations: updatedAllocations,
          transferQuantity: totalTransferQty,
        };
      })
    );
  };

  const handleTransfer = async () => {
    if (!sourceWarehouse || !destinationWarehouse || selectedProducts.length === 0) {
      return;
    }

    try {
      await transferProducts({
        sourceWarehouseId: sourceWarehouse,
        destinationWarehouseId: destinationWarehouse,
        items: selectedProducts
      });
      
      // Reset form and close dialog
      setSourceWarehouse('');
      setDestinationWarehouse('');
      setSelectedProducts([]);
      setSearchTerm('');
      onOpenChange(false);
      
      // Refresh inventory data
      refetch();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.warehouse_id === warehouseId);
    return warehouse ? warehouse.warehouse_name : `Warehouse ${warehouseId.slice(0, 8)}`;
  };

  // Determine if we're in Corporate Overview mode (admin with no warehouse selected)
  const isInCorporateOverview = isUserAdmin && !selectedWarehouse;

  // Load reserved quantities when source warehouse changes
  useEffect(() => {
    if (sourceWarehouse) {
      const loadReservations = async () => {
        const reservations: Record<string, number> = {};
        for (const product of availableProducts) {
          reservations[product.id] = await checkReservedQuantity(product.id);
        }
        setProductReservations(reservations);
      };
      loadReservations();
    }
  }, [sourceWarehouse, availableProducts, checkReservedQuantity]);

  const canTransfer = sourceWarehouse && 
                     destinationWarehouse && 
                     sourceWarehouse !== destinationWarehouse && 
                     selectedProducts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-neutral-400" />
            Transfer Products Between Warehouses
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warehouse Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">From Warehouse</Label>
               <Select 
                 value={sourceWarehouse} 
                 onValueChange={setSourceWarehouse}
                 disabled={!!currentWarehouse && !isInCorporateOverview}
               >
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue placeholder="Select source warehouse" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4" />
                        {warehouse.warehouse_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">To Warehouse</Label>
              <Select value={destinationWarehouse} onValueChange={setDestinationWarehouse}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue placeholder="Select destination warehouse" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  {warehouses
                    .filter(w => w.warehouse_id !== sourceWarehouse)
                    .map(warehouse => (
                    <SelectItem key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4" />
                        {warehouse.warehouse_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Search */}
          {sourceWarehouse && (
            <div>
              <Label className="text-white">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  placeholder="Search products in selected warehouse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400"
                />
              </div>
            </div>
          )}

          {/* Available Products */}
          {sourceWarehouse && availableProducts.length > 0 && (
            <Card className="bg-neutral-800/50 border-neutral-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white text-sm">Available Products</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addAllProducts}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800/10"
                  >
                    Add All
                  </Button>
                  <Button
                    size="sm"
                    onClick={transferEverything}
                    className="bg-gray-800 hover:bg-gray-900"
                  >
                    Transfer Everything
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="max-h-40 overflow-y-auto space-y-2">
                 {availableProducts.map(product => {
                   const reservedQuantity = productReservations[product.id] || 0;
                   const maxTransferQuantity = Math.max(0, product.stock - reservedQuantity);
                   
                     return (
                      <div key={product.id} className="flex items-center justify-between p-2 bg-neutral-700/50 rounded">
                        <div className="flex-1">
                          <p className="text-white font-medium">{product.name}</p>
                          <div className="flex items-center gap-4 text-neutral-400 text-sm">
                            <span>SKU: {product.sku}</span>
                            <span>Stock: {product.stock}</span>
                            {reservedQuantity > 0 && (
                              <span className="text-amber-400">
                                Reserved: {reservedQuantity} • Available: {maxTransferQuantity}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addProductToTransfer(product.id)}
                          disabled={selectedProducts.some(p => p.productId === product.id) || maxTransferQuantity === 0}
                          className="bg-gray-800 hover:bg-gray-900"
                        >
                          {maxTransferQuantity === 0 ? 'Reserved' : 'Add'}
                        </Button>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          {/* Selected Products for Transfer */}
          {selectedProducts.length > 0 && (
            <Card className="bg-neutral-800/50 border-neutral-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  Products to Transfer
                  <Badge variant="secondary">{selectedProducts.length}</Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={setAllToMax}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800/10"
                  >
                    Set All to Max
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAllSelections}
                    className="border-red-600 text-red-400 hover:bg-red-600/10"
                  >
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                 {selectedProducts.map(item => (
                   <div key={item.productId} className="p-3 bg-neutral-700/50 rounded space-y-3">
                     <div className="flex items-center justify-between">
                       <div className="flex-1">
                         <p className="text-white font-medium">{item.productName}</p>
                         <div className="text-neutral-400 text-sm space-y-1">
                           <div>SKU: {item.sku} • Stock: {item.currentStock}</div>
                           {item.reservedQuantity && item.reservedQuantity > 0 && (
                             <div className="text-amber-400">
                               Reserved: {item.reservedQuantity} • Max Transfer: {item.maxTransferQuantity}
                             </div>
                           )}
                         </div>
                       </div>

                       {!item.hasBatches && (
                         <div className="flex items-center gap-2">
                           <div>
                             <Label className="text-neutral-400 text-xs">Quantity</Label>
                             <Input
                               type="number"
                               min="1"
                               max={item.maxTransferQuantity || item.currentStock}
                               value={item.transferQuantity}
                               onChange={(e) => updateTransferQuantity(item.productId, parseInt(e.target.value) || 1)}
                               className="w-20 bg-neutral-800 border-neutral-700 text-white"
                             />
                           </div>

                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => removeProductFromTransfer(item.productId)}
                             className="border-red-600 text-red-400 hover:bg-red-600/10 mt-5"
                           >
                             Remove
                           </Button>
                         </div>
                       )}

                       {item.hasBatches && (
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => removeProductFromTransfer(item.productId)}
                           className="border-red-600 text-red-400 hover:bg-red-600/10"
                         >
                           Remove
                         </Button>
                       )}
                     </div>

                     {/* Batch Selection */}
                     {item.hasBatches && item.batchAllocations && item.batchAllocations.length > 0 && (
                       <Collapsible defaultOpen className="space-y-2">
                         <CollapsibleTrigger className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white w-full">
                           <ChevronDown className="h-4 w-4" />
                           Select batches to transfer (Total: {item.transferQuantity} units)
                         </CollapsibleTrigger>
                         <CollapsibleContent className="space-y-2 pl-6">
                           {item.batchAllocations.map(batch => (
                             <div
                               key={batch.batchId}
                               className="flex items-center justify-between p-2 bg-neutral-800/50 rounded border border-neutral-700"
                             >
                               <div className="flex-1 space-y-1">
                                 <div className="text-sm text-white font-medium">
                                   {batch.batchNumber}
                                 </div>
                                 <div className="text-xs text-neutral-400 space-x-3">
                                   <span>Available: {batch.maxQuantity}</span>
                                   {batch.expirationDate && (
                                     <span>Exp: {format(batch.expirationDate, 'MMM dd, yyyy')}</span>
                                   )}
                                 </div>
                               </div>
                               <div>
                                 <Label className="text-neutral-400 text-xs">Transfer</Label>
                                 <Input
                                   type="number"
                                   min="0"
                                   max={batch.maxQuantity}
                                   value={batch.quantity}
                                   onChange={(e) =>
                                     updateBatchQuantity(item.productId, batch.batchId, parseInt(e.target.value) || 0)
                                   }
                                   className="w-20 bg-neutral-800 border-neutral-700 text-white"
                                 />
                               </div>
                             </div>
                           ))}
                           {item.transferQuantity === 0 && (
                             <div className="text-xs text-amber-400 mt-1">
                               ⚠️ Please allocate quantities from batches above
                             </div>
                           )}
                         </CollapsibleContent>
                       </Collapsible>
                     )}
                   </div>
                 ))}
              </CardContent>
            </Card>
          )}

          {/* Transfer Summary */}
          {canTransfer && (
            <Card className="bg-gray-800/20 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-4 text-white">
                  <div className="text-center">
                    <Warehouse className="h-8 w-8 mx-auto mb-1 text-neutral-400" />
                    <p className="font-medium">{getWarehouseName(sourceWarehouse)}</p>
                  </div>
                  
                  <ArrowRight className="h-6 w-6 text-neutral-400" />
                  
                  <div className="text-center">
                    <Warehouse className="h-8 w-8 mx-auto mb-1 text-neutral-400" />
                    <p className="font-medium">{getWarehouseName(destinationWarehouse)}</p>
                  </div>
                </div>
                
                <p className="text-center text-neutral-300 mt-2">
                  Transferring {selectedProducts.length} product(s) • 
                  Total items: {selectedProducts.reduce((sum, item) => sum + item.transferQuantity, 0)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {selectedProducts.some(item => item.transferQuantity === item.currentStock) && (
            <div className="flex items-center gap-2 p-3 bg-amber-600/20 border border-amber-600 rounded text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">
                Warning: Some products will be completely transferred (0 remaining in source warehouse)
              </p>
            </div>
          )}
          
          {selectedProducts.some(item => item.reservedQuantity && item.reservedQuantity > 0) && (
            <div className="flex items-center gap-2 p-3 bg-blue-600/20 border border-blue-600 rounded text-blue-300">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">
                Note: Some products have reserved quantities for active orders. Transfer amounts have been adjusted accordingly.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!canTransfer || isTransferring}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isTransferring ? 'Transferring...' : 'Transfer Products'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
