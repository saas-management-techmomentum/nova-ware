import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Calendar, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProductBatches } from '@/hooks/useProductBatches';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface UnassignedInventoryItem {
  id: string;
  name: string;
  sku: string;
  totalQuantity: number;
  assignedQuantity: number;
  unassignedQuantity: number;
}

interface BatchAssignment {
  batchId?: string;
  quantity: number;
  expirationDate?: Date;
  isNewBatch: boolean;
  supplierReference?: string;
  notes?: string;
  costPrice?: number;
}

interface BatchAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  unassignedQuantity?: number;
  onAssignmentComplete?: () => void;
}

const BatchAssignmentDialog = ({ 
  open, 
  onOpenChange, 
  productId, 
  unassignedQuantity,
  onAssignmentComplete 
}: BatchAssignmentDialogProps) => {
  const [selectedProduct, setSelectedProduct] = useState<UnassignedInventoryItem | null>(null);
  const [unassignedItems, setUnassignedItems] = useState<UnassignedInventoryItem[]>([]);
  const [assignments, setAssignments] = useState<BatchAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { batches, refetch: refetchBatches } = useProductBatches(selectedProduct?.id);
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const { toast } = useToast();

  // Fetch unassigned inventory items using fallback approach for consistency
  const fetchUnassignedItems = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Use the fallback approach directly to avoid RPC complexity
      await fetchUnassignedItemsFallback();
    } catch (error) {
      console.error('Exception fetching unassigned items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback method using separate queries (original approach)
  const fetchUnassignedItemsFallback = async () => {
    if (!user) return;
    
    try {
      let productQuery = supabase
        .from('products')
        .select('id, name, sku, quantity')
        .eq('user_id', user.id)
        .gt('quantity', 0);

      if (selectedWarehouse) {
        productQuery = productQuery.eq('warehouse_id', selectedWarehouse);
      }

      if (productId) {
        productQuery = productQuery.eq('id', productId);
      }

      const { data: products, error: productsError } = await productQuery;

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return;
      }

      // For each product, get batch totals
      const unassignedItems: UnassignedInventoryItem[] = [];

      for (const product of products || []) {
        let batchQuery = supabase
          .from('product_batches')
          .select('quantity')
          .eq('product_id', product.id)
          .eq('user_id', user.id);

        if (selectedWarehouse) {
          batchQuery = batchQuery.eq('warehouse_id', selectedWarehouse);
        }

        const { data: batchData } = await batchQuery;
        
        const assignedQuantity = (batchData || []).reduce((sum, batch) => sum + batch.quantity, 0);
        const unassignedQuantity = product.quantity - assignedQuantity;

        if (unassignedQuantity > 0) {
          unassignedItems.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            totalQuantity: product.quantity,
            assignedQuantity,
            unassignedQuantity
          });
        }
      }

      setUnassignedItems(unassignedItems);

      // If we have a specific product, select it
      if (productId && unassignedItems.length > 0) {
        const targetProduct = unassignedItems.find(item => item.id === productId);
        if (targetProduct) {
          setSelectedProduct(targetProduct);
          // Initialize with one assignment of the unassigned quantity
          setAssignments([{
            quantity: targetProduct.unassignedQuantity,
            isNewBatch: true
          }]);
        }
      }
    } catch (error) {
      console.error('Exception in fallback fetch:', error);
    }
  };

  useEffect(() => {
    if (open) {
      // Clear any existing state and force fresh data fetch
      setSelectedProduct(null);
      setUnassignedItems([]);
      setAssignments([]);
      
      // Force fresh data fetch immediately with database consistency check
      fetchUnassignedItems();
    }
  }, [open, user, selectedWarehouse, productId]);

  useEffect(() => {
    if (selectedProduct && assignments.length === 0) {
      // Initialize with one assignment
      setAssignments([{
        quantity: Math.min(selectedProduct.unassignedQuantity, 10),
        isNewBatch: true
      }]);
    }
  }, [selectedProduct]);

  const handleProductSelect = (item: UnassignedInventoryItem) => {
    setSelectedProduct(item);
    setAssignments([{
      quantity: Math.min(item.unassignedQuantity, 10),
      isNewBatch: true
    }]);
  };

  const addAssignment = () => {
    if (!selectedProduct) return;
    
    const currentTotal = assignments.reduce((sum, a) => sum + a.quantity, 0);
    const remaining = selectedProduct.unassignedQuantity - currentTotal;
    
    if (remaining > 0) {
      setAssignments(prev => [...prev, {
        quantity: Math.min(remaining, 10),
        isNewBatch: true
      }]);
    }
  };

  const updateAssignment = (index: number, field: keyof BatchAssignment, value: any) => {
    setAssignments(prev => prev.map((assignment, i) => 
      i === index ? { ...assignment, [field]: value } : assignment
    ));
  };

  const removeAssignment = (index: number) => {
    setAssignments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedProduct || !user) return;

    const totalAssigned = assignments.reduce((sum, a) => sum + a.quantity, 0);
    if (totalAssigned > selectedProduct.unassignedQuantity) {
      toast({
        title: "Invalid Assignment",
        description: "Total assigned quantity cannot exceed unassigned quantity",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Get warehouse and company info
      let warehouseId = selectedWarehouse;
      let companyId = null;
      
      if (selectedWarehouse) {
        const { data: warehouseData } = await supabase
          .from('warehouses')
          .select('company_id')
          .eq('id', selectedWarehouse)
          .single();
        
        companyId = warehouseData?.company_id;
      }

      for (const assignment of assignments) {
        if (assignment.quantity <= 0) continue;

        if (assignment.isNewBatch) {
          // Create new batch
          const { data: generatedNumber } = await supabase
            .rpc('generate_batch_number', {
              product_uuid: selectedProduct.id,
              user_uuid: user.id
            });

          const { error: createError } = await supabase
            .from('product_batches')
            .insert({
              product_id: selectedProduct.id,
              batch_number: generatedNumber,
              expiration_date: assignment.expirationDate?.toISOString(),
              quantity: assignment.quantity,
              cost_price: assignment.costPrice || 0,
              supplier_reference: assignment.supplierReference,
              notes: assignment.notes,
              user_id: user.id,
              warehouse_id: warehouseId,
              company_id: companyId
            });

          if (createError) {
            console.error('Error creating new batch:', createError);
            throw createError;
          }
        } else if (assignment.batchId) {
          // Add to existing batch - manual update
          const { data: existingBatch } = await supabase
            .from('product_batches')
            .select('quantity')
            .eq('id', assignment.batchId)
            .single();

          if (existingBatch) {
            const { error: updateError } = await supabase
              .from('product_batches')
              .update({ quantity: existingBatch.quantity + assignment.quantity })
              .eq('id', assignment.batchId)
              .eq('user_id', user.id);

            if (updateError) {
              console.error('Error updating existing batch:', updateError);
              throw updateError;
            }
          }
        }
      }

      toast({
        title: "Batch Assignment Complete",
        description: `Successfully assigned ${totalAssigned} units to batches for ${selectedProduct.name}`,
      });

      onAssignmentComplete?.();
      refetchBatches();
      onOpenChange(false);

    } catch (error) {
      console.error('Exception saving batch assignments:', error);
      toast({
        title: "Error",
        description: "Failed to assign batches. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalAssigned = assignments.reduce((sum, a) => sum + a.quantity, 0);
  const remaining = selectedProduct ? selectedProduct.unassignedQuantity - totalAssigned : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Batch Assignment
          </DialogTitle>
          <DialogDescription>
            Assign unassigned inventory quantities to product batches
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading unassigned inventory...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {!selectedProduct ? (
              <div>
                <h3 className="text-lg font-medium mb-4">Select Product to Assign</h3>
                {unassignedItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No unassigned inventory found</p>
                    <p className="text-sm">All inventory is properly assigned to batches</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {unassignedItems.map((item) => (
                      <Card 
                        key={item.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleProductSelect(item)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="mb-1">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {item.unassignedQuantity} unassigned
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {item.assignedQuantity} assigned / {item.totalQuantity} total
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{selectedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                    Back to List
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Assignment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Unassigned</p>
                        <p className="font-medium">{selectedProduct.unassignedQuantity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Assigning</p>
                        <p className="font-medium">{totalAssigned}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className={`font-medium ${remaining < 0 ? 'text-destructive' : ''}`}>
                          {remaining}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Batch Assignments</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addAssignment}
                      disabled={remaining <= 0}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Assignment
                    </Button>
                  </div>

                  {assignments.map((assignment, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Assignment Type</Label>
                            <Select
                              value={assignment.isNewBatch ? 'new' : 'existing'}
                              onValueChange={(value) => 
                                updateAssignment(index, 'isNewBatch', value === 'new')
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">Create New Batch</SelectItem>
                                <SelectItem value="existing">Add to Existing Batch</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              max={selectedProduct.unassignedQuantity}
                              value={assignment.quantity}
                              onChange={(e) => 
                                updateAssignment(index, 'quantity', parseInt(e.target.value) || 0)
                              }
                            />
                          </div>

                          {!assignment.isNewBatch && (
                            <div className="space-y-2">
                              <Label>Existing Batch</Label>
                              <Select
                                value={assignment.batchId || ''}
                                onValueChange={(value) => 
                                  updateAssignment(index, 'batchId', value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select batch" />
                                </SelectTrigger>
                                <SelectContent>
                                  {batches.map((batch) => (
                                    <SelectItem key={batch.id} value={batch.id}>
                                      {batch.batch_number} 
                                      {batch.expiration_date && (
                                        <span className="text-muted-foreground ml-2">
                                          (Exp: {format(batch.expiration_date, 'MMM d, yyyy')})
                                        </span>
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {assignment.isNewBatch && (
                            <>
                              <div className="space-y-2">
                                <Label>Cost per Unit (Optional)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={assignment.costPrice || ''}
                                  onChange={(e) => 
                                    updateAssignment(index, 'costPrice', 
                                      e.target.value ? parseFloat(e.target.value) : undefined
                                    )
                                  }
                                  placeholder="0.00"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Expiration Date (Optional)</Label>
                                <Input
                                  type="date"
                                  value={assignment.expirationDate ? 
                                    assignment.expirationDate.toISOString().split('T')[0] : ''
                                  }
                                  onChange={(e) => 
                                    updateAssignment(index, 'expirationDate', 
                                      e.target.value ? new Date(e.target.value) : undefined
                                    )
                                  }
                                />
                              </div>
                            </>
                          )}

                          {assignment.isNewBatch && (
                            <>
                              <div className="space-y-2">
                                <Label>Supplier Reference (Optional)</Label>
                                <Input
                                  value={assignment.supplierReference || ''}
                                  onChange={(e) => 
                                    updateAssignment(index, 'supplierReference', e.target.value)
                                  }
                                  placeholder="Supplier reference"
                                />
                              </div>

                              <div className="col-span-2 space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                  value={assignment.notes || ''}
                                  onChange={(e) => 
                                    updateAssignment(index, 'notes', e.target.value)
                                  }
                                  placeholder="Batch notes"
                                  rows={2}
                                />
                              </div>
                            </>
                          )}

                          <div className="col-span-2">
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => removeAssignment(index)}
                              disabled={assignments.length === 1}
                            >
                              Remove Assignment
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedProduct && (
            <Button 
              onClick={handleSave} 
              disabled={isSaving || totalAssigned === 0 || remaining < 0}
            >
              {isSaving ? 'Assigning...' : `Assign ${totalAssigned} Units`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchAssignmentDialog;