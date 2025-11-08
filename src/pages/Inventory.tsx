import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  MoreHorizontal, 
  Package, 
  Search, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Zap,
  Building2,
  ArrowRight
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useInventory } from "@/contexts/InventoryContext";
import { useWarehouse } from "@/contexts/WarehouseContext";
import { useWarehouseScopedInventory } from "@/hooks/useWarehouseScopedInventory";
import AddProductDialog from "@/components/inventory/AddProductDialog";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import InventoryActions from "@/components/inventory/InventoryActions";
import InventoryHistoryDropdown from "@/components/inventory/InventoryHistoryDropdown";
import PricingDisplaySelector from "@/components/inventory/PricingDisplaySelector";
import ImportInvoiceDialog from "@/components/inventory/ImportInvoiceDialog";
import DisabledWrapper from "@/components/inventory/DisabledWrapper";
import { InventoryItem } from "@/contexts/InventoryContext";
import WarehouseContextIndicator from "@/components/warehouse/WarehouseContextIndicator";
import BatchAssignmentDialog from "@/components/inventory/BatchAssignmentDialog";
import { useUnassignedInventory } from "@/hooks/useUnassignedInventory";
import BarcodeScanner from "@/components/barcode/BarcodeScanner";
import BarcodeScanButton from "@/components/barcode/BarcodeScanButton";
import BarcodeFloatingButton from "@/components/barcode/BarcodeFloatingButton";
import { useBarcode } from "@/hooks/useBarcode";
import { useToast } from "@/hooks/use-toast";
import { ProductTransferDialog } from "@/components/inventory/ProductTransferDialog";
import { SKUDisplay } from "@/components/inventory/ProductDisplayUtils";
import { ExpirationDisplay } from "@/components/inventory/ExpirationDisplay";
// import { InventoryFixButton } from "@/components/billing/InventoryFixButton";
// import { InventoryDebugPanel } from "@/components/billing/InventoryDebugPanel";

type PricingDisplayMode = 'unit' | 'case' | 'cost' | 'case_cost';

const Inventory = () => {
  const { inventoryItems, isLoading, refetch } = useWarehouseScopedInventory();
  const { addProduct, updateProduct, deleteProduct, isAddingProduct } = useInventory();
  const { selectedWarehouse, isUserAdmin, warehouses } = useWarehouse();
  const { isScanning, scanMode, handleScan, openScanner, closeScanner } = useBarcode();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pricingDisplay, setPricingDisplay] = useState<PricingDisplayMode>('unit');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showBatchAssignment, setShowBatchAssignment] = useState(false);
  // const [showDebugPanel, setShowDebugPanel] = useState(false);
  // const [debugInvoiceId, setDebugInvoiceId] = useState('');
  
  const { unassignedItems, hasUnassignedItems, totalUnassignedProducts } = useUnassignedInventory();

  // Check if we're in Corporate Overview mode (admin with no warehouse selected)
  const isCorporateOverview = !selectedWarehouse && isUserAdmin;

  // Filter and sort inventory items
  const filteredItems = useMemo(() => {
    let filtered = inventoryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'created_at':
          aValue = new Date((a as any).created_at || 0).getTime();
          bValue = new Date((b as any).created_at || 0).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [inventoryItems, searchTerm, selectedCategory, sortBy, sortOrder]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(inventoryItems.map(item => item.category).filter(Boolean))];
    return uniqueCategories;
  }, [inventoryItems]);

  // Filter items based on stock levels using per-product thresholds
  const lowStockItems = inventoryItems.filter(item => item.stock > 0 && item.stock <= (item.low_stock_threshold || 10));
  const outOfStockItems = inventoryItems.filter(item => item.stock === 0);

  const getStockBadge = (stock: number, threshold?: number) => {
    const lowStockThreshold = threshold || 10;
    if (stock === 0) {
      return (
        <Badge className="bg-red-500/20 text-red-300 border-red-500/30 border rounded-full px-3 py-1 whitespace-nowrap">
          Out of Stock
        </Badge>
      );
    } else if (stock <= lowStockThreshold) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 border rounded-full px-3 py-1 whitespace-nowrap">
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border rounded-full px-3 py-1 whitespace-nowrap">
          {stock} units
        </Badge>
      );
    }
  };

  const getPriceDisplay = (item: any) => {
    switch (pricingDisplay) {
      case 'unit':
        return `$${(item.unit_price || 0).toFixed(2)}`;
      case 'case':
        return `$${(item.case_price || 0).toFixed(2)}`;
      case 'cost':
        return `$${(item.cost_price || 0).toFixed(2)}`;
      case 'case_cost':
        return `$${(item.case_cost || 0).toFixed(2)}`;
      default:
        return `$${(item.unit_price || 0).toFixed(2)}`;
    }
  };

  const formatStockValue = (stock: number, unitPrice: number) => {
    return `$${(stock * (unitPrice || 0)).toFixed(2)}`;
  };

  const formatExpirationDate = (expiration: Date | null | undefined) => {
    if (!expiration) return '-';
    return new Date(expiration).toLocaleDateString();
  };

  const handleUpdateProduct = (item: InventoryItem) => {
    updateProduct(item);
  };

  const handleDeleteProduct = (id: string) => {
    deleteProduct(id);
  };

  const handleAddProduct = async (product: any) => {
    try {
      console.log('Adding product from inventory page:', product);
      await addProduct(product);
      // Toast is now handled in AddProductDialog, so no duplicate here
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product to inventory",
        variant: "destructive",
      });
    }
  };

  const handleBarcodeAction = (mode: any) => {
    if (isCorporateOverview) {
      toast({
        title: "Action Not Available",
        description: "Please select a specific warehouse to scan products",
        variant: "destructive",
      });
      return;
    }
    openScanner(mode);
  };

  // Mock filters state
  const [filters, setFilters] = useState({
    lowStock: false,
    expiringSoon: false,
    noLocation: false
  });

  const handleFilterChange = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-neutral-900">
        <div className="text-lg text-white">Loading inventory data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-neutral-900 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
          <p className="text-neutral-400">Track and manage your product inventory</p>
        </div>
        <div className="flex gap-2">
          {!isCorporateOverview && (
            <BarcodeScanButton
              mode="lookup"
              onScan={handleBarcodeAction}
              variant="outline"
              className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
            />
          )}
          {(isCorporateOverview || selectedWarehouse) && (
            <Button
              onClick={() => setShowTransferDialog(true)}
              className="bg-gray-800 hover:bg-gray-900 gap-2 text-white"
            >
              <ArrowRight className="h-4 w-4" />
              Transfer Products
            </Button>
          )}
          {!isCorporateOverview && <ImportInvoiceDialog />}
          {!isCorporateOverview && <AddProductDialog onAddProduct={handleAddProduct} />}
        </div>
      </div>

      <WarehouseContextIndicator />
      

      {/* Show loading indicator when adding product */}
      {isAddingProduct && (
        <div className="bg-gray-700/20 border border-gray-600 rounded-lg p-3 text-gray-300">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
            Adding product to inventory...
          </div>
        </div>
      )}

      {/* Quick Scan Actions */}
      {!isCorporateOverview && (
        <div className="flex gap-2 mb-4">
          <BarcodeScanButton
            mode="receiving"
            onScan={handleBarcodeAction}
            variant="outline"
            size="sm"
            className="bg-green-600/20 border-green-600 text-green-300 hover:bg-green-600/30 gap-2"
          />
          <BarcodeScanButton
            mode="picking"
            onScan={handleBarcodeAction}
            variant="outline"
            size="sm"
            className="bg-orange-600/20 border-orange-600 text-orange-300 hover:bg-orange-600/30 gap-2"
          />
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-neutral-900 border-neutral-800">
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Product Inventory</CardTitle>
                <div className="flex items-center gap-4">
                  {hasUnassignedItems && (
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => setShowBatchAssignment(true)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Assign to Batches ({totalUnassignedProducts})
                    </Button>
                  )}
                  <PricingDisplaySelector 
                    value={pricingDisplay as any} 
                    onChange={(value) => setPricingDisplay(value as PricingDisplayMode)} 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400"
                  />
                </div>
                <InventoryFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                />
              </div>

              <div className="rounded-md border border-neutral-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-800/90 border-neutral-700">
                       <TableHead className="text-neutral-300 w-48">Product</TableHead>
                       <TableHead className="text-neutral-300 w-28">Product ID</TableHead>
                       <TableHead className="text-neutral-300 w-32">Stock</TableHead>
                       {isCorporateOverview && <TableHead className="text-slate-300 w-20">Unit Price</TableHead>}
                       {isCorporateOverview && <TableHead className="text-slate-300 w-20">Case Price</TableHead>}
                       {isCorporateOverview && <TableHead className="text-slate-300 w-24">Stock Value</TableHead>}
                        {!isCorporateOverview && <TableHead className="text-slate-300 w-20">Case Size</TableHead>}
                        {!isCorporateOverview && <TableHead className="text-slate-300 w-24">Dimensions</TableHead>}
                        {!isCorporateOverview && <TableHead className="text-slate-300 w-20">Weight</TableHead>}
                       {!isCorporateOverview && <TableHead className="text-slate-300 w-32">Expiration</TableHead>}
                       <TableHead className="text-slate-300 w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id} className="border-slate-600 hover:bg-slate-700/30">
                        <TableCell className="w-48">
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-600 rounded flex items-center justify-center flex-shrink-0">
                                <Package className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</p>
                              <p className="text-xs text-slate-400">SKU: {item.sku}</p>
                              {item.description && (
                                <p className="text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          <div className="space-y-1">
                            {item.upc && (
                              <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30 border rounded px-3 py-1 whitespace-nowrap font-mono block">
                                UPC: {item.upc}
                              </Badge>
                            )}
                            {item.asin && (
                              <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30 border rounded px-3 py-1 whitespace-nowrap font-mono block">
                                ASIN: {item.asin}
                              </Badge>
                            )}
                            {!item.upc && !item.asin && (
                              <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30 border rounded px-3 py-1 whitespace-nowrap font-mono">
                                N/A
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                         <TableCell className="text-slate-300">
                           <div className="space-y-1">
                             <div className="whitespace-nowrap">
                               {getStockBadge(item.stock, item.low_stock_threshold)}
                             </div>
                             {(item as any).reserved_quantity > 0 && (
                               <div className="text-xs text-slate-400">
                                 Available: {item.stock - ((item as any).reserved_quantity || 0)}
                               </div>
                             )}
                           </div>
                         </TableCell>
                        {isCorporateOverview && (
                          <TableCell className="text-slate-300">
                            <div className="whitespace-nowrap">
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border rounded-full px-3 py-1">
                                $ {(item.unit_price || 0).toFixed(2)}
                              </Badge>
                            </div>
                          </TableCell>
                        )}
                        {isCorporateOverview && (
                          <TableCell className="text-slate-300">
                            <div className="whitespace-nowrap">
                              <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30 border rounded-full px-3 py-1">
                                $ {(item.case_price || 0).toFixed(2)}
                              </Badge>
                            </div>
                          </TableCell>
                        )}
                        {isCorporateOverview && (
                          <TableCell className="text-slate-300">
                            <div className="whitespace-nowrap">
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 border rounded-full px-3 py-1">
                                $ {formatStockValue(item.stock, item.unit_price || 0)}
                              </Badge>
                            </div>
                          </TableCell>
                        )}
                        {!isCorporateOverview && (
                          <TableCell className="text-slate-300">
                             {item.casesize ? (
                              <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30 border rounded-full px-3 py-1">
                                 {item.casesize}
                               </Badge>
                             ) : (
                               <span className="text-slate-400">No case size</span>
                             )}
                          </TableCell>
                         )}
                         {!isCorporateOverview && (
                           <TableCell className="text-slate-300">
                              {item.dimensions ? (
                              <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30 border rounded-full px-3 py-1">
                                  {item.dimensions}
                                </Badge>
                              ) : (
                                <span className="text-slate-400">No dimensions</span>
                              )}
                           </TableCell>
                         )}
                         {!isCorporateOverview && (
                          <TableCell className="text-slate-300">
                            {item.weight ? (
                              <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30 border rounded-full px-3 py-1">
                                {item.weight}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">No weight</span>
                            )}
                          </TableCell>
                        )}
                        {!isCorporateOverview && (
                          <TableCell className="text-slate-300">
                            <ExpirationDisplay 
                              productExpiration={item.expiration}
                              batches={item.batches}
                              hasBatches={item.has_batches}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <InventoryActions 
                            item={item as any} 
                            onUpdate={handleUpdateProduct} 
                            onDelete={handleDeleteProduct} 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Low Stock Items</CardTitle>
              <CardDescription className="text-slate-400">
                Items below their customizable low stock thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-600 rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{item.name}</h3>
                        <p className="text-sm text-slate-400">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">{item.stock} units</p>
                      {getStockBadge(item.stock)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="out-of-stock">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Out of Stock Items</CardTitle>
              <CardDescription className="text-slate-400">
                Items that are currently out of stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {outOfStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-600 rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{item.name}</h3>
                        <p className="text-sm text-slate-400">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">0 units</p>
                      {getStockBadge(0)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BarcodeScanner
        mode={scanMode}
        onScan={handleScan}
        onClose={closeScanner}
        isOpen={isScanning}
      />

      <ProductTransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        currentWarehouse={selectedWarehouse}
      />

      <BatchAssignmentDialog
        open={showBatchAssignment}
        onOpenChange={setShowBatchAssignment}
        onAssignmentComplete={() => {
          setShowBatchAssignment(false);
          refetch();
        }}
      />


      {!isCorporateOverview && (
        <BarcodeFloatingButton onScan={handleBarcodeAction} />
      )}
    </div>
  );
};

export default Inventory;
