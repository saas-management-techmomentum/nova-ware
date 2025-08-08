
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { MapPin, Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from '@/contexts/InventoryContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PalletLocation, usePalletLocations } from '@/hooks/usePalletLocations';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ProductOnPallet = {
  sku: string;
  name: string;
  upc: string;
  qty: number;
  product_id: string;
};

interface AddPalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPallet: (pallet: Omit<PalletLocation, 'lastUpdated'>) => Promise<void>;
  inventoryItems: InventoryItem[];
}

const AddPalletDialog: React.FC<AddPalletDialogProps> = ({ 
  open, 
  onOpenChange, 
  onAddPallet,
  inventoryItems 
}) => {
  const { toast } = useToast();
  const { checkLocationIdExists, generateUniqueLocationId } = usePalletLocations();
  const [palletId, setPalletId] = useState('');
  const [zone, setZone] = useState('');
  const [aisle, setAisle] = useState('');
  const [section, setSection] = useState('');
  const [shelf, setShelf] = useState('');
  const [bin, setBin] = useState('');
  const [locationType, setLocationType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [temperature, setTemperature] = useState('');
  const [products, setProducts] = useState<ProductOnPallet[]>([]);
  const [openProductSearch, setOpenProductSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);

  // Generate unique location ID
  const handleGenerateUniqueId = async () => {
    setIsGeneratingId(true);
    try {
      const uniqueId = await generateUniqueLocationId(palletId || undefined);
      setPalletId(uniqueId);
      toast({
        title: "Unique ID Generated",
        description: `Generated unique location ID: ${uniqueId}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate unique ID",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Validation check
  const getMissingFields = () => {
    const missing = [];
    if (!palletId) missing.push('Location ID');
    if (!zone) missing.push('Zone');
    if (!aisle) missing.push('Aisle');
    if (!section) missing.push('Section');
    if (!locationType) missing.push('Location Type');
    if (products.length === 0) missing.push('At least one product');
    return missing;
  };

  const missingFields = getMissingFields();
  const isFormValid = missingFields.length === 0;

  const resetForm = () => {
    setPalletId('');
    setZone('');
    setAisle('');
    setSection('');
    setShelf('');
    setBin('');
    setLocationType('');
    setCapacity('');
    setTemperature('');
    setProducts([]);
    setIsSubmitting(false);
  };

  const handleSelectProduct = (selectedSku: string) => {
    const product = inventoryItems.find(item => item.sku === selectedSku);
    if (!product) return;
    
    // Check if product already exists in the list
    const existingProductIndex = products.findIndex(p => p.sku === selectedSku);
    
    if (existingProductIndex >= 0) {
      // Update quantity if product already exists
      const updatedProducts = [...products];
      updatedProducts[existingProductIndex].qty += 1;
      setProducts(updatedProducts);
      
      toast({
        title: "Product quantity updated",
        description: `Increased quantity of ${product.name} by 1`,
      });
    } else {
      // Add new product with default quantity of 1
      const newProduct: ProductOnPallet = {
        sku: product.sku,
        name: product.name,
        upc: product.upc || '',
        qty: 1,
        product_id: product.id.toString()
      };
      
      setProducts([...products, newProduct]);
      
      toast({
        title: "Product added to location",
        description: `${product.name} has been added with quantity 1`,
      });
    }
    
    // Close the popover after selection
    setOpenProductSearch(false);
  };

  const handleUpdateProductQuantity = (sku: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveProduct(sku);
      return;
    }
    
    const updatedProducts = products.map(product => 
      product.sku === sku ? { ...product, qty: newQuantity } : product
    );
    setProducts(updatedProducts);
  };

  const handleRemoveProduct = (sku: string) => {
    const productToRemove = products.find(p => p.sku === sku);
    setProducts(products.filter(p => p.sku !== sku));
    
    if (productToRemove) {
      toast({
        title: "Product removed",
        description: `Removed ${productToRemove.name} from location`,
      });
    }
  };

  const generateLocationString = () => {
    const parts = [zone, aisle, section, shelf, bin].filter(Boolean);
    return parts.join('-');
  };

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if location ID already exists before proceeding
      const idExists = await checkLocationIdExists(palletId.trim());
      if (idExists) {
        toast({
          title: "Error",
          description: `Location ID "${palletId}" already exists. Please choose a different ID.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const locationString = generateLocationString();
      
      const newPallet: Omit<PalletLocation, 'lastUpdated'> = {
        id: palletId,
        location: locationString,
        products
      };
      
      await onAddPallet(newPallet);
      resetForm();
      onOpenChange(false);
      
      toast({
        title: "Location Added Successfully",
        description: `Location ${locationString} with ${products.length} product(s) has been created`,
      });
    } catch (error) {
      // Error is already handled in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-white">
            <MapPin className="h-5 w-5 mr-2 text-indigo-400" />
            Add Smart Warehouse Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Validation Alert */}
          {!isFormValid && (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                <strong>Missing required fields:</strong> {missingFields.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Location Identification */}
          <div className="space-y-4">
            <div className="border-b border-slate-700 pb-2">
              <h3 className="text-sm font-semibold text-slate-300">Location Identification</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="palletId" className="flex items-center gap-1 text-slate-300">
                  Location ID *
                  {!palletId && <AlertCircle className="h-3 w-3 text-red-400" />}
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="palletId" 
                    placeholder="LOC-001" 
                    value={palletId} 
                    onChange={(e) => setPalletId(e.target.value)}
                    className={`flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 ${!palletId ? "border-red-500/50" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateUniqueId}
                    disabled={isGeneratingId}
                    className="whitespace-nowrap border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    {isGeneratingId ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="locationType" className="flex items-center gap-1 text-slate-300">
                  Location Type *
                  {!locationType && <AlertCircle className="h-3 w-3 text-red-400" />}
                </Label>
                <Select value={locationType} onValueChange={setLocationType}>
                  <SelectTrigger className={`bg-slate-700/50 border-slate-600 text-white ${!locationType ? "border-red-500/50" : ""}`}>
                    <SelectValue placeholder="Select type" className="text-slate-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="pallet" className="hover:bg-slate-700 focus:bg-slate-700">Pallet Location</SelectItem>
                    <SelectItem value="shelf" className="hover:bg-slate-700 focus:bg-slate-700">Shelf Location</SelectItem>
                    <SelectItem value="bin" className="hover:bg-slate-700 focus:bg-slate-700">Bin Location</SelectItem>
                    <SelectItem value="floor" className="hover:bg-slate-700 focus:bg-slate-700">Floor Location</SelectItem>
                    <SelectItem value="rack" className="hover:bg-slate-700 focus:bg-slate-700">Rack Location</SelectItem>
                    <SelectItem value="cooler" className="hover:bg-slate-700 focus:bg-slate-700">Cooler Location</SelectItem>
                    <SelectItem value="freezer" className="hover:bg-slate-700 focus:bg-slate-700">Freezer Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-4">
            <div className="border-b border-slate-700 pb-2">
              <h3 className="text-sm font-semibold text-slate-300">Location Coordinates</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone" className="flex items-center gap-1 text-slate-300">
                  Zone *
                  {!zone && <AlertCircle className="h-3 w-3 text-red-400" />}
                </Label>
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger className={`bg-slate-700/50 border-slate-600 text-white ${!zone ? "border-red-500/50" : ""}`}>
                    <SelectValue placeholder="Zone" className="text-slate-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="A" className="hover:bg-slate-700 focus:bg-slate-700">Zone A</SelectItem>
                    <SelectItem value="B" className="hover:bg-slate-700 focus:bg-slate-700">Zone B</SelectItem>
                    <SelectItem value="C" className="hover:bg-slate-700 focus:bg-slate-700">Zone C</SelectItem>
                    <SelectItem value="D" className="hover:bg-slate-700 focus:bg-slate-700">Zone D</SelectItem>
                    <SelectItem value="PICK" className="hover:bg-slate-700 focus:bg-slate-700">Pick Zone</SelectItem>
                    <SelectItem value="RECV" className="hover:bg-slate-700 focus:bg-slate-700">Receiving</SelectItem>
                    <SelectItem value="SHIP" className="hover:bg-slate-700 focus:bg-slate-700">Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aisle" className="flex items-center gap-1 text-slate-300">
                  Aisle *
                  {!aisle && <AlertCircle className="h-3 w-3 text-red-400" />}
                </Label>
                <Input 
                  id="aisle" 
                  placeholder="01" 
                  value={aisle} 
                  onChange={(e) => setAisle(e.target.value)}
                  className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 ${!aisle ? "border-red-500/50" : ""}`}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="section" className="flex items-center gap-1 text-slate-300">
                  Section *
                  {!section && <AlertCircle className="h-3 w-3 text-red-400" />}
                </Label>
                <Input 
                  id="section" 
                  placeholder="A" 
                  value={section} 
                  onChange={(e) => setSection(e.target.value)}
                  className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 ${!section ? "border-red-500/50" : ""}`}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shelf" className="text-slate-300">Shelf/Level</Label>
                <Input 
                  id="shelf" 
                  placeholder="01" 
                  value={shelf} 
                  onChange={(e) => setShelf(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bin" className="text-slate-300">Bin/Position</Label>
                <Input 
                  id="bin" 
                  placeholder="01" 
                  value={bin} 
                  onChange={(e) => setBin(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>
            
            {/* Generated Location Preview */}
            {generateLocationString() && (
              <div className="bg-slate-700/50 p-3 rounded-md border border-slate-600">
                <Label className="text-sm font-medium text-slate-300">Generated Location Code:</Label>
                <div className="text-lg font-mono font-bold text-indigo-400 mt-1">
                  {generateLocationString()}
                </div>
              </div>
            )}
          </div>

          {/* Location Properties */}
          <div className="space-y-4">
            <div className="border-b border-slate-700 pb-2">
              <h3 className="text-sm font-semibold text-slate-300">Location Properties</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-slate-300">Capacity (cubic ft)</Label>
                <Input 
                  id="capacity" 
                  type="number"
                  placeholder="100" 
                  value={capacity} 
                  onChange={(e) => setCapacity(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="temperature" className="text-slate-300">Temperature (°F)</Label>
                <Select value={temperature} onValueChange={setTemperature}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select temp" className="text-slate-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="ambient" className="hover:bg-slate-700 focus:bg-slate-700">Ambient (65-75°F)</SelectItem>
                    <SelectItem value="cool" className="hover:bg-slate-700 focus:bg-slate-700">Cool (45-65°F)</SelectItem>
                    <SelectItem value="cold" className="hover:bg-slate-700 focus:bg-slate-700">Cold (32-45°F)</SelectItem>
                    <SelectItem value="frozen" className="hover:bg-slate-700 focus:bg-slate-700">Frozen (0-32°F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Products Section */}
          <div className="space-y-4">
            <div className="border-b border-slate-700 pb-2">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1">
                Products *
                {products.length === 0 && <AlertCircle className="h-3 w-3 text-red-400" />}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select products from the dropdown - they'll be added automatically
              </p>
            </div>
            
            <div className="space-y-3">
              <Popover open={openProductSearch} onOpenChange={setOpenProductSearch}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox" 
                    aria-expanded={openProductSearch}
                    className="w-full justify-between border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <span className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product to Location
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0 bg-slate-800 border-slate-700" align="start">
                  <Command className="bg-slate-800">
                    <CommandInput placeholder="Search for a product to add..." className="text-white bg-slate-800 border-slate-700" />
                    <CommandList className="max-h-[300px] overflow-auto">
                      <CommandEmpty className="text-slate-400">No products found.</CommandEmpty>
                      <CommandGroup>
                        {inventoryItems
                          .filter(product => !products.some(p => p.sku === product.sku))
                          .map((product) => (
                          <CommandItem
                            key={product.sku}
                            value={product.sku}
                            onSelect={handleSelectProduct}
                            className="cursor-pointer hover:bg-slate-700 text-white"
                          >
                            <Plus className="mr-2 h-4 w-4 text-green-400" />
                            <div className="flex flex-col">
                              <span>{product.name}</span>
                              <span className="text-xs text-slate-400">
                                SKU: {product.sku} {product.upc ? `| UPC: ${product.upc}` : ''}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            {products.length > 0 ? (
              <div className="border rounded-md p-3 bg-green-500/10 border-green-500/20">
                <Label className="text-sm font-medium mb-2 block text-green-300">
                  Products in Location ({products.length})
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {products.map((product) => (
                    <div key={product.sku} className="flex justify-between items-center text-sm p-2 hover:bg-green-500/20 rounded border border-green-500/30 bg-slate-700/50">
                      <div className="flex-1">
                        <div className="font-medium text-white">{product.name}</div>
                        <div className="text-xs text-slate-400">
                          SKU: {product.sku} | UPC: {product.upc || 'N/A'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="1"
                          value={product.qty}
                          onChange={(e) => handleUpdateProductQuantity(product.sku, Number(e.target.value))}
                          className="w-16 h-6 text-xs bg-slate-700/50 border-slate-600 text-white"
                        />
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                          units
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20" 
                          onClick={() => handleRemoveProduct(product.sku)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border rounded-md p-6 text-center border-red-500/20 bg-red-500/10">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-300 font-medium">No products added yet</p>
                <p className="text-xs text-red-400">Select products from the dropdown above to add them to this location</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex space-x-2 justify-end border-t border-slate-700 pt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={isFormValid ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-600 text-slate-400"}
          >
            {isSubmitting ? "Creating Location..." : 
             isFormValid ? "Create Smart Location" : `Missing: ${missingFields.join(', ')}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPalletDialog;
