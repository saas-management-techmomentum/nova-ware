import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { InventoryItem } from '@/types/inventory';
import { Checkbox } from '@/components/ui/checkbox';

interface AddProductDialogProps {
  onAddProduct: (newProduct: Omit<InventoryItem, 'id'>) => Promise<void>;
  disabled?: boolean;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({ onAddProduct, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    upc: '',
    asin: '',
    stock: '',
    unit_price: '',
    cost_price: '',
    case_price: '',
    case_cost: '',
    casesize: '',
    dimensions: '',
    weight: '',
    low_stock_threshold: '10',
  });
  const [includeUPC, setIncludeUPC] = useState(false);
  const [includeASIN, setIncludeASIN] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      upc: '',
      asin: '',
      stock: '',
      unit_price: '',
      cost_price: '',
      case_price: '',
      case_cost: '',
      casesize: '',
      dimensions: '',
      weight: '',
      low_stock_threshold: '10',
    });
    setIncludeUPC(false);
    setIncludeASIN(false);
    setExpirationDate(null);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.sku) {
      toast({
        title: "Error",
        description: "Please fill out all required fields: Name and SKU",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create new product object
      const newProduct = {
        name: formData.name,
        sku: formData.sku,
        upc: includeUPC ? formData.upc || undefined : undefined,
        asin: includeASIN ? formData.asin || undefined : undefined,
        stock: parseInt(formData.stock, 10) || 0,
        unit_price: parseFloat(formData.unit_price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        case_price: parseFloat(formData.case_price) || 0,
        case_cost: parseFloat(formData.case_cost) || 0,
        casesize: formData.casesize || undefined,
        dimensions: formData.dimensions || undefined,
        weight: formData.weight || undefined,
        low_stock_threshold: parseInt(formData.low_stock_threshold, 10) || 10,
        expiration: expirationDate,
      };
      
      // Add product to inventory
      await onAddProduct(newProduct);
      
      // Reset form and close dialog immediately
      resetForm();
      setOpen(false);
      
      // Show success message (only one toast now)
      toast({
        title: "Success",
        description: "Product added to inventory successfully",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product to inventory",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="gap-2" 
          disabled={disabled}
          style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Product</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Enter product details including cost and selling prices for financial tracking
          </DialogDescription>
        </DialogHeader>
          <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-neutral-300">Product Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Wireless Headphones"
                className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku" className="text-neutral-300">SKU *</Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="SKU-12345"
                className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="grid gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-upc" 
                  checked={includeUPC}
                  onCheckedChange={(checked) => setIncludeUPC(checked === true)}
                  className="border-neutral-700 data-[state=checked]:bg-cargo-blue data-[state=checked]:border-cargo-blue"
                  disabled={isSubmitting}
                />
                <Label htmlFor="include-upc" className="text-neutral-300">Include UPC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-asin" 
                  checked={includeASIN}
                  onCheckedChange={(checked) => setIncludeASIN(checked === true)}
                  className="border-neutral-700 data-[state=checked]:bg-cargo-blue data-[state=checked]:border-cargo-blue"
                  disabled={isSubmitting}
                />
                <Label htmlFor="include-asin" className="text-neutral-300">Include ASIN</Label>
              </div>
            </div>
            
            {(includeUPC || includeASIN) && (
              <div className="grid grid-cols-2 gap-4">
                {includeUPC && (
                  <div className="grid gap-2">
                    <Label htmlFor="upc" className="text-slate-300">UPC</Label>
                    <Input
                      id="upc"
                      name="upc"
                      value={formData.upc}
                      onChange={handleChange}
                      placeholder="123456789012"
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      disabled={isSubmitting}
                    />
                  </div>
                )}
                {includeASIN && (
                  <div className="grid gap-2">
                    <Label htmlFor="asin" className="text-slate-300">ASIN</Label>
                    <Input
                      id="asin"
                      name="asin"
                      value={formData.asin}
                      onChange={handleChange}
                      placeholder="B0123456789"
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stock" className="text-slate-300">Initial Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
                placeholder="10"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="low_stock_threshold" className="text-slate-300">Low Stock Threshold</Label>
              <Input
                id="low_stock_threshold"
                name="low_stock_threshold"
                type="number"
                value={formData.low_stock_threshold}
                onChange={handleChange}
                placeholder="10"
                min="1"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-400">Alert when stock falls below this number</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="casesize" className="text-slate-300">Case Size</Label>
              <Input
                id="casesize"
                name="casesize"
                value={formData.casesize}
                onChange={handleChange}
                placeholder="12 units"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          {/* Pricing Section */}
          <div className="border-t border-neutral-700 pt-4">
            <h3 className="text-sm font-medium mb-3 text-neutral-300">Pricing Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost_price" className="text-slate-300">Buy Price - Unit ($)</Label>
                <Input
                  id="cost_price"
                  name="cost_price"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={handleChange}
                  placeholder="7.50"
                  className="bg-red-500/20 border-red-500/30 text-white placeholder-red-300/60"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-400">What you pay suppliers per unit</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_price" className="text-slate-300">Sell Price - Unit ($)</Label>
                <Input
                  id="unit_price"
                  name="unit_price"
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={handleChange}
                  placeholder="9.99"
                  className="bg-green-500/20 border-green-500/30 text-white placeholder-green-300/60"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-400">What you charge customers per unit</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="case_cost" className="text-slate-300">Buy Price - Case ($)</Label>
                <Input
                  id="case_cost"
                  name="case_cost"
                  type="number"
                  step="0.01"
                  value={formData.case_cost}
                  onChange={handleChange}
                  placeholder="90.00"
                  className="bg-red-500/20 border-red-500/30 text-white placeholder-red-300/60"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-400">What you pay suppliers per case</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="case_price" className="text-slate-300">Sell Price - Case ($)</Label>
                <Input
                  id="case_price"
                  name="case_price"
                  type="number"
                  step="0.01"
                  value={formData.case_price}
                  onChange={handleChange}
                  placeholder="119.88"
                  className="bg-green-500/20 border-green-500/30 text-white placeholder-green-300/60"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-400">What you charge customers per case</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dimensions" className="text-slate-300">Case Dimensions/Weight</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="dimensions"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="6x4x2 in"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  disabled={isSubmitting}
                />
                <Input
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="0.65 lbs"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="expiration" className="text-slate-300">Expiration Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="expiration"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700",
                    !expirationDate && "text-neutral-400"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? (
                    format(expirationDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-800">
                <Calendar
                  mode="single"
                  selected={expirationDate || undefined}
                  onSelect={setExpirationDate}
                  initialFocus
                  className="bg-neutral-900 text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter className="bg-neutral-900 border-t border-neutral-800 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)} 
            className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-cargo-blue hover:bg-cargo-darkBlue"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </>
            ) : (
              "Add Product"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
