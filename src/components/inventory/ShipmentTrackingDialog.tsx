
import React, { useState } from 'react';
import { useOrders } from '@/contexts/OrdersContext';
import { useInventory } from '@/contexts/InventoryContext';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Truck, Check, AlertCircle, PackageOpen, Clipboard, Calendar, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import ShipmentSchedulingPanel from './ShipmentSchedulingPanel';
import ShipmentItemsManager from './ShipmentItemsManager';
import { Shipment } from '@/hooks/useWarehouseScopedShipments';

interface LocalShipmentItem {
  sku: string;
  name: string;
  expected_qty: number;
  received_qty?: number;
  damaged_qty?: number;
  notes?: string;
}

const ShipmentTrackingDialog = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingShipment, setIsAddingShipment] = useState(false);
  const { shipments, shipmentsLoading, updateShipment, addShipment } = useOrders();
  const { processShipmentItems } = useInventory();
  const { toast } = useToast();
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [showBatchAssignment, setShowBatchAssignment] = useState(false);
  
  // Add shipment form state
  const [newShipment, setNewShipment] = useState({
    supplier: '',
    order_reference: '',
    expected_date: '',
    status: 'pending' as 'pending' | 'partially-received' | 'received'
  });
  const [newShipmentItems, setNewShipmentItems] = useState<LocalShipmentItem[]>([]);

  // Receiving state
  const [receivingItems, setReceivingItems] = useState<LocalShipmentItem[]>([]);

  const filteredShipments = shipments.filter(shipment => {
    if (activeTab === 'pending') {
      return ['pending', 'partially-received'].includes(shipment.status);
    } else if (activeTab === 'received') {
      return ['received', 'inspected'].includes(shipment.status);
    } else if (activeTab === 'scheduling') {
      return true;
    }
    return true;
  });

  const handleReceiveShipment = (shipmentId: string) => {
    setSelectedShipment(shipmentId);
    const shipment = shipments.find(s => s.id === shipmentId);
    if (shipment) {
      const items = shipment.items.map(item => ({
        sku: item.sku,
        name: item.name,
        expected_qty: item.expected_qty,
        received_qty: item.received_qty || item.expected_qty,
        damaged_qty: item.damaged_qty || 0,
        notes: item.notes || ''
      }));
      setReceivingItems(items);
    }
  };

  const handleSaveReceiving = async () => {
    if (!selectedShipment) return;
    
    const shipment = shipments.find(s => s.id === selectedShipment);
    if (!shipment) return;
    
    try {
      const updatedItems = receivingItems.map(item => ({
        id: Math.random().toString(), // This should be handled better in real implementation
        shipment_id: shipment.id,
        sku: item.sku,
        name: item.name,
        expected_qty: item.expected_qty,
        received_qty: item.received_qty,
        damaged_qty: item.damaged_qty,
        notes: item.notes
      }));
      
      // Calculate status based on received items
      let allReceived = true;
      
      for (const item of receivingItems) {
        if (!item.received_qty || item.received_qty === 0) {
          allReceived = false;
          break;
        }
      }
      
      const status: Shipment['status'] = allReceived ? 'inspected' : 'partially-received';
      
      const updatedShipment = {
        ...shipment,
        received_date: shipment.received_date || format(new Date(), 'yyyy-MM-dd'),
        status,
        items: updatedItems
      };
      
      await updateShipment(updatedShipment);
      
      // Process inventory updates and wait for completion
      await processShipmentItems(receivingItems);
      
      setSelectedShipment(null);
      setReceivingItems([]);
      
      toast({
        title: "Shipment Updated",
        description: `Shipment ${updatedShipment.id} has been processed. Inventory has been automatically updated.`,
      });

      // Wait for database consistency and then open batch assignment dialog
      setTimeout(() => {
        setShowBatchAssignment(true);
      }, 1500);
    } catch (error) {
      console.error('Error updating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to update shipment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddShipment = async () => {
    if (!newShipment.supplier || !newShipment.order_reference || !newShipment.expected_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (newShipmentItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the shipment",
        variant: "destructive",
      });
      return;
    }

    setIsAddingShipment(true);

    try {
      // Transform LocalShipmentItem[] to the format expected by addShipment
      const transformedItems = newShipmentItems.map(item => ({
        sku: item.sku,
        name: item.name,
        expected_qty: item.expected_qty,
        received_qty: item.received_qty,
        damaged_qty: item.damaged_qty,
        notes: item.notes
      }));

      const shipmentData = {
        supplier: newShipment.supplier,
        order_reference: newShipment.order_reference,
        expected_date: newShipment.expected_date,
        status: newShipment.status,
        items: transformedItems
      };

      await addShipment(shipmentData);
      
      toast({
        title: "Shipment Added",
        description: `New shipment from ${newShipment.supplier} has been added with ${newShipmentItems.length} items`,
      });

      // Reset form
      setNewShipment({
        supplier: '',
        order_reference: '',
        expected_date: '',
        status: 'pending'
      });
      setNewShipmentItems([]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding shipment:', error);
      toast({
        title: "Error",
        description: "Failed to add shipment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingShipment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Pending</Badge>;
      case 'partially-received':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">On Route</Badge>;
      case 'received':
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Received</Badge>;
      case 'inspected':
        return <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Inspected</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
          <Plus className="h-4 w-4" />
          Manage Shipments
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-auto bg-slate-800/95 backdrop-blur-md border border-slate-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Advanced Shipment Management</DialogTitle>
          <DialogDescription className="text-slate-400">
            Manage shipments with enhanced scheduling and tracking capabilities
          </DialogDescription>
        </DialogHeader>

        {/* Show loading indicator when adding shipment */}
        {isAddingShipment && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-blue-300">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
              Adding shipment...
            </div>
          </div>
        )}

        {showAddForm ? (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white">Add New Shipment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-slate-300">Supplier *</Label>
                <Input
                  id="supplier"
                  value={newShipment.supplier}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Enter supplier name"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderReference" className="text-slate-300">Shipment ID *</Label>
                <Input
                  id="orderReference"
                  value={newShipment.order_reference}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, order_reference: e.target.value }))}
                  placeholder="PO-2024-001"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDate" className="text-slate-300">Expected Delivery Date *</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={newShipment.expected_date}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, expected_date: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-300">Status</Label>
                <Select
                  value={newShipment.status}
                  onValueChange={(value: 'pending' | 'partially-received' | 'received') => 
                    setNewShipment(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partially-received">On Route</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <ShipmentItemsManager 
              items={newShipmentItems}
              onItemsChange={setNewShipmentItems}
            />
          </div>
        ) : !selectedShipment ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={() => setShowAddForm(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isAddingShipment}
              >
                <Plus className="h-4 w-4" />
                Add New Shipment
              </Button>
            </div>
            
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                  <Truck className="h-4 w-4" />
                  Pending Shipments
                </TabsTrigger>
                <TabsTrigger value="received" className="gap-2 data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                  <Check className="h-4 w-4" />
                  Received Shipments
                </TabsTrigger>
                <TabsTrigger value="scheduling" className="gap-2 data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                  <Clock className="h-4 w-4" />
                  Scheduling
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="scheduling" className="mt-4">
                <ShipmentSchedulingPanel onScheduleUpdate={() => {/* Refresh shipments if needed */}} />
              </TabsContent>
              
              <TabsContent value="pending" className="mt-4">
                {shipmentsLoading ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto"></div>
                    <p className="mt-2">Loading shipments...</p>
                  </div>
                ) : filteredShipments.length > 0 ? (
                  <div className="rounded-lg border border-slate-600 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/50">
                          <TableHead className="text-slate-300">ID</TableHead>
                          <TableHead className="text-slate-300">Supplier</TableHead>
                          <TableHead className="text-slate-300">Expected Date</TableHead>
                          <TableHead className="text-slate-300">Status</TableHead>
                          <TableHead className="text-slate-300">Items</TableHead>
                          <TableHead className="text-right text-slate-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredShipments.map((shipment) => (
                          <TableRow key={shipment.id} className="border-slate-600 hover:bg-slate-700/30">
                            <TableCell className="font-medium text-white">{shipment.id}</TableCell>
                            <TableCell className="text-slate-300">{shipment.supplier}</TableCell>
                            <TableCell className="text-slate-300">{shipment.expected_date}</TableCell>
                            <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                            <TableCell className="text-slate-300">{shipment.items.length} items</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                onClick={() => handleReceiveShipment(shipment.id)} 
                                size="sm" 
                                variant="outline" 
                                className="gap-1 border-slate-600 text-slate-700 hover:bg-slate-700 hover:text-white"
                              >
                                <PackageOpen className="h-3.5 w-3.5" />
                                Receive
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No pending shipments found
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="received" className="mt-4">
                {shipmentsLoading ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto"></div>
                    <p className="mt-2">Loading shipments...</p>
                  </div>
                ) : filteredShipments.length > 0 ? (
                  <div className="rounded-lg border border-slate-600 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/50">
                          <TableHead className="text-slate-300">ID</TableHead>
                          <TableHead className="text-slate-300">Supplier</TableHead>
                          <TableHead className="text-slate-300">Received Date</TableHead>
                          <TableHead className="text-slate-300">Status</TableHead>
                          <TableHead className="text-slate-300">Issues</TableHead>
                          <TableHead className="text-right text-slate-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredShipments.map((shipment) => {
                          const itemsWithIssues = shipment.items.filter(
                            item => (item.damaged_qty && item.damaged_qty > 0) || 
                                   (item.received_qty !== undefined && item.received_qty !== item.expected_qty)
                          );
                          
                          return (
                            <TableRow key={shipment.id} className="border-slate-600 hover:bg-slate-700/30">
                              <TableCell className="font-medium text-white">{shipment.id}</TableCell>
                              <TableCell className="text-slate-300">{shipment.supplier}</TableCell>
                              <TableCell className="text-slate-300">{shipment.received_date}</TableCell>
                              <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                              <TableCell>
                                {itemsWithIssues.length > 0 ? (
                                  <Badge className="gap-1 bg-red-500/20 text-red-300 border-red-500/30">
                                    <AlertCircle className="h-3 w-3" />
                                    {itemsWithIssues.length} issues
                                  </Badge>
                                ) : (
                                  <Badge className="gap-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                    <Check className="h-3 w-3" />
                                    No issues
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  onClick={() => handleReceiveShipment(shipment.id)} 
                                  size="sm" 
                                  variant="outline" 
                                  className="gap-1 border-slate-600 text-slate-700 hover:bg-slate-700 hover:text-white"
                                >
                                  <Clipboard className="h-3.5 w-3.5" />
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No received shipments found
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            {(() => {
              const shipment = shipments.find(s => s.id === selectedShipment);
              if (!shipment) return null;
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white">{shipment.id}</h3>
                      <p className="text-sm text-slate-400">
                        {shipment.supplier} - PO: {shipment.order_reference}
                      </p>
                    </div>
                    {getStatusBadge(shipment.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">Expected: {shipment.expected_date}</span>
                    </div>
                    {shipment.received_date && (
                      <div className="flex items-center gap-2">
                        <PackageOpen className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-300">Received: {shipment.received_date}</span>
                      </div>
                    )}
                  </div>
                  
                  <ShipmentItemsManager 
                    items={receivingItems}
                    onItemsChange={setReceivingItems}
                    isReceiving={true}
                  />
                </div>
              );
            })()}
          </>
        )}
        
        <DialogFooter className="gap-2">
          {showAddForm ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)} 
                disabled={isAddingShipment}
                className="border-slate-600 text-slate-800 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddShipment} 
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" 
                disabled={isAddingShipment}
              >
                <Plus className="h-4 w-4" />
                Add Shipment
              </Button>
            </>
          ) : selectedShipment ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setSelectedShipment(null)}
                className="border-slate-600 text-slate-800 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveReceiving} 
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-slate-600 text-slate-700 hover:bg-slate-700 hover:text-white"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      <BatchAssignmentDialog
        open={showBatchAssignment}
        onOpenChange={setShowBatchAssignment}
        onAssignmentComplete={() => {
          setShowBatchAssignment(false);
          // Optionally refresh shipments or inventory
        }}
      />
    </Dialog>
  );
};

export default ShipmentTrackingDialog;
