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
import { Plus, Minus, CheckCircle, FileText, Edit, Trash2, Package, Send, Copy, Download, CalendarIcon, MoreHorizontal, ShoppingCart, Search } from 'lucide-react';
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
import { POStatusIntegration } from './POStatusIntegration';
import { PaymentStatusBadge } from './PaymentStatusBadge';

export const PurchaseOrders = () => {
  const { toast } = useToast();
  const { selectedWarehouse } = useWarehouse();
  const { purchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, updatePurchaseOrderStatus, createVendorBillFromPO, confirmPurchaseOrder, isLoading, refetch } = usePurchaseOrders();
  const { vendors, isLoading: vendorsLoading } = useVendors();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
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

  // Get unique vendor names from POs for the existing filter
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
      draft: { variant: 'secondary' as const, label: 'Draft', className: 'bg-gray-700/20 text-gray-400 border-gray-600/30' },
      approved: { variant: 'default' as const, label: 'Approved', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      confirmed: { variant: 'default' as const, label: 'Confirmed', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      received: { variant: 'default' as const, label: 'Received', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      partially_received: { variant: 'outline' as const, label: 'Partially Received', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      closed: { variant: 'outline' as const, label: 'Closed', className: 'bg-gray-700/20 text-gray-400 border-gray-600/30' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const statusMatch = statusFilter === 'all' || po.status === statusFilter;
    const vendorMatch = vendorFilter === 'all' || po.vendor_name === vendorFilter;
    const searchMatch = searchTerm === '' || 
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && vendorMatch && searchMatch;
  });

  if (isLoading) {
    return (
      <div className="p-6 text-neutral-400">Loading purchase orders...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Purchase Order Management</h2>
          <p className="text-neutral-400 mt-1">Create and manage vendor purchase orders</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-neutral-200">
              <Plus className="h-4 w-4 mr-2" />
              Create PO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800">
            <DialogHeader>
              <DialogTitle className="text-white">Create Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Vendor Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-neutral-300">Select Vendor *</Label>
                  {vendorsLoading ? (
                    <div className="p-2 text-neutral-400">Loading vendors...</div>
                  ) : vendors.length === 0 ? (
                    <div className="p-2 text-neutral-400">No vendors available. Please add vendors first.</div>
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
                      <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                        <SelectValue placeholder="Choose a vendor" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-700">
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
                  <Label className="text-neutral-300">Vendor Contact</Label>
                  <Input
                    value={formData.vendorContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendorContact: e.target.value }))}
                    placeholder="Contact person"
                    disabled={!!formData.vendorId}
                    className="bg-neutral-900 border-neutral-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-neutral-300">Vendor Email</Label>
                  <Input
                    type="email"
                    value={formData.vendorEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendorEmail: e.target.value }))}
                    placeholder="vendor@email.com"
                    disabled={!!formData.vendorId}
                    className="bg-neutral-900 border-neutral-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-neutral-300">Order Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-neutral-900 border-neutral-700 text-white",
                          !formData.orderDate && "text-neutral-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.orderDate ? format(formData.orderDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700" align="start">
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
                  <Label className="text-neutral-300">Expected Delivery Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-neutral-900 border-neutral-700 text-white",
                          !formData.expectedDeliveryDate && "text-neutral-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expectedDeliveryDate ? format(formData.expectedDeliveryDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.expectedDeliveryDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, expectedDeliveryDate: date || undefined }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-neutral-300">Order Items *</Label>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsInventorySelectorOpen(true)}
                      className="bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      From Inventory
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {poItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-center">
                      <Input
                        placeholder="SKU"
                        value={item.item_sku}
                        onChange={(e) => handleItemChange(index, 'item_sku', e.target.value)}
                        className="bg-neutral-900 border-neutral-700 text-white"
                      />
                      <Input
                        placeholder="Item Name"
                        value={item.item_name}
                        onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                        className="col-span-2 bg-neutral-900 border-neutral-700 text-white"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="bg-neutral-900 border-neutral-700 text-white"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Price"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="bg-neutral-900 border-neutral-700 text-white"
                        />
                        {poItems.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveItem(index)}
                            className="hover:bg-neutral-800"
                          >
                            <Minus className="h-4 w-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <p className="text-lg font-semibold text-white">Total: ${calculateTotal().toFixed(2)}</p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-neutral-300">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  className="bg-neutral-900 border-neutral-700 text-white"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                  Cancel
                </Button>
                <Button onClick={handleCreatePO} className="bg-white text-black hover:bg-neutral-200">
                  Create Purchase Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="bg-neutral-900/50 border-neutral-800">
          <TabsTrigger value="orders" className="data-[state=active]:bg-neutral-800">Orders</TabsTrigger>
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-neutral-800">Dashboard</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-neutral-800">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          {/* Filters */}
          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                  <Input
                    placeholder="Search PO number or vendor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-neutral-900 border-neutral-700 text-white"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-neutral-900 border-neutral-700 text-white">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger className="w-48 bg-neutral-900 border-neutral-700 text-white">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700">
                    <SelectItem value="all">All Vendors</SelectItem>
                    {uniqueVendorNames.map(vendor => (
                      <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* PO Table */}
          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
            <CardHeader>
              <CardTitle className="text-white">Purchase Orders ({filteredPOs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPOs.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                  <p className="text-neutral-400">No purchase orders found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800">
                      <TableHead className="text-neutral-300">PO Number</TableHead>
                      <TableHead className="text-neutral-300">Vendor</TableHead>
                      <TableHead className="text-neutral-300">Date</TableHead>
                      <TableHead className="text-neutral-300">Items</TableHead>
                      <TableHead className="text-neutral-300">Total</TableHead>
                      <TableHead className="text-neutral-300">Status</TableHead>
                      <TableHead className="text-neutral-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPOs.map((po) => (
                      <TableRow key={po.id} className="border-neutral-800 hover:bg-neutral-800/30">
                        <TableCell className="font-medium text-white">{po.po_number}</TableCell>
                        <TableCell className="text-neutral-300">{po.vendor_name}</TableCell>
                        <TableCell className="text-neutral-300">{format(new Date(po.order_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-neutral-300">{po.po_items?.length || 0} items</TableCell>
                        <TableCell className="font-medium text-white">${po.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(po.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-neutral-800">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-neutral-900 border-neutral-700">
                              <DropdownMenuItem onClick={() => openEditDialog(po)} className="text-neutral-300 focus:bg-neutral-800">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicatePO(po)} className="text-neutral-300 focus:bg-neutral-800">
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generatePOPDF(po)} className="text-neutral-300 focus:bg-neutral-800">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-neutral-700" />
                              {po.status === 'draft' && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(po.id, 'approved')} className="text-green-400 focus:bg-neutral-800">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {po.status === 'approved' && (
                                <DropdownMenuItem onClick={() => handleConfirmPO(po)} className="text-blue-400 focus:bg-neutral-800">
                                  <Send className="h-4 w-4 mr-2" />
                                  Confirm & Create Shipment
                                </DropdownMenuItem>
                              )}
                              {(po.status === 'confirmed' || po.status === 'partially_received') && (
                                <DropdownMenuItem onClick={() => handleReceiveItems(po)} className="text-green-400 focus:bg-neutral-800">
                                  <Package className="h-4 w-4 mr-2" />
                                  Receive Items
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-neutral-700" />
                              <DropdownMenuItem onClick={() => openDeleteDialog(po)} className="text-red-400 focus:bg-neutral-800">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <PurchaseOrderDashboard purchaseOrders={purchaseOrders} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <PurchaseOrderReports purchaseOrders={purchaseOrders} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Are you sure you want to delete PO {poToDelete?.po_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePO} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receiving Dialog */}
      {selectedPOForReceiving && (
        <PurchaseOrderReceivingDialog
          purchaseOrder={selectedPOForReceiving}
          isOpen={isReceivingDialogOpen}
          onClose={() => {
            setIsReceivingDialogOpen(false);
            setSelectedPOForReceiving(null);
          }}
          onReceivingComplete={() => {
            refetch();
            setSelectedPOForReceiving(null);
          }}
        />
      )}

      {/* Inventory Selector */}
      <InventoryItemSelector
        isOpen={isInventorySelectorOpen}
        onClose={() => setIsInventorySelectorOpen(false)}
        onSelectItem={handleSelectFromInventory}
        selectedItems={poItems}
      />
    </div>
  );
};
