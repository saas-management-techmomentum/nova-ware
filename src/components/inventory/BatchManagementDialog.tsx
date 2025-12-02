
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Plus, Edit, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ProductBatch, InventoryItem } from "@/types/inventory";
import { useProductBatches } from "@/hooks/useProductBatches";
import { usePalletLocations } from "@/hooks/usePalletLocations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BatchManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: InventoryItem;
  onBatchesUpdated?: () => void;
}

export const BatchManagementDialog: React.FC<BatchManagementDialogProps> = ({
  open,
  onOpenChange,
  product,
  onBatchesUpdated
}) => {
  const { batches, isLoading, createBatch, updateBatch, deleteBatch } = useProductBatches(product.id);
  const { pallets } = usePalletLocations();
  const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 0,
    expiration_date: null as Date | null,
    cost_price: 0,
    supplier_reference: '',
    notes: '',
    location_id: ''
  });

  const resetForm = () => {
    setFormData({
      quantity: 0,
      expiration_date: null,
      cost_price: product.unit_price || 0,
      supplier_reference: '',
      notes: '',
      location_id: ''
    });
    setEditingBatch(null);
  };

  const calculateAvailableStock = () => {
    const totalBatchQuantity = batches
      .filter(batch => !editingBatch || batch.id !== editingBatch.id)
      .reduce((sum, batch) => sum + batch.quantity, 0);
    return product.stock - totalBatchQuantity;
  };

  const validateQuantity = (quantity: number) => {
    const availableStock = calculateAvailableStock();
    return quantity <= availableStock && quantity >= 0;
  };

  const availableStock = calculateAvailableStock();
  const isQuantityValid = validateQuantity(formData.quantity);
  const totalAllocated = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const hasDataInconsistency = totalAllocated > product.stock;

  const syncBatchesToStock = async () => {
    if (!confirm('This will proportionally reduce all batch quantities to match product stock. Continue?')) {
      return;
    }

    try {
      const ratio = product.stock / totalAllocated;
      
      for (const batch of batches) {
        const newQuantity = Math.floor(batch.quantity * ratio);
        if (newQuantity > 0) {
          await updateBatch(batch.id, { quantity: newQuantity });
        } else {
          await deleteBatch(batch.id);
        }
      }
      
      toast.success('Batches synchronized with product stock');
      onBatchesUpdated?.();
    } catch (error) {
      toast.error('Failed to sync batches');
    }
  };

  const handleCreateBatch = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleCancel = () => {
    resetForm();
    setIsCreating(false);
  };

  const handleEditBatch = (batch: ProductBatch) => {
    setEditingBatch(batch);
    setFormData({
      quantity: batch.quantity,
      expiration_date: batch.expiration_date,
      cost_price: batch.cost_price,
      supplier_reference: batch.supplier_reference || '',
      notes: batch.notes || '',
      location_id: batch.location_id || ''
    });
    setIsCreating(true);
  };

  const handleSaveBatch = async () => {
    try {
      const batchData = {
        ...formData,
        cost_price: editingBatch ? formData.cost_price : (product.unit_price || 0)
      };

      if (editingBatch) {
        await updateBatch(editingBatch.id, batchData);
        toast.success('Batch updated successfully');
      } else {
        await createBatch(batchData);
        toast.success('Batch created successfully');
      }
      resetForm();
      setIsCreating(false);
      onBatchesUpdated?.();
    } catch (error) {
      toast.error('Failed to save batch');
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    
    try {
      await deleteBatch(batchId);
      toast.success('Batch deleted successfully');
      onBatchesUpdated?.();
    } catch (error) {
      toast.error('Failed to delete batch');
    }
  };

  const getExpirationStatus = (expirationDate: Date | null) => {
    if (!expirationDate) return 'none';
    
    const now = new Date();
    const diffDays = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'critical';
    if (diffDays <= 30) return 'warning';
    return 'normal';
  };

  const getExpirationColor = (status: string) => {
    switch (status) {
      case 'expired': return 'text-destructive';
      case 'critical': return 'text-orange-600';
      case 'warning': return 'text-yellow-600';
      case 'normal': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Management - {product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Inconsistency Warning */}
          {hasDataInconsistency && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Batch quantities ({totalAllocated}) exceed product stock ({product.stock}). 
                  This may have been caused by a product transfer.
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={syncBatchesToStock}
                  className="ml-4"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync Batches
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Total Stock</div>
              <div className="text-2xl font-bold">{product.stock}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Allocated</div>
              <div className="text-2xl font-bold">{totalAllocated}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Available</div>
              <div className="text-2xl font-bold text-green-600">{availableStock}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Expiring Soon</div>
              <div className="text-2xl font-bold text-orange-600">
                {batches.filter(b => {
                  const status = getExpirationStatus(b.expiration_date);
                  return status === 'critical' || status === 'warning';
                }).length}
              </div>
            </div>
          </div>

          {/* Create/Edit Form */}
          {isCreating && (
            <div className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {editingBatch ? 'Edit Batch' : 'Create New Batch'}
                </h3>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      quantity: parseInt(e.target.value) || 0 
                    }))}
                    className={cn(!isQuantityValid && "border-destructive")}
                  />
                  {!isQuantityValid && (
                    <p className="text-sm text-destructive mt-1">
                      Exceeds available stock. Maximum: {availableStock} units
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Available: {availableStock} units
                  </p>
                </div>

                {/* <div>
                  <Label htmlFor="inherited_cost_price">Cost Price</Label>
                  <div className="p-2 bg-muted/50 rounded-md border">
                    <div className="text-sm font-medium">
                      ${(editingBatch ? formData.cost_price : (product.unit_price || 0)).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {editingBatch ? 'Existing batch price' : 'Inherited from product'}
                    </div>
                  </div>
                </div> */}

                <div>
                  <Label>Expiration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.expiration_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expiration_date ? (
                          format(formData.expiration_date, "PPP")
                        ) : (
                          <span>No expiration</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.expiration_date || undefined}
                        onSelect={(date) => setFormData(prev => ({ 
                          ...prev, 
                          expiration_date: date || null 
                        }))}
                        initialFocus
                      />
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            expiration_date: null 
                          }))}
                        >
                          Clear Date
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="supplier_reference">Supplier Reference</Label>
                  <Input
                    id="supplier_reference"
                    value={formData.supplier_reference}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      supplier_reference: e.target.value 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location_id || "none"}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      location_id: value === "none" ? "" : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No location</SelectItem>
                      {pallets.map((pallet) => (
                        <SelectItem key={pallet.id} value={pallet.id}>
                          {pallet.id} - {pallet.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleSaveBatch} 
                className="w-full" 
                disabled={!isQuantityValid || formData.quantity <= 0}
              >
                {editingBatch ? 'Update Batch' : 'Create Batch'}
              </Button>
            </div>
          )}

          {/* Batches List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Current Batches</h3>
              {!isCreating && (
                <Button onClick={handleCreateBatch} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Batch
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading batches...</div>
            ) : batches.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No batches found. Create your first batch to track different expiration dates.
              </div>
            ) : (
              <div className="space-y-2">
                {batches.map((batch) => {
                  const expirationStatus = getExpirationStatus(batch.expiration_date);
                  const colorClass = getExpirationColor(expirationStatus);
                  
                  return (
                    <div key={batch.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="grid grid-cols-5 gap-4 flex-1">
                          <div>
                            <div className="text-sm text-muted-foreground">Batch</div>
                            <div className="font-medium">{batch.batch_number}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Quantity</div>
                            <div className="font-medium">{batch.quantity}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Location</div>
                            <div className="font-medium">
                              {batch.location_name ? (
                                <span className="text-primary">{batch.location_name}</span>
                              ) : (
                                <span className="text-muted-foreground">No location</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Expiration</div>
                            <div className={cn("font-medium", colorClass)}>
                              {batch.expiration_date 
                                ? format(batch.expiration_date, "MMM dd, yyyy")
                                : "No expiration"
                              }
                            </div>
                          </div>
                          {/* <div>
                            <div className="text-sm text-muted-foreground">Cost</div>
                            <div className="font-medium">${batch.cost_price.toFixed(2)}</div>
                          </div> */}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditBatch(batch)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBatch(batch.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {batch.notes && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {batch.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
