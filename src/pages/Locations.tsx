import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Filter, MoreHorizontal, Search, Plus, Package, Boxes, AlertCircle, Scan, Eye, Edit, Trash2, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AddPalletDialog from '@/components/locations/AddPalletDialog';
import MoveItemsDialog from '@/components/locations/MoveItemsDialog';
import EditLocationDialog from '@/components/locations/EditLocationDialog';
import AdvancedLocationFilters, { LocationFilters } from '@/components/locations/AdvancedLocationFilters';
import MobileQuickActions from '@/components/locations/MobileQuickActions';
import LocationAnalyticsDashboard from '@/components/locations/LocationAnalyticsDashboard';
import BarcodeScanner, { ScanMode } from '@/components/barcode/BarcodeScanner';
import BarcodeFloatingButton from '@/components/barcode/BarcodeFloatingButton';
import { useToast } from '@/hooks/use-toast';
import { useInventory } from '@/contexts/InventoryContext';
import { cn } from '@/lib/utils';
import { useEnhancedLocationManagement } from '@/hooks/useEnhancedLocationManagement';
import { useIsMobile } from '@/hooks/use-mobile';
import { PalletLocation } from '@/hooks/usePalletLocations';
import AutomaticAdjustmentPanel from '@/components/locations/AutomaticAdjustmentPanel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ProductLocation = {
  sku: string;
  name: string;
  locations: string[];
  totalQty: number;
  upc: string;
};

const Locations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pallets' | 'products' | 'analytics'>('pallets');
  const [addPalletOpen, setAddPalletOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('lookup');
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PalletLocation | null>(null);
  const [markEmptyOpen, setMarkEmptyOpen] = useState(false);
  const [locationToEmpty, setLocationToEmpty] = useState<string | null>(null);
  const [deleteLocationOpen, setDeleteLocationOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [moveItemsOpen, setMoveItemsOpen] = useState(false);
  const [editLocationOpen, setEditLocationOpen] = useState(false);
  const [selectedLocationForMove, setSelectedLocationForMove] = useState<PalletLocation | null>(null);
  const [selectedLocationForEdit, setSelectedLocationForEdit] = useState<PalletLocation | null>(null);
  const { toast } = useToast();
  const { inventoryItems } = useInventory();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  const {
    pallets,
    loading,
    addPallet,
    analytics,
    suggestions,
    realtimeMovements,
    moveItems,
    bulkUpdateLocations,
    fetchPallets
  } = useEnhancedLocationManagement();
  
  const [selectedPalletId, setSelectedPalletId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductLocation[]>([]);
  const [filters, setFilters] = useState<LocationFilters>({
    searchTerm: '',
    zone: '',
    velocity: '',
    utilizationRange: [0, 100],
    showEmpty: false,
    showOverstocked: false,
    category: '',
    lastMovedDays: 30
  });

  // Calculate products from pallets data
  const calculateProducts = (): ProductLocation[] => {
    const productMap = new Map<string, ProductLocation>();
    
    pallets.forEach(pallet => {
      pallet.products.forEach(product => {
        const existingProduct = productMap.get(product.sku);
        
        if (existingProduct) {
          existingProduct.totalQty += product.qty;
          if (!existingProduct.locations.includes(pallet.id)) {
            existingProduct.locations.push(pallet.id);
          }
        } else {
          productMap.set(product.sku, {
            sku: product.sku,
            name: product.name,
            locations: [pallet.id],
            totalQty: product.qty,
            upc: product.upc,
          });
        }
      });
    });
    
    return Array.from(productMap.values());
  };

  useEffect(() => {
    setProducts(calculateProducts());
  }, [pallets]);

  const handleAddPallet = async (newPallet: any) => {
    try {
      await addPallet(newPallet);
      setAddPalletOpen(false);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleViewDetails = (pallet: PalletLocation) => {
    setSelectedLocation(pallet);
    setViewDetailsOpen(true);
  };

  const handleEditLocation = (palletId: string) => {
    const location = pallets.find(p => p.id === palletId);
    if (location) {
      setSelectedLocationForEdit(location);
      setEditLocationOpen(true);
    }
  };

  const handleMoveItems = (fromPallet: string) => {
    const location = pallets.find(p => p.id === fromPallet);
    if (location) {
      setSelectedLocationForMove(location);
      setMoveItemsOpen(true);
    }
  };

  const handleMoveItemsSubmit = async (fromPallet: string, toPallet: string, items: Array<{sku: string, quantity: number}>) => {
    try {
      // Implementation for moving items between pallets
      await moveItems(fromPallet, toPallet, items);
    } catch (error) {
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleUpdateLocation = async (locationId: string, updates: Partial<PalletLocation>) => {
    if (!user?.id) return;

    try {
      // Update the pallet location in the database
      const { error } = await supabase
        .from('pallet_locations')
        .update({
          id: updates.id,
          location: updates.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // If the ID changed, we need to update the pallet_products table too
      if (updates.id && updates.id !== locationId) {
        const { error: productsError } = await supabase
          .from('pallet_products')
          .update({ pallet_id: updates.id })
          .eq('pallet_id', locationId)
          .eq('user_id', user.id);

        if (productsError) throw productsError;
      }

      // Refresh the data
      await fetchPallets();
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  };

  const handleMarkEmptyConfirm = async () => {
    if (!locationToEmpty) return;
    
    try {
      // In a real implementation, you would update the database to mark the location as empty
      toast({
        title: "Location Marked Empty",
        description: `Location ${locationToEmpty} has been marked as empty`,
      });
      
      // Refresh the data
      await fetchPallets();
      setMarkEmptyOpen(false);
      setLocationToEmpty(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark location as empty",
        variant: "destructive",
      });
    }
  };

  const handleMarkEmpty = (palletId: string) => {
    setLocationToEmpty(palletId);
    setMarkEmptyOpen(true);
  };

  const handleDeleteLocation = (palletId: string) => {
    setLocationToDelete(palletId);
    setDeleteLocationOpen(true);
  };

  const handleDeleteLocationConfirm = async () => {
    if (!locationToDelete || !user?.id) return;
    
    try {
      // Delete pallet products first (foreign key constraint)
      const { error: productsError } = await supabase
        .from('pallet_products')
        .delete()
        .eq('pallet_id', locationToDelete)
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      // Then delete the pallet location
      const { error: locationError } = await supabase
        .from('pallet_locations')
        .delete()
        .eq('id', locationToDelete)
        .eq('user_id', user.id);

      if (locationError) throw locationError;

      toast({
        title: "Location Deleted",
        description: `Location ${locationToDelete} has been deleted successfully`,
      });
      
      // Refresh the data
      await fetchPallets();
      setDeleteLocationOpen(false);
      setLocationToDelete(null);
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    }
  };

  const handleBarcodeScan = (barcode: string, mode: ScanMode) => {
    console.log(`Scanned barcode: ${barcode} in ${mode} mode`);
    
    // Find product by barcode/UPC
    const product = products.find(p => p.upc === barcode || p.sku === barcode);
    
    if (product) {
      toast({
        title: "Product Found",
        description: `${product.name} found in ${product.locations.length} location(s)`,
      });
      
      // Highlight the product locations
      setActiveTab('products');
      setSearchTerm(barcode);
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive",
      });
    }
    
    setScannerOpen(false);
  };

  const handleQuickScan = () => {
    setScanMode('lookup');
    setScannerOpen(true);
  };

  const handleBulkMove = () => {
    toast({
      title: "Bulk Move",
      description: "Bulk move feature opened",
    });
  };

  const handleVoiceCommand = () => {
    toast({
      title: "Voice Command",
      description: "Voice command feature activated",
    });
  };

  // Apply filters to pallets and products
  const applyFilters = (items: any[], type: 'pallets' | 'products') => {
    let filtered = items;
    
    // Apply search term - use the current searchTerm or the one from filters
    const currentSearchTerm = searchTerm || filters.searchTerm;
    if (currentSearchTerm) {
      filtered = filtered.filter(item => {
        if (type === 'pallets') {
          return item.id.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                 item.location.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                 item.products.some((p: any) => 
                   p.sku.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                   p.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                   p.upc.toLowerCase().includes(currentSearchTerm.toLowerCase())
                 );
        } else {
          return item.sku.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                 item.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                 item.upc.toLowerCase().includes(currentSearchTerm.toLowerCase());
        }
      });
    }
    
    // Apply zone filter
    if (filters.zone) {
      filtered = filtered.filter(item => {
        if (type === 'pallets') {
          return item.location.startsWith(filters.zone);
        } else {
          return item.locations.some((loc: string) => loc.startsWith(filters.zone));
        }
      });
    }
    
    return filtered;
  };

  const filteredPallets = applyFilters(pallets, 'pallets');
  const filteredProducts = applyFilters(products, 'products');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent flex items-center">
          <MapPin className="h-6 w-6 mr-2 text-neutral-400" />
          Enhanced Location Management
        </h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleQuickScan}
            className="gap-2"
          >
            <Scan className="h-4 w-4" />
            Quick Scan
          </Button>
          <Button 
            className="gap-2"
            onClick={() => setAddPalletOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <AdvancedLocationFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Mobile Quick Actions */}
      {isMobile && (
        <MobileQuickActions
          onScanLocation={handleQuickScan}
          onBulkMove={handleBulkMove}
          onMarkEmpty={() => handleMarkEmpty('')}
          onVoiceCommand={handleVoiceCommand}
        />
      )}

      {/* Automatic Adjustment Panel */}
      <AutomaticAdjustmentPanel />

      <Card className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b border-neutral-800">
          <CardTitle className="text-lg flex items-center text-white">
            <MapPin className="h-5 w-5 mr-2 text-neutral-400" />
            Smart Warehouse Location Tracking
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Real-time location tracking with intelligent suggestions and analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 bg-neutral-900/70 border-b border-neutral-800">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex space-x-2">
                <Button
                  variant='outline'
                  onClick={() => setActiveTab('pallets')}
                  className={activeTab === 'pallets' ? 'bg-black text-white border-neutral-700' : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white'}
                >
                  Locations
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setActiveTab('products')}
                  className={activeTab === 'products' ? 'bg-black text-white border-neutral-700' : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white'}
                >
                  Products
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setActiveTab('analytics')}
                  className={activeTab === 'analytics' ? 'bg-black text-white border-neutral-700' : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white'}
                >
                  Analytics
                </Button>
              </div>
              
              {activeTab !== 'analytics' && (
                <div className="flex space-x-2 w-full md:w-auto">
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input
                      placeholder={activeTab === 'pallets' ? "Search locations, products, or UPC..." : "Search products, UPC, or location..."}
                      className="pl-9 bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-gray-700/50 focus:ring-1 focus:ring-gray-700/30"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'analytics' ? (
            <div className="p-4">
              <LocationAnalyticsDashboard
                analytics={analytics}
                suggestions={suggestions}
                realtimeMovements={realtimeMovements}
              />
            </div>
          ) : (
            <div className="rounded-md">
              {loading ? (
                <div className="p-8 text-center text-neutral-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                  Loading enhanced location data...
                </div>
              ) : activeTab === 'pallets' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-neutral-800/90">
                      <TableRow className="border-neutral-700">
                        <TableHead className="font-medium text-neutral-300">Location ID</TableHead>
                        <TableHead className="font-medium text-neutral-300">Zone</TableHead>
                        <TableHead className="font-medium text-neutral-300">Products</TableHead>
                        <TableHead className="font-medium text-neutral-300">Utilization</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPallets.length > 0 ? (
                        filteredPallets.map((pallet) => {
                          const locationAnalytics = analytics.find(a => a.locationId === pallet.id);
                          const utilization = locationAnalytics?.utilizationRate || 0;
                          
                          return (
                            <TableRow 
                              key={pallet.id} 
                              className="border-neutral-700 hover:bg-neutral-700/30 transition-colors"
                            >
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className="font-medium bg-neutral-500/20 border-neutral-500/30 text-neutral-300 py-1"
                                >
                                  {pallet.id}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-white">{pallet.location}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {pallet.products.slice(0, 2).map((product: any) => (
                                    <div key={product.sku} className="text-sm text-neutral-300">
                                      {product.name} ({product.qty})
                                    </div>
                                  ))}
                                  {pallet.products.length > 2 && (
                                    <div className="text-xs text-neutral-400">
                                      +{pallet.products.length - 2} more
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-full bg-neutral-700 rounded-full h-2">
                                    <div 
                                      className={cn(
                                        "h-2 rounded-full transition-all",
                                        utilization > 90 ? "bg-red-500" :
                                        utilization > 70 ? "bg-yellow-500" : "bg-green-500"
                                      )}
                                      style={{ width: `${Math.min(utilization, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-neutral-300 whitespace-nowrap">
                                    {utilization.toFixed(0)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 text-neutral-300 hover:text-white hover:bg-neutral-700/60">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700 text-white">
                                    <DropdownMenuItem 
                                      className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
                                      onClick={() => handleViewDetails(pallet)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
                                      onClick={() => handleEditLocation(pallet.id)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit location
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
                                      onClick={() => handleMoveItems(pallet.id)}
                                    >
                                      <Package className="mr-2 h-4 w-4" />
                                      Move items
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
                                      onClick={() => handleMarkEmpty(pallet.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Mark empty
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="hover:bg-red-700 focus:bg-red-700 cursor-pointer text-red-400 hover:text-red-300"
                                      onClick={() => handleDeleteLocation(pallet.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete location
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow className="border-neutral-700">
                          <TableCell colSpan={5} className="text-center py-12 text-neutral-400">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <Boxes className="h-8 w-8 text-neutral-400" />
                              <div className="space-y-1 text-center">
                                <h3 className="text-lg font-medium text-neutral-300">No locations found</h3>
                                <p className="text-sm text-neutral-400">
                                  Add your first warehouse location to get started
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                // ... keep existing code (products table rendering) the same
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-neutral-800/90">
                      <TableRow className="border-neutral-700">
                        <TableHead className="font-medium text-neutral-300">Product</TableHead>
                        <TableHead className="font-medium text-neutral-300">SKU</TableHead>
                        <TableHead className="font-medium text-neutral-300">UPC</TableHead>
                        <TableHead className="font-medium text-neutral-300">Locations</TableHead>
                        <TableHead className="font-medium text-neutral-300">Total Quantity</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <TableRow key={product.sku} className="border-neutral-700 hover:bg-neutral-700/30 transition-colors">
                            <TableCell className="font-medium text-white">{product.name}</TableCell>
                            <TableCell>
                              <code className="bg-neutral-700/70 px-2 py-0.5 rounded text-indigo-300 font-mono text-xs">{product.sku}</code>
                            </TableCell>
                            <TableCell>
                              <code className="bg-neutral-700/70 px-2 py-0.5 rounded text-indigo-300 font-mono text-xs">{product.upc}</code>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {product.locations.map((location) => (
                                  <Badge 
                                    key={location} 
                                    variant="outline" 
                                    className="text-xs bg-indigo-500/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                                  >
                                    {location}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-indigo-500 shadow-md">{product.totalQty} units</Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 text-neutral-300 hover:text-white hover:bg-neutral-700/60">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700 text-white">
                                  <DropdownMenuItem className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add location
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer">
                                    <Package className="mr-2 h-4 w-4" />
                                    Move product
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className="border-neutral-700">
                          <TableCell colSpan={6} className="text-center py-12 text-neutral-400">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <Package className="h-8 w-8 text-neutral-400" />
                              <div className="space-y-1 text-center">
                                <h3 className="text-lg font-medium text-neutral-300">No products found</h3>
                                <p className="text-sm text-neutral-400">
                                  Products will appear here once you assign locations
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
               )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Floating Barcode Scanner Button */}
      {!isMobile && (
        <BarcodeFloatingButton
          onScan={(mode) => {
            setScanMode(mode);
            setScannerOpen(true);
          }}
        />
      )}
      
      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        mode={scanMode}
        onScan={handleBarcodeScan}
        onClose={() => setScannerOpen(false)}
        isOpen={scannerOpen}
      />
      
      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Location Details</DialogTitle>
            <DialogDescription>
              Detailed information about this warehouse location.
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Location ID:</label>
                <div className="col-span-3">
                  <Badge variant="outline" className="font-medium">
                    {selectedLocation.id}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Zone:</label>
                <div className="col-span-3">{selectedLocation.location}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Products:</label>
                <div className="col-span-3">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedLocation.products.map((product) => (
                      <div key={product.sku} className="flex justify-between items-center text-sm p-2 bg-muted rounded border">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            SKU: {product.sku} | UPC: {product.upc || 'N/A'}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {product.qty} units
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Last Updated:</label>
                <div className="col-span-3">{selectedLocation.lastUpdated}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Empty Confirmation Dialog */}
      <Dialog open={markEmptyOpen} onOpenChange={setMarkEmptyOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mark Location Empty</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark location {locationToEmpty} as empty? This will remove all products from this location.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setMarkEmptyOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMarkEmptyConfirm}
              variant="destructive"
            >
              Mark Empty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Location Confirmation Dialog */}
      <Dialog open={deleteLocationOpen} onOpenChange={setDeleteLocationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete location {locationToDelete}? This action cannot be undone and will remove all products from this location.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteLocationOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteLocationConfirm}
              variant="destructive"
            >
              Delete Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AddPalletDialog
        open={addPalletOpen}
        onOpenChange={setAddPalletOpen}
        onAddPallet={handleAddPallet}
        inventoryItems={inventoryItems}
      />

      <MoveItemsDialog
        open={moveItemsOpen}
        onOpenChange={setMoveItemsOpen}
        sourceLocation={selectedLocationForMove}
        availableLocations={pallets}
        onMoveItems={handleMoveItemsSubmit}
      />

      <EditLocationDialog
        open={editLocationOpen}
        onOpenChange={setEditLocationOpen}
        location={selectedLocationForEdit}
        onUpdateLocation={handleUpdateLocation}
      />
    </div>
  );
};

export default Locations;
