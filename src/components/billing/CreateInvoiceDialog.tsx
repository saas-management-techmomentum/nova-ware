
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Plus, Trash2, AlertTriangle, Loader2, CheckCircle, Info } from 'lucide-react';
import { useClients } from '@/contexts/ClientsContext';
import { useBilling } from '@/contexts/BillingContext';
import { useWarehouseScopedInventory } from '@/hooks/useWarehouseScopedInventory';
import AddClientDialog from '@/components/orders/AddClientDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateInvoiceData } from '@/types/billing';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CompanyBrandingEditor } from './CompanyBrandingEditor';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InvoiceItem {
  id: string;
  product_id: string;
  description: string;
  quantity: number;
  price: number;
  amount: number;
  sku?: string;
  available_stock?: number;
}

export const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({ open, onOpenChange }) => {
  const { clients, refetch: refetchClients } = useClients();
  const { addInvoice, validateInventoryAvailability } = useBilling();
  const { inventoryItems } = useWarehouseScopedInventory();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [markAsPaid, setMarkAsPaid] = useState(false); // Default to false (draft status)
  
  const [formData, setFormData] = useState({
    client_id: '',
    invoice_number: '',
    po_so_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_terms: 'On Receipt',
    discount: 0,
    notes: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [inventoryWarnings, setInventoryWarnings] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleClientAdded = (client: { id: string, name: string }) => {
    refetchClients();
    setFormData(prev => ({ 
      ...prev, 
      client_id: client.id 
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      product_id: '',
      description: '',
      quantity: 1,
      price: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    checkInventoryAvailability(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'quantity' || field === 'price') {
          updatedItem.amount = updatedItem.quantity * updatedItem.price;
        }
        
        // If description is selected from inventory, auto-fill other fields
        if (field === 'description') {
          const inventoryItem = inventoryItems.find(inv => inv.name === value);
          if (inventoryItem) {
            updatedItem.product_id = inventoryItem.id;
            updatedItem.price = inventoryItem.unit_price || 0;
            updatedItem.sku = inventoryItem.sku;
            updatedItem.available_stock = inventoryItem.stock;
            updatedItem.amount = updatedItem.quantity * (inventoryItem.unit_price || 0);
          }
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setItems(updatedItems);
    checkInventoryAvailability(updatedItems);
  };

  const checkInventoryAvailability = async (itemsToCheck: InvoiceItem[]) => {
    const warnings: string[] = [];
    
    for (const item of itemsToCheck) {
      if (item.product_id && item.quantity > 0) {
        const inventoryItem = inventoryItems.find(inv => inv.id === item.product_id);
        if (inventoryItem) {
          if (inventoryItem.stock < item.quantity) {
            warnings.push(`${item.description}: Only ${inventoryItem.stock} available, but ${item.quantity} requested`);
          }
        }
      }
    }
    
    setInventoryWarnings(warnings);
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = (subtotal * formData.discount) / 100;
  const total = subtotal - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      toast({
        title: "Client Required",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.invoice_number.trim()) {
      toast({
        title: "Invoice Number Required",
        description: "Please enter an invoice number",
        variant: "destructive",
      });
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: "Items Required",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    const invalidItems = items.filter(item => !item.description || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast({
        title: "Invalid Items",
        description: "Please fill in all item details",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      setProcessingStep('Checking invoice number...');
      
      // Check for duplicate invoice number
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('invoice_number', formData.invoice_number.trim())
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (count && count > 0) {
        toast({
          title: "Duplicate Invoice Number",
          description: `Invoice number "${formData.invoice_number}" already exists. Please use a different number.`,
          variant: "destructive",
        });
        return;
      }
      
      setProcessingStep('Validating inventory...');
      
      const invoiceItems = items
        .filter(item => item.product_id)
        .map(item => {
          const inventoryItem = inventoryItems.find(inv => inv.id === item.product_id);
          return {
            product_id: item.product_id,
            sku: item.sku || '',
            name: item.description,
            quantity: item.quantity,
            unit_price: item.price,
            total_amount: item.amount,
            // Capture current stock level for historical tracking
            stock_at_creation: inventoryItem?.stock || 0
          };
        });

      // Pre-validate inventory with enhanced error reporting
      if (invoiceItems.length > 0 && markAsPaid) {
        const validation = await validateInventoryAvailability(
          invoiceItems.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
        );
        
        if (!validation.valid) {
          const errorMessages = validation.items
            .filter(item => !item.available)
            .map(item => `${item.product_name}: ${item.shortage} short (have ${item.current_stock}, need ${item.requested_quantity})`);
          throw new Error(`Insufficient inventory: ${errorMessages.join(', ')}`);
        }
      }

      setProcessingStep('Creating invoice...');
      
      const invoiceData: CreateInvoiceData = {
        client_id: formData.client_id,
        client_name: '', // Will be populated by the hook from client data
        client_billing_address: '',
        client_contact_email: '',
        client_contact_phone: '',
        client_payment_terms_days: 0,
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        billing_period_start: formData.invoice_date,
        billing_period_end: formData.due_date,
        subtotal: subtotal,
        tax_amount: 0,
        total_amount: total,
        notes: formData.notes,
        status: markAsPaid ? 'paid' : 'draft', // Use 'draft' by default, 'paid' for immediate inventory reduction
        template_id: selectedTemplate?.id || null,
        items: invoiceItems
      };

      const result = await addInvoice(invoiceData);

      // Only show success and close dialog if invoice was actually created
      if (!result) {
        // Error toast already shown by addInvoice, just exit
        return;
      }

      toast({
        title: "Invoice Created Successfully",
        description: markAsPaid 
          ? "Invoice created and inventory has been reduced automatically."
          : "Invoice created as draft. Inventory will be reduced when the status is changed to sent, paid, or approved.",
        variant: "default",
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error Creating Invoice",
        description: error instanceof Error ? error.message : 'Failed to create invoice. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      invoice_number: '',
      po_so_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_terms: 'On Receipt',
      discount: 0,
      notes: ''
    });
    setItems([]);
    setInventoryWarnings([]);
    setMarkAsPaid(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Invoice</DialogTitle>
          <p className="text-xs text-neutral-400 mt-2">
            <span className="text-red-500">*</span> Required fields
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Processing Status */}
          {isProcessing && (
            <Alert className="border-gray-500 bg-gray-500/10">
              <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
              <AlertDescription className="text-gray-200">
                <strong>Processing:</strong> {processingStep}
              </AlertDescription>
            </Alert>
          )}

          {/* Inventory Impact Alert */}
          {markAsPaid && items.length > 0 && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200">
                <strong>Inventory Impact:</strong> Creating this invoice will immediately reduce inventory for all items.
              </AlertDescription>
            </Alert>
          )}

          {/* Inventory Warnings */}
          {inventoryWarnings.length > 0 && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-200">
                <strong>Inventory Issues:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {inventoryWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Company Branding Section */}
          <CompanyBrandingEditor 
            onTemplateSelect={setSelectedTemplate}
            selectedTemplate={selectedTemplate}
          />

          {/* Payment Status Toggle */}
          <Card className="bg-neutral-800/30 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="markAsPaid"
                  checked={markAsPaid}
                  onCheckedChange={(checked) => setMarkAsPaid(checked === true)}
                />
                <Label htmlFor="markAsPaid" className="text-neutral-300 cursor-pointer">
                  Mark as paid (reduces inventory immediately)
                </Label>
                <Info className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                {markAsPaid 
                  ? "Inventory will be reduced when this invoice is created"
                  : "Inventory will be reduced when the invoice status is changed to sent, paid, or approved"
                }
              </p>
            </CardContent>
          </Card>

          {/* Header Section */}
          <div className="grid grid-cols-2 gap-8">
            {/* Customer Section */}
            <Card className="bg-neutral-800/30 border-neutral-700">
              <CardContent className="p-4">
                <Label className="text-neutral-300 mb-2 block">
                  Customer <span className="text-red-500">*</span>
                </Label>
                <div className="mb-4">
                  <AddClientDialog 
                    onClientAdded={handleClientAdded}
                    trigger={
                      <button
                        type="button"
                        className="text-gray-400 font-medium hover:text-gray-300 transition-colors cursor-pointer"
                      >
                        Add a customer
                      </button>
                    }
                  />
                </div>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                  <SelectTrigger className="bg-neutral-800/50 border-neutral-700">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-neutral-300">
                    Invoice number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                    placeholder="(e.g., INV-001)"
                    className="bg-neutral-800/50 border-neutral-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-neutral-300">P.O./S.O. number</Label>
                  <Input
                    value={formData.po_so_number}
                    onChange={(e) => setFormData({...formData, po_so_number: e.target.value})}
                    className="bg-neutral-800/50 border-neutral-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-neutral-300">
                    Invoice date <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                      className="bg-neutral-800/50 border-neutral-700 text-white"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label className="text-neutral-300">
                    Payment due <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      className="bg-neutral-800/50 border-neutral-700 text-white"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                  <span className="text-xs text-neutral-400 mt-1">On Receipt</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            {/* Items Header */}
            <div className="grid grid-cols-12 gap-4 p-3 bg-neutral-800/20 rounded-lg">
              <div className="col-span-4 text-neutral-300 font-medium">
                Items <span className="text-red-500">*</span>
              </div>
              <div className="col-span-2 text-neutral-300 font-medium text-center">Stock</div>
              <div className="col-span-2 text-neutral-300 font-medium text-center">Quantity</div>
              <div className="col-span-2 text-neutral-300 font-medium text-center">Price</div>
              <div className="col-span-1 text-neutral-300 font-medium text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>

            {/* Items List */}
            {items.map((item) => {
              const inventoryItem = inventoryItems.find(inv => inv.id === item.product_id);
              const isLowStock = inventoryItem && inventoryItem.stock < item.quantity;
              
              return (
                <div key={item.id} className={`grid grid-cols-12 gap-4 p-3 rounded-lg ${isLowStock ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-700/10'}`}>
                  <div className="col-span-4">
                    <Select 
                      value={item.description} 
                      onValueChange={(value) => updateItem(item.id, 'description', value)}
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600">
                        <SelectValue placeholder="Select inventory item" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {inventoryItems.map((invItem) => (
                          <SelectItem key={invItem.id} value={invItem.name}>
                            <div className="flex flex-col">
                              <span>{invItem.name}</span>
                              <span className="text-xs text-slate-400">
                                {invItem.sku} | Stock: {invItem.stock} | ${invItem.unit_price}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className={`text-sm font-medium ${isLowStock ? 'text-red-400' : 'text-slate-300'}`}>
                      {inventoryItem?.stock || 0}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className={`bg-slate-700/50 border-slate-600 text-white text-center ${isLowStock ? 'border-red-500' : ''}`}
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      className="bg-slate-700/50 border-slate-600 text-white text-center"
                      min="0"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <span className="text-white font-medium">${item.amount.toFixed(2)}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Add Item Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={addItem}
              className="text-gray-400 hover:text-gray-300 w-full justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add an item
            </Button>
          </div>

          <Separator className="bg-slate-600" />

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Subtotal</span>
                <span className="text-white font-medium">${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Discount (%)</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                  className="w-20 bg-slate-700/50 border-slate-600 text-white text-right"
                  min="0"
                  max="100"
                />
              </div>

              <Separator className="bg-slate-600" />

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">Total</span>
                  <Select defaultValue="USD">
                    <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="USD">USD ($) - U.S. dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-white font-bold text-xl">${total.toFixed(2)}</span>
              </div>

              <Separator className="bg-slate-600" />

              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Amount Due</span>
                <span className="text-white font-bold text-xl">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Add any additional notes..."
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-white text-black hover:bg-neutral-200"
              disabled={inventoryWarnings.length > 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Create Invoice
                  {inventoryWarnings.length > 0 && ' (Inventory Issues)'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
