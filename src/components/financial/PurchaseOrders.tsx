import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, CheckCircle, FileText, Edit, Trash2, Package, Send, Copy, Download, CalendarIcon, MoreHorizontal, ShoppingCart } from 'lucide-react';
import { usePurchaseOrders, CreatePOItemData, PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { useVendors } from '@/hooks/useVendors';
import { useToast } from '@/hooks/use-toast';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { InventoryItemSelector } from './InventoryItemSelector';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PurchaseOrderDashboard } from './PurchaseOrderDashboard';
import { PurchaseOrderReceivingDialog } from './PurchaseOrderReceivingDialog';
import { PurchaseOrderReports } from './PurchaseOrderReports';

export const PurchaseOrders = () => {
  const { toast } = useToast();
  const { selectedWarehouse } = useWarehouse();
  const { purchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, updatePurchaseOrderStatus, createVendorBillFromPO, confirmPurchaseOrder, isLoading, refetch } = usePurchaseOrders();
  const { vendors, isLoading: vendorsLoading } = useVendors();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [poToDelete, setPOToDelete] = useState<any>(null);
  const [selectedPOForReceiving, setSelectedPOForReceiving] = useState<PurchaseOrder | null>(null);
  const [isReceivingDialogOpen, setIsReceivingDialogOpen] = useState(false);
  const [isInventorySelectorOpen, setIsInventorySelectorOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    vendorId: '',
    vendorName: '',
    vendorContact: '',
    vendorEmail: '',
    orderDate: new Date(),
    expectedDeliveryDate: undefined as Date | undefined,
    notes: ''
  });
  
  const [poItems, setPOItems] = useState<CreatePOItemData[]>([
    { item_sku: '', item_name: '', quantity: 1, unit_price: 0 }
  ]);

  // Get unique vendor names from POs for the existing filter (keeping for backwards compatibility)
  const uniqueVendorNames = Array.from(new Set(purchaseOrders.map(po => po.vendor_name)));

  const handleAddItem = () => {
    setPOItems([...poItems, { item_sku: '', item_name: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (poItems.length > 1) {
      setPOItems(poItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof CreatePOItemData, value: string | number) => {
    const updatedItems = [...poItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setPOItems(updatedItems);
  };

  const handleSelectFromInventory = (item: CreatePOItemData) => {
    setPOItems(prev => [...prev, item]);
  };

  const calculateTotal = () => {
    return poItems.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  const handleCreatePO = async () => {
    try {
      // Validate form
      if (!formData.vendorId || !formData.vendorName.trim()) {
        toast({ title: "Please select a vendor", variant: "destructive" });
        return;
      }

      const validItems = poItems.filter(item => 
        item.item_sku.trim() && item.item_name.trim() && item.quantity > 0 && item.unit_price > 0
      );

      if (validItems.length === 0) {
        toast({ title: "At least one valid item is required", variant: "destructive" });
        return;
      }

      await createPurchaseOrder({
        vendor_name: formData.vendorName,
        vendor_contact: formData.vendorContact,
        vendor_email: formData.vendorEmail,
        order_date: format(formData.orderDate, 'yyyy-MM-dd'),
        expected_delivery_date: formData.expectedDeliveryDate ? format(formData.expectedDeliveryDate, 'yyyy-MM-dd') : undefined,
        notes: formData.notes,
        warehouse_id: selectedWarehouse || undefined,
        items: validItems
      });

      // Reset form
      setFormData({
        vendorId: '',
        vendorName: '',
        vendorContact: '',
        vendorEmail: '',
        orderDate: new Date(),
        expectedDeliveryDate: undefined,
        notes: ''
      });
      setPOItems([{ item_sku: '', item_name: '', quantity: 1, unit_price: 0 }]);
      setIsCreateDialogOpen(false);
      toast({ title: "Purchase order created successfully" });
    } catch (error) {
      toast({ title: "Failed to create purchase order", variant: "destructive" });
    }
  };

  const handleStatusUpdate = async (poId: string, status: 'approved' | 'received') => {
    try {
      await updatePurchaseOrderStatus(poId, status);
      toast({ title: `Purchase order marked as ${status}` });
    } catch (error) {
      toast({ title: "Failed to update purchase order status", variant: "destructive" });
    }
  };

  const handleConfirmPO = async (po: PurchaseOrder) => {
    try {
      await confirmPurchaseOrder(po);
      toast({ title: "Purchase order confirmed and transferred to Incoming Shipments" });
    } catch (error) {
      toast({ title: "Failed to confirm purchase order", variant: "destructive" });
    }
  };

  const handleReceiveItems = (po: PurchaseOrder) => {
    setSelectedPOForReceiving(po);
    setIsReceivingDialogOpen(true);
  };

  const handleDuplicatePO = (po: PurchaseOrder) => {
    // Find the vendor from the vendors list if possible
    const selectedVendor = vendors.find(v => v.vendor_name === po.vendor_name);
    
    setFormData({
      vendorId: selectedVendor?.id || '',
      vendorName: po.vendor_name,
      vendorContact: po.vendor_contact || '',
      vendorEmail: po.vendor_email || '',
      orderDate: new Date(),
      expectedDeliveryDate: undefined,
      notes: po.notes || ''
    });
    
    if (po.po_items) {
      setPOItems(po.po_items.map(item => ({
        item_sku: item.item_sku,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price
      })));
    }
    
    setIsCreateDialogOpen(true);
    toast({ title: "PO duplicated - review and create" });
  };

  const generatePOPDF = (po: PurchaseOrder) => {
    // Simplified PDF generation - in real implementation, would use a proper PDF library
    const printContent = `
      Purchase Order: ${po.po_number}
      Vendor: ${po.vendor_name}
      Date: ${format(new Date(po.order_date), 'MMM dd, yyyy')}
      Total: $${po.total_amount.toFixed(2)}
      
      Items:
      ${po.po_items?.map(item => 
        `${item.item_sku} - ${item.item_name}: ${item.quantity} x $${item.unit_price}`
      ).join('\n') || ''}
    `;
    
    const blob = new Blob([printContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PO-${po.po_number}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: "PO exported successfully" });
  };

  const openEditDialog = (po: PurchaseOrder) => {
    setEditingPO(po);
    setFormData({
      vendorId: '',
      vendorName: po.vendor_name,
      vendorContact: po.vendor_contact || '',
      vendorEmail: po.vendor_email || '',
      orderDate: new Date(po.order_date),
      expectedDeliveryDate: po.expected_delivery_date ? new Date(po.expected_delivery_date) : undefined,
      notes: po.notes || ''
    });
    setPOItems(po.po_items?.map(item => ({
      item_sku: item.item_sku,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price
    })) || [{ item_sku: '', item_name: '', quantity: 1, unit_price: 0 }]);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (po: PurchaseOrder) => {
    setPOToDelete(po);
    setDeleteDialogOpen(true);
  };

  const handleEditPO = async () => {
    if (!editingPO) return;
    
    try {
      const validItems = poItems.filter(item => 
        item.item_sku.trim() && item.item_name.trim() && item.quantity > 0 && item.unit_price > 0
      );

      if (validItems.length === 0) {
        toast({ title: "At least one valid item is required", variant: "destructive" });
        return;
      }

      await updatePurchaseOrder(editingPO.id, {
        vendor_name: formData.vendorName,
        vendor_contact: formData.vendorContact,
        vendor_email: formData.vendorEmail,
        order_date: format(formData.orderDate, 'yyyy-MM-dd'),
        expected_delivery_date: formData.expectedDeliveryDate ? format(formData.expectedDeliveryDate, 'yyyy-MM-dd') : undefined,
        notes: formData.notes,
        items: validItems
      });

      toast({ title: "Purchase order updated successfully" });
      setIsEditDialogOpen(false);
      setEditingPO(null);
      // Reset form
      setFormData({
        vendorId: '',
        vendorName: '',
        vendorContact: '',
        vendorEmail: '',
        orderDate: new Date(),
        expectedDeliveryDate: undefined,
        notes: ''
      });
      setPOItems([{ item_sku: '', item_name: '', quantity: 1, unit_price: 0 }]);
    } catch (error) {
      toast({ title: "Failed to update purchase order", variant: "destructive" });
    }
  };

  const handleDeletePO = async () => {
    if (!poToDelete) return;
    
    try {
      await deletePurchaseOrder(poToDelete.id);
      toast({ title: "Purchase order deleted successfully" });
      setDeleteDialogOpen(false);
      setPOToDelete(null);
    } catch (error) {
      toast({ title: "Failed to delete purchase order", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      approved: { variant: 'default' as const, label: 'Approved' },
      confirmed: { variant: 'default' as const, label: 'Confirmed' },
      received: { variant: 'default' as const, label: 'Received' },
      partially_received: { variant: 'outline' as const, label: 'Partially Received' },
      closed: { variant: 'outline' as const, label: 'Closed' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // Filter POs based on all filters
  const filteredPOs = purchaseOrders.filter(po => {
    const statusMatch = statusFilter === 'all' || po.status === statusFilter;
    const vendorMatch = vendorFilter === 'all' || po.vendor_name === vendorFilter;
    const searchMatch = searchTerm === '' || 
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && vendorMatch && searchMatch;
  });

  if (isLoading) {
    return <div className="p-6">Loading purchase orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">Purchase Order Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create PO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Vendor Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Select Vendor *</Label>
                  {vendorsLoading ? (
                    <div className="p-2 text-muted-foreground">Loading vendors...</div>
                  ) : vendors.length === 0 ? (
                    <div className="p-2 text-muted-foreground">No vendors available. Please add vendors first.</div>
                  ) : (
                    <Select 
                      value={formData.vendorId} 
                      onValueChange={(vendorId) => {
                        const selectedVendor = vendors.find(v => v.id === vendorId);
                        if (selectedVendor) {
                          setFormData(prev => ({
                            ...prev,
                            vendorId: vendorId,
                            vendorName: selectedVendor.vendor_name,
                            vendorContact: selectedVendor.contact_person || '',
                            vendorEmail: selectedVendor.email || ''
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.vendor_name}
                            {vendor.contact_person && ` (${vendor.contact_person})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>Vendor Contact</Label>
                  <Input
                    value={formData.vendorContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendorContact: e.target.value }))}
                    placeholder="Contact person"
                    disabled={!!formData.vendorId}
                  />
                </div>
                <div>
                  <Label>Vendor Email</Label>
                  <Input
                    type="email"
                    value={formData.vendorEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendorEmail: e.target.value }))}
                    placeholder="vendor@email.com"
                    disabled={!!formData.vendorId}
                  />
                </div>
                <div>
                  <Label>Order Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.orderDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.orderDate ? format(formData.orderDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.orderDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, orderDate: date || new Date() }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Expected Delivery Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.expectedDeliveryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expectedDeliveryDate ? format(formData.expectedDeliveryDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.expectedDeliveryDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, expectedDeliveryDate: date }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg">Items</Label>
                  <div className="flex gap-2">
                    <Button onClick={() => setIsInventorySelectorOpen(true)} size="sm" variant="outline">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      From Inventory
                    </Button>
                    <Button onClick={handleAddItem} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {poItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                      <div className="col-span-3">
                        <Label>SKU</Label>
                        <Input
                          value={item.item_sku}
                          onChange={(e) => handleItemChange(index, 'item_sku', e.target.value)}
                          placeholder="Item SKU"
                        />
                      </div>
                      <div className="col-span-4">
                        <Label>Item Name</Label>
                        <Input
                          value={item.item_name}
                          onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          onClick={() => handleRemoveItem(index)}
                          size="sm"
                          variant="outline"
                          disabled={poItems.length === 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-right mt-4">
                  <div className="text-lg font-semibold">
                    Total: ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or instructions"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePO}>
                  Create Purchase Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <PurchaseOrderDashboard purchaseOrders={purchaseOrders} />
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Purchase Orders</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Input
                    placeholder="Search PO number or vendor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="partially_received">Partially Received</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={vendorFilter} onValueChange={setVendorFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {uniqueVendorNames.map(vendorName => (
                        <SelectItem key={vendorName} value={vendorName}>{vendorName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Status</SelectItem>
                      <SelectItem value="no-bill">No Bill Created</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partially Paid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>PO Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.vendor_name}</TableCell>
                      <TableCell>{format(new Date(po.order_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {po.expected_delivery_date 
                          ? format(new Date(po.expected_delivery_date), 'MMM dd, yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>${po.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                       <TableCell>
                         <PaymentStatusBadge purchaseOrder={po} />
                       </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Primary Actions */}
                          {po.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(po.id, 'approved')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {po.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmPO(po)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Confirmed
                            </Button>
                          )}
                          {(po.status === 'received' || po.status === 'confirmed') && (
                            <Button
                              size="sm"
                              onClick={() => createVendorBillFromPO(po)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Create AP Bill
                            </Button>
                          )}
                          
                          {/* Secondary Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => generatePOPDF(po)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openEditDialog(po)}
                                disabled={po.status === 'received' || po.status === 'closed'}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicatePO(po)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(po)}
                                disabled={po.status === 'received' || po.status === 'closed'}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <PurchaseOrderReports purchaseOrders={purchaseOrders} />
        </TabsContent>
      </Tabs>

      {/* Edit Purchase Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Same form content as create dialog */}
            {/* Vendor Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Vendor Name *</Label>
                <Input
                  value={formData.vendorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendorName: e.target.value }))}
                  placeholder="Enter vendor name"
                />
              </div>
              <div>
                <Label>Vendor Contact</Label>
                <Input
                  value={formData.vendorContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendorContact: e.target.value }))}
                  placeholder="Contact person"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Vendor Email</Label>
                <Input
                  type="email"
                  value={formData.vendorEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendorEmail: e.target.value }))}
                  placeholder="vendor@example.com"
                />
              </div>
              <div>
                <Label>Order Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.orderDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.orderDate ? format(formData.orderDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.orderDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, orderDate: date || new Date() }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Expected Delivery Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.expectedDeliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expectedDeliveryDate ? format(formData.expectedDeliveryDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.expectedDeliveryDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, expectedDeliveryDate: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  className="min-h-[60px]"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPOItems([...poItems, { item_sku: '', item_name: '', quantity: 1, unit_price: 0 }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {poItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                  <div className="col-span-2">
                    <Label>SKU</Label>
                    <Input
                      value={item.item_sku}
                      onChange={(e) => handleItemChange(index, 'item_sku', e.target.value)}
                      placeholder="Item SKU"
                    />
                  </div>
                  <div className="col-span-4">
                    <Label>Item Name</Label>
                    <Input
                      value={item.item_name}
                      onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Total</Label>
                    <div className="p-2 bg-gray-50 rounded text-sm font-medium">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      disabled={poItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">
                  Total: ${poItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(2)}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditPO}>Update Purchase Order</Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete purchase order {poToDelete?.po_number}? 
              This action cannot be undone and will remove all associated items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePO} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PurchaseOrderReceivingDialog
        isOpen={isReceivingDialogOpen}
        onClose={() => setIsReceivingDialogOpen(false)}
        purchaseOrder={selectedPOForReceiving}
        onReceivingComplete={() => {
          refetch();
          setSelectedPOForReceiving(null);
        }}
      />

      <InventoryItemSelector
        isOpen={isInventorySelectorOpen}
        onClose={() => setIsInventorySelectorOpen(false)}
        onSelectItem={handleSelectFromInventory}
        selectedItems={poItems}
      />
    </div>
  );
};