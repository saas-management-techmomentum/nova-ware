
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, CalendarIcon } from 'lucide-react';
import { useOrders } from '@/contexts/OrdersContext';
import { useClients } from '@/contexts/ClientsContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useBilling } from '@/contexts/BillingContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unit_price?: number;
}

const NewOrderDialog: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addOrder, orderStatuses } = useOrders();
  const { clients, isLoading: clientsLoading } = useClients();
  const { inventoryItems, isLoading: productsLoading } = useInventory();
  const { invoices, isLoading: invoicesLoading } = useBilling();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default statuses as fallback when no custom statuses exist
  const defaultStatuses = [
    { id: 'default-pending', name: 'Pending', color: 'bg-yellow-500' },
    { id: 'default-processing', name: 'Processing', color: 'bg-blue-500' },
    { id: 'default-shipped', name: 'Shipped', color: 'bg-purple-500' },
    { id: 'default-delivered', name: 'Delivered', color: 'bg-green-500' },
    { id: 'default-cancelled', name: 'Cancelled', color: 'bg-red-500' },
  ];

  // Use custom statuses if available, otherwise use defaults
  const availableStatuses = orderStatuses.length > 0 ? orderStatuses : defaultStatuses;

  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [clientId, setClientId] = useState('');
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [status, setStatus] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [allocationStrategy, setAllocationStrategy] = useState<'FIFO' | 'LIFO' | 'FEFO'>('FIFO');
  const [invoiceItemsLoaded, setInvoiceItemsLoaded] = useState(false);

  const getClientNameById = (cid: string) => clients.find(c => c.id === cid)?.name || '';

  // Set default status when statuses are loaded
  useEffect(() => {
    if (availableStatuses.length > 0 && !status) {
      const firstStatus = availableStatuses[0];
      setStatus(firstStatus.name.toLowerCase().replace(/\s+/g, '-'));
    }
  }, [availableStatuses, status]);

  // Auto-populate order items from selected invoice
  useEffect(() => {
    if (selectedInvoiceId && !invoiceItemsLoaded) {
      const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);
      if (selectedInvoice) {
        // Fetch invoice items from supabase
        const fetchInvoiceItems = async () => {
          try {
            const { data: invoiceItems, error } = await supabase
              .from('invoice_items')
              .select('*')
              .eq('invoice_id', selectedInvoiceId);

            if (error) {
              console.error('Error fetching invoice items:', error);
              return;
            }

            if (invoiceItems && invoiceItems.length > 0) {
              const mappedItems: OrderItem[] = invoiceItems.map(item => ({
                productId: item.product_id || '',
                sku: item.sku,
                name: item.name,
                qty: item.quantity,
                unit_price: item.unit_price
              }));
              setOrderItems(mappedItems);
              setInvoiceItemsLoaded(true);
            }
          } catch (err) {
            console.error('Error loading invoice items:', err);
          }
        };

        fetchInvoiceItems();

        // Auto-set client from invoice
        if (selectedInvoice.client_id) {
          setClientId(selectedInvoice.client_id);
        }
      }
    } else if (!selectedInvoiceId && invoiceItemsLoaded) {
      // Reset when invoice is deselected
      setOrderItems([]);
      setInvoiceItemsLoaded(false);
    }
  }, [selectedInvoiceId, invoices, invoiceItemsLoaded]);

  // Auto-add product when selected
  useEffect(() => {
    if (selectedProductId && quantity > 0) {
      addProductToOrder();
    }
  }, [selectedProductId]);

  const addProductToOrder = () => {
    if (!selectedProductId || quantity <= 0) {
      return;
    }

    const product = inventoryItems.find(p => p.id === selectedProductId);
    if (!product) return;

    // Check if there's enough stock
    if (quantity > product.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} units available for ${product.name}`,
        variant: "destructive"
      });
      setSelectedProductId('');
      setQuantity(1);
      return;
    }

    // Check if product already exists in order
    const existingItemIndex = orderItems.findIndex(item => item.productId === selectedProductId);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...orderItems];
      const newQty = updatedItems[existingItemIndex].qty + quantity;
      
      // Check total quantity against stock
      if (newQty > product.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock} units available for ${product.name}`,
          variant: "destructive"
        });
        setSelectedProductId('');
        setQuantity(1);
        return;
      }
      
      updatedItems[existingItemIndex].qty = newQty;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      const newItem: OrderItem = {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        qty: quantity,
        unit_price: product.unit_price
      };
      setOrderItems([...orderItems, newItem]);
    }

    // Reset selection
    setSelectedProductId('');
    setQuantity(1);
    
    toast({
      title: "Product Added",
      description: `${product.name} has been added to the order`,
      variant: "default"
    });
  };

  const removeProductFromOrder = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const updateItemQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeProductFromOrder(productId);
      return;
    }

    const product = inventoryItems.find(p => p.id === productId);
    if (!product) return;

    if (newQty > product.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} units available for ${product.name}`,
        variant: "destructive"
      });
      return;
    }

    const updatedItems = orderItems.map(item => 
      item.productId === productId ? { ...item, qty: newQty } : item
    );
    setOrderItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!selectedInvoiceId) {
      toast({
        title: "Select Invoice",
        description: "Please select an invoice for this order.",
        variant: "destructive"
      });
      return;
    }

    if (!clientId) {
      toast({
        title: "Select Client",
        description: "Please select a client for this order.",
        variant: "destructive"
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "Add Products",
        description: "Please add at least one product to the order.",
        variant: "destructive"
      });
      return;
    }

    if (!status) {
      toast({
        title: "Select Status",
        description: "Please select an initial status for the order.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const clientName = getClientNameById(clientId);
      const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

      const newOrder = {
        invoice_id: selectedInvoiceId,
        invoice_number: selectedInvoice?.invoice_number || '',
        client: clientName,
        date: format(orderDate, 'yyyy-MM-dd'),
        status,
        items: orderItems.map(item => ({ 
          sku: item.sku, 
          qty: item.qty,
          product_id: item.productId,
          unit_price: item.unit_price
        })),
      };

      await addOrder(newOrder, allocationStrategy);

      // Reset form
      setSelectedInvoiceId('');
      setClientId('');
      setOrderDate(new Date());
      setStatus(availableStatuses.length > 0 ? availableStatuses[0].name.toLowerCase().replace(/\s+/g, '-') : '');
      setOrderItems([]);
      setSelectedProductId('');
      setQuantity(1);
      setInvoiceItemsLoaded(false);

      setOpen(false);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
            <path d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Order</DialogTitle>
          <DialogDescription>
            Create a new client order and add products to it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="invoice">Invoice</Label>
            <Select
              value={selectedInvoiceId}
              onValueChange={setSelectedInvoiceId}
              disabled={invoicesLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={invoicesLoading ? "Loading invoices..." : invoices.length > 0 ? "Select invoice" : "No invoices found"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {invoices.length === 0 && !invoicesLoading ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No invoices found
                  </div>
                ) : (
                  invoices
                    .filter(inv => inv.status === 'sent' || inv.status === 'approved' || inv.status === 'paid')
                    .map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - {invoice.client_name} - ${invoice.total_amount.toFixed(2)}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="client">Client</Label>
            <Select
              value={clientId}
              onValueChange={setClientId}
              disabled={clientsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={clientsLoading ? "Loading clients..." : clients.length > 0 ? "Select client" : "No clients found"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {clients.length === 0 && !clientsLoading ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No clients found
                  </div>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="orderDate">Order Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="orderDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !orderDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {orderDate ? format(orderDate, "MM/dd/yyyy") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={orderDate}
                  onSelect={(date) => date && setOrderDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((statusOption) => (
                  <SelectItem 
                    key={statusOption.id} 
                    value={statusOption.name.toLowerCase().replace(/\s+/g, '-')}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusOption.color}`}></div>
                      {statusOption.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="allocation">Inventory Allocation Strategy</Label>
            <Select value={allocationStrategy} onValueChange={(value: 'FIFO' | 'LIFO' | 'FEFO') => setAllocationStrategy(value)}>
              <SelectTrigger id="allocation">
                <SelectValue placeholder="Select allocation strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIFO">
                  <div className="flex flex-col">
                    <span className="font-medium">FIFO (First In, First Out)</span>
                    <span className="text-xs text-muted-foreground">Oldest inventory first</span>
                  </div>
                </SelectItem>
                <SelectItem value="LIFO">
                  <div className="flex flex-col">
                    <span className="font-medium">LIFO (Last In, First Out)</span>
                    <span className="text-xs text-muted-foreground">Newest inventory first</span>
                  </div>
                </SelectItem>
                <SelectItem value="FEFO">
                  <div className="flex flex-col">
                    <span className="font-medium">FEFO (First Expired, First Out)</span>
                    <span className="text-xs text-muted-foreground">By expiration date</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product Selection Section - Only shown if invoice is NOT selected */}
          {!selectedInvoiceId && (
            <div className="border-t pt-4">
              <div className="grid gap-2">
                <Label>Add Products to Order</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                    disabled={productsLoading}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={
                        productsLoading ? "Loading products..." : 
                        inventoryItems.length > 0 ? "Select product to add..." : 
                        "No products found in current warehouse"
                      } />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {inventoryItems.length === 0 && !productsLoading ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          No products found in current warehouse
                        </div>
                      ) : (
                        inventoryItems.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex flex-col">
                              <span>{product.name}</span>
                              <span className="text-xs text-muted-foreground">SKU: {product.sku} | Stock: {product.stock}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20"
                    min="1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Order Items List - Shown for both manual and invoice-based orders */}
          {orderItems.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Order Items ({orderItems.length})</Label>
                {selectedInvoiceId && (
                  <Badge variant="secondary" className="text-xs">From Invoice</Badge>
                )}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {orderItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="text-xs text-muted-foreground">
                        SKU: {item.sku}
                        {item.unit_price && ` | $${item.unit_price}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Qty: {item.qty}
                      </Badge>
                      {!selectedInvoiceId && (
                        <>
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center"
                            min="1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProductFromOrder(item.productId)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewOrderDialog;
