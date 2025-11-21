import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Package, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PalletLocation } from '@/hooks/usePalletLocations';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MoveItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceLocation: PalletLocation | null;
  availableLocations: PalletLocation[];
  onMoveItems: (fromPallet: string, toPallet: string, items: Array<{sku: string, quantity: number}>) => Promise<void>;
}

const MoveItemsDialog: React.FC<MoveItemsDialogProps> = ({
  open,
  onOpenChange,
  sourceLocation,
  availableLocations,
  onMoveItems
}) => {
  const { toast } = useToast();
  const [destinationId, setDestinationId] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{sku: string, quantity: number, maxQuantity: number, name: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destinationLocation = availableLocations.find(loc => loc.id === destinationId);

  const handleAddItem = (product: any) => {
    const existingItem = selectedItems.find(item => item.sku === product.sku);
    if (!existingItem) {
      setSelectedItems([...selectedItems, {
        sku: product.sku,
        quantity: 1,
        maxQuantity: product.qty,
        name: product.name
      }]);
    }
  };

  const handleUpdateQuantity = (sku: string, quantity: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.sku === sku ? { ...item, quantity: Math.min(quantity, item.maxQuantity) } : item
    ));
  };

  const handleRemoveItem = (sku: string) => {
    setSelectedItems(selectedItems.filter(item => item.sku !== sku));
  };

  const handleSubmit = async () => {
    if (!sourceLocation || !destinationId || selectedItems.length === 0) return;

    setIsSubmitting(true);
    try {
      await onMoveItems(
        sourceLocation.id,
        destinationId,
        selectedItems.map(item => ({ sku: item.sku, quantity: item.quantity }))
      );
      
      setSelectedItems([]);
      setDestinationId('');
      onOpenChange(false);
      
      toast({
        title: "Items Moved Successfully",
        description: `Moved ${selectedItems.length} item(s) from ${sourceLocation.id} to ${destinationId}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move items",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedItems([]);
    setDestinationId('');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  if (!sourceLocation) return null;

  const isFormValid = destinationId && selectedItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-white">
            <Package className="h-5 w-5 mr-2 text-indigo-400" />
            Move Items from {sourceLocation.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Source and Destination */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-sm text-slate-400">From</div>
                  <Badge className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300">
                    {sourceLocation.id}
                  </Badge>
                  <div className="text-xs text-slate-400 mt-1">{sourceLocation.location}</div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-slate-400" />
            </div>

            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-400">To</Label>
                  <Select value={destinationId} onValueChange={setDestinationId}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {availableLocations
                        .filter(loc => loc.id !== sourceLocation.id)
                        .map(location => (
                          <SelectItem 
                            key={location.id} 
                            value={location.id}
                            className="hover:bg-slate-700 focus:bg-slate-700"
                          >
                            {location.id} - {location.location}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {destinationLocation && (
                    <div className="text-xs text-slate-400">{destinationLocation.location}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Products */}
          <div className="space-y-4">
            <div className="border-b border-slate-700 pb-2">
              <h3 className="text-sm font-semibold text-slate-300">Available Products</h3>
              <p className="text-xs text-slate-400">Select products to move from the source location</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sourceLocation.products.map(product => {
                const isSelected = selectedItems.some(item => item.sku === product.sku);
                
                return (
                  <Card 
                    key={product.sku} 
                    className={`bg-slate-700/50 border-slate-600 cursor-pointer transition-colors ${
                      isSelected ? 'border-indigo-500/50 bg-indigo-500/10' : 'hover:bg-slate-700/70'
                    }`}
                    onClick={() => !isSelected && handleAddItem(product)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-white">{product.name}</div>
                          <div className="text-sm text-slate-400">SKU: {product.sku}</div>
                          <div className="text-sm text-slate-400">Available: {product.qty}</div>
                        </div>
                        {isSelected ? (
                          <Badge className="bg-green-500/20 border-green-500/30 text-green-300">
                            Selected
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            Select
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-2">
                <h3 className="text-sm font-semibold text-slate-300">Items to Move</h3>
                <p className="text-xs text-slate-400">Adjust quantities for selected items</p>
              </div>

              <div className="space-y-3">
                {selectedItems.map(item => (
                  <Card key={item.sku} className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white">{item.name}</div>
                          <div className="text-sm text-slate-400">SKU: {item.sku}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-slate-300">Quantity:</Label>
                          <Input
                            type="number"
                            min="1"
                            max={item.maxQuantity}
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.sku, parseInt(e.target.value) || 0)}
                            className="w-20 bg-slate-700/50 border-slate-600 text-white"
                          />
                          <span className="text-sm text-slate-400">/ {item.maxQuantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveItem(item.sku)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Validation Alert */}
          {!isFormValid && (selectedItems.length > 0 || destinationId) && (
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300">
                {!destinationId && "Please select a destination location."}
                {!selectedItems.length && destinationId && "Please select at least one item to move."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleClose(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            {isSubmitting ? "Moving..." : `Move ${selectedItems.length} Item(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveItemsDialog;