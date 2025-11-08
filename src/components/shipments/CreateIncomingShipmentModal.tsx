import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Truck, Check, AlertCircle, PackageOpen, Clipboard, Calendar, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useShipmentsQuery } from '@/hooks/queries/useShipmentsQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import ShipmentItemsManager from '@/components/inventory/ShipmentItemsManager';

interface CreateIncomingShipmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

interface LocalShipmentItem {
  sku: string;
  name: string;
  expected_qty: number;
  received_qty?: number;
  damaged_qty?: number;
  notes?: string;
}

const CreateIncomingShipmentModal = ({ open, onOpenChange, onUpdate }: CreateIncomingShipmentModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedWarehouse, warehouses } = useWarehouse();
  const { data: shipmentsData, isLoading: shipmentsLoading, refetch } = useShipmentsQuery();

  const [activeTab, setActiveTab] = useState('pending');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingShipment, setIsAddingShipment] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  
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

  const shipments = shipmentsData?.data || [];

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

  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      setNewShipment({
        supplier: '',
        order_reference: '',
        expected_date: '',
        status: 'pending'
      });
      setNewShipmentItems([]);
      setShowAddForm(false);
      setSelectedShipment(null);
      setReceivingItems([]);
    }
  }, [open]);

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
      // Calculate status based on received items
      let allReceived = true;
      
      for (const item of receivingItems) {
        if (!item.received_qty || item.received_qty === 0) {
          allReceived = false;
          break;
        }
      }
      
      const status = allReceived ? 'inspected' : 'partially-received';
      
      // Update shipment status
      const { error: shipmentError } = await supabase
        .from('shipments')
        .update({
          status,
          received_date: shipment.received_date || format(new Date(), 'yyyy-MM-dd'),
        })
        .eq('id', shipment.id);
      
      if (shipmentError) throw shipmentError;

      // Update shipment items
      for (const item of receivingItems) {
        const existingItem = shipment.items.find(si => si.sku === item.sku);
        if (existingItem) {
          const { error: itemError } = await supabase
            .from('shipment_items')
            .update({
              received_qty: item.received_qty,
              damaged_qty: item.damaged_qty,
              notes: item.notes
            })
            .eq('id', existingItem.id);
          
          if (itemError) throw itemError;
        }
      }
      
      setSelectedShipment(null);
      setReceivingItems([]);
      refetch();
      
      toast({
        title: "Shipment Updated",
        description: `Shipment ${shipment.id} has been processed successfully.`,
      });
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
      // Create shipment
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          supplier: newShipment.supplier,
          order_reference: newShipment.order_reference,
          expected_date: newShipment.expected_date,
          status: newShipment.status,
          shipment_type: 'incoming',
          user_id: user?.id,
          warehouse_id: selectedWarehouse || null,
          company_id: warehouses.find(w => w.warehouse_id === selectedWarehouse)?.company_id || null,
        })
        .select()
        .single();

      if (shipmentError) throw shipmentError;

      // Create shipment items
      const itemsToInsert = newShipmentItems.map(item => ({
        shipment_id: shipmentData.id,
        sku: item.sku,
        name: item.name,
        expected_qty: item.expected_qty,
        received_qty: item.received_qty,
        damaged_qty: item.damaged_qty,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase
        .from('shipment_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
      
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
      refetch();
      onUpdate();
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
        return <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30">On Route</Badge>;
      case 'received':
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Received</Badge>;
      case 'inspected':
        return <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30">Inspected</Badge>;
      default:
        return <Badge className="bg-neutral-700/20 text-neutral-300 border-neutral-700/30">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-auto bg-neutral-900/95 backdrop-blur-md border border-neutral-800/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Advanced Shipment Management</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Manage shipments with enhanced scheduling and tracking capabilities
          </DialogDescription>
        </DialogHeader>

        {/* Show loading indicator when adding shipment */}
        {isAddingShipment && (
          <div className="bg-gray-700/20 border border-gray-600/30 rounded-lg p-3 text-gray-300">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
              Adding shipment...
            </div>
          </div>
        )}

        {showAddForm ? (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white">Add New Shipment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-neutral-300">Supplier *</Label>
                <Input
                  id="supplier"
                  value={newShipment.supplier}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Enter supplier name"
                  className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderReference" className="text-neutral-300">Shipment ID *</Label>
                <Input
                  id="orderReference"
                  value={newShipment.order_reference}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, order_reference: e.target.value }))}
                  placeholder="PO-2024-001"
                  className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDate" className="text-neutral-300">Expected Delivery Date *</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={newShipment.expected_date}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, expected_date: e.target.value }))}
                  className="bg-neutral-800/50 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-neutral-300">Status</Label>
                <Select
                  value={newShipment.status}
                  onValueChange={(value: 'pending' | 'partially-received' | 'received') => 
                    setNewShipment(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-neutral-800/50 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
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
              <TabsList className="grid w-full grid-cols-3 bg-neutral-800/50">
                <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                  <Truck className="h-4 w-4" />
                  Pending Shipments
                </TabsTrigger>
                <TabsTrigger value="received" className="gap-2 data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                  <Check className="h-4 w-4" />
                  Received Shipments
                </TabsTrigger>
                <TabsTrigger value="scheduling" className="gap-2 data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                  <Clock className="h-4 w-4" />
                  Scheduling
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="scheduling" className="mt-4">
                <div className="text-center py-8 text-neutral-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-neutral-500" />
                  <p>Shipment scheduling panel coming soon</p>
                </div>
              </TabsContent>
              
              <TabsContent value="pending" className="mt-4">
                {shipmentsLoading ? (
                  <div className="text-center py-8 text-neutral-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-400 mx-auto"></div>
                    <p className="mt-2">Loading shipments...</p>
                  </div>
                ) : filteredShipments.length > 0 ? (
                  <div className="rounded-lg border border-neutral-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800/50">
                          <TableHead className="text-neutral-300">ID</TableHead>
                          <TableHead className="text-neutral-300">Supplier</TableHead>
                          <TableHead className="text-neutral-300">Expected Date</TableHead>
                          <TableHead className="text-neutral-300">Status</TableHead>
                          <TableHead className="text-neutral-300">Items</TableHead>
                          <TableHead className="text-right text-neutral-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredShipments.map((shipment) => (
                          <TableRow key={shipment.id} className="border-neutral-700 hover:bg-neutral-800/30">
                            <TableCell className="font-medium text-white">{shipment.id}</TableCell>
                            <TableCell className="text-neutral-300">{shipment.supplier}</TableCell>
                            <TableCell className="text-neutral-300">{shipment.expected_date}</TableCell>
                            <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                            <TableCell className="text-neutral-300">{shipment.items?.length || 0} items</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                onClick={() => handleReceiveShipment(shipment.id)} 
                                size="sm" 
                                variant="outline" 
                                className="gap-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
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
                  <div className="text-center py-8 text-neutral-400">
                    No pending shipments found
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="received" className="mt-4">
                {shipmentsLoading ? (
                  <div className="text-center py-8 text-neutral-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-400 mx-auto"></div>
                    <p className="mt-2">Loading shipments...</p>
                  </div>
                ) : filteredShipments.length > 0 ? (
                  <div className="rounded-lg border border-neutral-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800/50">
                          <TableHead className="text-neutral-300">ID</TableHead>
                          <TableHead className="text-neutral-300">Supplier</TableHead>
                          <TableHead className="text-neutral-300">Received Date</TableHead>
                          <TableHead className="text-neutral-300">Status</TableHead>
                          <TableHead className="text-neutral-300">Issues</TableHead>
                          <TableHead className="text-right text-neutral-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredShipments.map((shipment) => {
                          const itemsWithIssues = shipment.items?.filter(
                            item => (item.damaged_qty && item.damaged_qty > 0) || 
                                   (item.received_qty !== undefined && item.received_qty !== item.expected_qty)
                          ) || [];
                          
                          return (
                            <TableRow key={shipment.id} className="border-neutral-700 hover:bg-neutral-800/30">
                              <TableCell className="font-medium text-white">{shipment.id}</TableCell>
                              <TableCell className="text-neutral-300">{shipment.supplier}</TableCell>
                              <TableCell className="text-neutral-300">{shipment.received_date}</TableCell>
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
                                  className="gap-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
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
                  <div className="text-center py-8 text-neutral-400">
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
                      <p className="text-sm text-neutral-400">
                        {shipment.supplier} - PO: {shipment.order_reference}
                      </p>
                    </div>
                    {getStatusBadge(shipment.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-neutral-300">Expected: {shipment.expected_date}</span>
                    </div>
                    {shipment.received_date && (
                      <div className="flex items-center gap-2">
                        <PackageOpen className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-300">Received: {shipment.received_date}</span>
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
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
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
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
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
              onClick={() => onOpenChange(false)}
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIncomingShipmentModal;