
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Package, Trash2, DollarSign, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InventoryItem } from '@/types/inventory';
import InventoryHistoryDropdown from './InventoryHistoryDropdown';
import { BatchManagementDialog } from './BatchManagementDialog';

interface InventoryActionsProps {
  item: InventoryItem;
  onUpdate: (updatedItem: InventoryItem) => void;
  onDelete: (productId: string) => void;
}

const InventoryActions: React.FC<InventoryActionsProps> = ({ item, onUpdate, onDelete }) => {
  const { toast } = useToast();
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [batchManagementOpen, setBatchManagementOpen] = useState(false);
  
  // Ensure stock is always a number with null safety
  const currentStock = item.stock || 0;
  const [stockInputValue, setStockInputValue] = useState(currentStock.toString());
  
  const [productDetails, setProductDetails] = useState({
    name: item.name || '',
    upc: item.upc || '',
    asin: item.asin || '',
    dimensions: item.dimensions || '',
    weight: item.weight || '',
    unit_price: (item.unit_price || 0).toString(),
    case_price: (item.case_price || 0).toString(),
    low_stock_threshold: (item.low_stock_threshold || '').toString(),
    expiration: item.expiration
  });

  const handleViewDetails = () => {
    setViewDetailsOpen(true);
  };

  const handleEditProduct = () => {
    setEditProductOpen(true);
  };

  const handleAdjustStock = () => {
    setStockInputValue(currentStock.toString());
    setAdjustStockOpen(true);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value) || 0;
    const caseSize = parseFloat(item.casesize || '1') || 1;

    let updatedDetails = {
      ...productDetails,
      [name]: value
    };

    // Auto-calculate prices based on case size
    if (name === 'unit_price' && numericValue > 0 && caseSize > 0) {
      const calculatedCasePrice = numericValue * caseSize;
      updatedDetails.case_price = calculatedCasePrice.toFixed(2);
    } else if (name === 'case_price' && numericValue > 0 && caseSize > 0) {
      const calculatedUnitPrice = numericValue / caseSize;
      updatedDetails.unit_price = calculatedUnitPrice.toFixed(2);
    }

    setProductDetails(updatedDetails);
  };

  const handleExpirationChange = (date: Date | undefined) => {
    setProductDetails(prev => ({
      ...prev,
      expiration: date || null
    }));
  };

  const handleSaveProductDetails = () => {
    const updatedItem = {
      ...item,
      name: productDetails.name,
      upc: productDetails.upc,
      asin: productDetails.asin,
      dimensions: productDetails.dimensions,
      weight: productDetails.weight,
      unit_price: parseFloat(productDetails.unit_price) || 0,
      case_price: parseFloat(productDetails.case_price) || 0,
      low_stock_threshold: productDetails.low_stock_threshold ? parseInt(productDetails.low_stock_threshold) : undefined,
      expiration: productDetails.expiration
    };
    
    onUpdate(updatedItem);
    setEditProductOpen(false);
  };

  const handleSaveStock = () => {
    const newStock = parseInt(stockInputValue, 10);
    if (isNaN(newStock)) {
      toast({
        title: "Invalid Stock Value",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }
    
    const updatedItem = {
      ...item,
      stock: newStock
    };
    
    onUpdate(updatedItem);
    
    toast({
      title: "Stock Updated",
      description: `${item.name} stock updated to ${newStock}`,
    });
    setAdjustStockOpen(false);
  };

  const handleDeleteProduct = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    onDelete(item.id);
    setDeleteConfirmOpen(false);
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate stock value with null safety
  const currentStockValue = currentStock * (item.unit_price || 0);

  return (
    <>
      <div className="flex items-center gap-1">
        <InventoryHistoryDropdown 
          productId={item.id} 
          productName={item.name} 
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleViewDetails}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEditProduct}>
              <Edit className="mr-2 h-4 w-4" />
              Edit product
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAdjustStock}>
              <Package className="mr-2 h-4 w-4" />
              Adjust stock
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBatchManagementOpen(true)}>
              <Layers className="mr-2 h-4 w-4" />
              Manage batches
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteProduct} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              Detailed information about this product.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Name:</Label>
              <div className="col-span-3">{item.name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">UPC:</Label>
              <div className="col-span-3">{item.upc || 'N/A'}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">ASIN:</Label>
              <div className="col-span-3">{item.asin || 'N/A'}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Stock:</Label>
              <div className="col-span-3">
                <HoverCard>
                  <HoverCardTrigger>
                    <span className={`px-2 py-1 rounded-full text-white text-xs ${
                      currentStock <= 5 ? 'bg-cargo-red' :
                      currentStock <= 10 ? 'bg-cargo-yellow' :
                      'bg-cargo-green'
                    }`}>
                      {currentStock} units
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <div className="text-sm">
                      {currentStock <= 5 ? 'Critical low stock' :
                       currentStock <= 10 ? 'Low stock' :
                       'Healthy stock level'}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Unit Price:</Label>
              <div className="col-span-3 flex items-center">
                <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                {formatCurrency(item.unit_price || 0)}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Case Price:</Label>
              <div className="col-span-3 flex items-center">
                <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
                {formatCurrency(item.case_price || 0)}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Stock Value:</Label>
              <div className="col-span-3 flex items-center">
                <DollarSign className="h-4 w-4 text-purple-600 mr-1" />
                {formatCurrency(currentStockValue)}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Dimensions:</Label>
              <div className="col-span-3">{item.dimensions || 'N/A'}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Weight:</Label>
              <div className="col-span-3">{item.weight || 'N/A'}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Expiration:</Label>
              <div className="col-span-3">
                {item.expiration ? format(new Date(item.expiration), 'PPP') : 'No expiration date'}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setViewDetailsOpen(false)}
              className="bg-gray-800 hover:bg-gray-900"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editProductOpen} onOpenChange={setEditProductOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Make changes to the product information. Unit and case prices will auto-calculate based on case size ({item.casesize || '1'} units per case).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={productDetails.name}
                onChange={handleProductChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="upc" className="text-right">
                UPC
              </Label>
              <Input
                id="upc"
                name="upc"
                value={productDetails.upc}
                onChange={handleProductChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="asin" className="text-right">
                ASIN
              </Label>
              <Input
                id="asin"
                name="asin"
                value={productDetails.asin}
                onChange={handleProductChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit_price" className="text-right">
                Unit Price
              </Label>
              <Input
                id="unit_price"
                name="unit_price"
                type="number"
                step="0.01"
                value={productDetails.unit_price}
                onChange={handlePriceChange}
                className="col-span-3"
                placeholder="Enter unit price"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="case_price" className="text-right">
                Case Price
              </Label>
              <Input
                id="case_price"
                name="case_price"
                type="number"
                step="0.01"
                value={productDetails.case_price}
                onChange={handlePriceChange}
                className="col-span-3"
                placeholder="Enter case price"
              />
            </div>
            {item.casesize && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm text-gray-500">
                  Case Size:
                </Label>
                <div className="col-span-3 text-sm text-gray-500 font-medium">
                  {item.casesize} units per case
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="low_stock_threshold" className="text-right">
                Low Stock Threshold
              </Label>
              <Input
                id="low_stock_threshold"
                name="low_stock_threshold"
                type="number"
                value={productDetails.low_stock_threshold}
                onChange={handleProductChange}
                className="col-span-3"
                placeholder="Set low stock alert threshold"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dimensions" className="text-right">
                Dimensions
              </Label>
              <Input
                id="dimensions"
                name="dimensions"
                value={productDetails.dimensions}
                onChange={handleProductChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Weight
              </Label>
              <Input
                id="weight"
                name="weight"
                value={productDetails.weight}
                onChange={handleProductChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiration" className="text-right">
                Expiration
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !productDetails.expiration && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {productDetails.expiration ? (
                        format(new Date(productDetails.expiration), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={productDetails.expiration ? new Date(productDetails.expiration) : undefined}
                      onSelect={handleExpirationChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditProductOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProductDetails}
              className="bg-gray-800 hover:bg-gray-900"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustStockOpen} onOpenChange={setAdjustStockOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Update the stock quantity for {item.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stock
              </Label>
              <Input
                id="stock"
                type="number"
                value={stockInputValue}
                onChange={(e) => setStockInputValue(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAdjustStockOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveStock}
              className="bg-gray-800 hover:bg-gray-900"
            >
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              variant="destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Management Dialog */}
      <BatchManagementDialog
        open={batchManagementOpen}
        onOpenChange={setBatchManagementOpen}
        product={item}
        onBatchesUpdated={() => {
          // Trigger inventory refetch to update totals
          window.location.reload();
        }}
      />
    </>
  );
};

export default InventoryActions;
