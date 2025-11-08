import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  Filter, 
  Plus, 
  Package, 
  Calendar, 
  ChevronRight,
  ChevronDown,
  Eye,
  ExternalLink,
  Truck,
  ShoppingCart,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useShipmentsQuery } from '@/hooks/queries/useShipmentsQuery';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useShipmentStatusSync } from '@/hooks/useShipmentStatusSync';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ShipmentExpectedDateEditor } from '@/components/shipments/ShipmentExpectedDateEditor';
import ShipmentDetailsDialog from '@/components/inventory/ShipmentDetailsDialog';
import OutgoingShipments from '@/components/shipments/OutgoingShipments';
import ShippingSettings from '@/components/shipments/ShippingSettings';
import OutgoingShipmentModal from '@/components/shipments/OutgoingShipmentModal';
import CreateIncomingShipmentModal from '@/components/shipments/CreateIncomingShipmentModal';

const ShipmentsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: shipmentsData, refetch } = useShipmentsQuery();
  const { purchaseOrders, refetch: refetchPOs } = usePurchaseOrders();
  
  // Enable real-time status synchronization
  useShipmentStatusSync();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set());
  const [isPendingInTransitOpen, setIsPendingInTransitOpen] = useState(true);
  const [isReceivedCompletedOpen, setIsReceivedCompletedOpen] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isShipmentDialogOpen, setIsShipmentDialogOpen] = useState(false);

  // New Shipment Modal state
  const [isOutgoingShipmentModalOpen, setIsOutgoingShipmentModalOpen] = useState(false);
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState<any>(null);
  const [isIncomingShipmentModalOpen, setIsIncomingShipmentModalOpen] = useState(false);

  // Filter for incoming shipments only
  const incomingShipments = useMemo(() => {
    return shipmentsData?.data?.filter(shipment => 
      shipment.shipment_type === 'incoming' || !shipment.shipment_type
    ) || [];
  }, [shipmentsData]);

  // Create a map of PO ID to PO for quick lookup
  const poMap = useMemo(() => {
    const map = new Map();
    purchaseOrders.forEach(po => {
      map.set(po.id, po);
    });
    return map;
  }, [purchaseOrders]);

  // Filter shipments by pending and in-transit status (include both incoming and outgoing)
  const pendingInTransitShipments = useMemo(() => {
    const allShipments = shipmentsData?.data || [];
    return allShipments.filter(shipment => {
      const isPendingOrInTransit = shipment.status === 'pending' || shipment.status === 'partially-received';
      const matchesSearch = 
        shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.order_reference.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
      
      return isPendingOrInTransit && matchesSearch && matchesStatus;
    });
  }, [shipmentsData, searchTerm, statusFilter]);

  // Filter shipments by received and completed status
  const receivedCompletedShipments = useMemo(() => {
    return incomingShipments.filter(shipment => {
      const isReceivedOrCompleted = shipment.status === 'received' || shipment.status === 'inspected';
      const matchesSearch = 
        shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.order_reference.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
      
      return isReceivedOrCompleted && matchesSearch && matchesStatus;
    });
  }, [incomingShipments, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'partially-received':
        return <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 gap-1"><Package className="h-3 w-3" />Partially Received</Badge>;
      case 'received':
        return <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 gap-1"><CheckCircle className="h-3 w-3" />Received</Badge>;
      case 'inspected':
        return <Badge className="bg-gray-700/20 text-gray-300 border border-gray-600/30 gap-1"><CheckCircle className="h-3 w-3" />Inspected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewPO = (poId: string) => {
    navigate('/app/purchase-orders', { state: { focusPOId: poId } });
  };

  const handleViewShipment = (shipment: any) => {
    setSelectedShipment(shipment);
    setIsShipmentDialogOpen(true);
  };

  const toggleShipmentExpansion = (shipmentId: string) => {
    const newExpanded = new Set(expandedShipments);
    if (newExpanded.has(shipmentId)) {
      newExpanded.delete(shipmentId);
    } else {
      newExpanded.add(shipmentId);
    }
    setExpandedShipments(newExpanded);
  };

  const handleStatusUpdate = async (shipmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ status: newStatus })
        .eq('id', shipmentId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Shipment status updated to ${newStatus}`,
      });

      // Refresh both shipments and POs to reflect any status changes
      refetch();
      refetchPOs();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update shipment status",
        variant: "destructive",
      });
    }
  };

  const handleNewShipment = () => {
    setIsIncomingShipmentModalOpen(true);
  };

  const handleOutgoingShipmentModalChange = (open: boolean) => {
    setIsOutgoingShipmentModalOpen(open);
    if (!open) {
      setSelectedOrderForShipment(null);
    }
  };

  const handleOutgoingShipmentUpdate = () => {
    refetch();
    setIsOutgoingShipmentModalOpen(false);
    setSelectedOrderForShipment(null);
  };

  const renderShipmentTable = (shipments: any[]) => {
    if (shipments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Truck className="h-12 w-12 text-slate-600 opacity-30 mb-2" />
          <h3 className="text-lg font-medium text-white">No pending or in-transit shipments</h3>
          <p className="text-sm text-slate-400 mb-4">
            All shipments are up to date
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800/90">
            <TableRow className="border-slate-700">
              <TableHead className="font-medium text-slate-300 w-[50px]"></TableHead>
              <TableHead className="font-medium text-slate-300">PO Number</TableHead>
              <TableHead className="font-medium text-slate-300">Source PO</TableHead>
              <TableHead className="font-medium text-slate-300">Supplier</TableHead>
              <TableHead className="font-medium text-slate-300">Expected Arrival</TableHead>
              <TableHead className="font-medium text-slate-300">Status</TableHead>
              <TableHead className="font-medium text-slate-300">Items</TableHead>
              <TableHead className="font-medium text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => {
              const relatedPO = shipment.source_po_id ? poMap.get(shipment.source_po_id) : null;
              
              return (
                <React.Fragment key={shipment.id}>
                  <TableRow className="border-slate-700 hover:bg-slate-700/30 transition-colors">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-slate-600"
                        onClick={() => toggleShipmentExpansion(shipment.id)}
                      >
                        <ChevronRight 
                          className={`h-4 w-4 text-slate-400 transition-transform ${
                            expandedShipments.has(shipment.id) ? 'rotate-90' : ''
                          }`} 
                        />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium text-white">{shipment.order_reference || shipment.id}</TableCell>
                    <TableCell>
                      {relatedPO ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 hover:bg-gray-700/20 text-gray-300"
                            onClick={() => handleViewPO(relatedPO.id)}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            {relatedPO.po_number}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">{shipment.supplier}</TableCell>
                    <TableCell>
                      <ShipmentExpectedDateEditor
                        shipmentId={shipment.id}
                        currentDate={shipment.expected_date}
                        onDateUpdated={refetch}
                      />
                    </TableCell>
                    <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                    <TableCell>
                      <div className="text-slate-300">
                        {shipment.items?.length || 0} {(shipment.items?.length || 0) === 1 ? 'item' : 'items'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(value) => handleStatusUpdate(shipment.id, value)}>
                          <SelectTrigger className="w-auto h-8 bg-slate-700/50 border-slate-600 text-white">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="partially-received">Partially Received</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="inspected">Inspected</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-slate-600"
                          onClick={() => handleViewShipment(shipment)}
                        >
                          <Eye className="h-4 w-4 text-slate-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedShipments.has(shipment.id) && (
                    <TableRow className="border-slate-700">
                      <TableCell colSpan={8} className="p-0">
                        <div className="bg-slate-700/20 border-l-2 border-emerald-500/50 p-6 ml-6 space-y-4">
                          {/* Shipment Items */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Package className="h-4 w-4 text-emerald-400" />
                              <span className="text-sm font-medium text-white">Shipment Items</span>
                              <Badge variant="outline" className="text-xs bg-slate-600/50 text-slate-300 border-slate-500">
                                {shipment.items?.length || 0} {(shipment.items?.length || 0) === 1 ? 'item' : 'items'}
                              </Badge>
                            </div>
                            {shipment.items && shipment.items.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {shipment.items.map((item, index) => (
                                  <div 
                                    key={item.id || index} 
                                    className="bg-slate-600/30 rounded-lg p-3 border border-slate-600/50"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-white">
                                        {item.name}
                                      </span>
                                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                        Expected: {item.expected_qty}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-slate-400">SKU: {item.sku}</div>
                                    {item.received_qty && item.received_qty > 0 && (
                                      <div className="text-xs text-green-400 mt-1">
                                        Received: {item.received_qty}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-400 italic">No items specified for this shipment</div>
                            )}
                          </div>

                          {/* Related PO Details */}
                          {relatedPO && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <ShoppingCart className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-white">Source Purchase Order</span>
                              </div>
                              <div className="bg-gray-700/10 rounded-lg p-4 border border-gray-600/20">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm text-white font-medium">
                                      {relatedPO.po_number} - {relatedPO.vendor_name}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                      Total: ${relatedPO.total_amount.toFixed(2)} | Items: {relatedPO.po_items?.length || 0}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 bg-gray-700/20 border-gray-600/30 text-gray-300 hover:bg-gray-700/30"
                                    onClick={() => handleViewPO(relatedPO.id)}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    View Purchase Order
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Workflow Instructions */}
                          {shipment.status === 'pending' && (
                            <div className="bg-yellow-600/10 rounded-lg p-4 border border-yellow-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-yellow-400" />
                                <span className="text-sm font-medium text-white">Next Steps</span>
                              </div>
                              <p className="text-sm text-slate-300">
                                This shipment is awaiting arrival. Update the Expected Arrival Date as needed and change status to "Received" when the shipment arrives.
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Shipments
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Track incoming and outgoing shipments
        </p>
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incoming">Incoming Shipments</TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing Shipments</TabsTrigger>
          <TabsTrigger value="settings">Shipping Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-6">
          {/* Search and Filters */}
          <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search shipments..."
                      className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-gray-600/50 focus:ring-1 focus:ring-gray-600/30"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partially-received">Partially Received</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="inspected">Inspected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={handleNewShipment}>
                    <Plus className="h-4 w-4" />
                    Manage Shipments
                  </Button>
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending & In-Transit Shipments Collapsible Section */}
          <Collapsible open={isPendingInTransitOpen} onOpenChange={setIsPendingInTransitOpen}>
            <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700/30 transition-colors">
                  <CardTitle className="text-lg flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <div className="bg-yellow-500/20 p-1 rounded-md mr-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                      Pending & In-Transit Shipments (All)
                      <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                        {pendingInTransitShipments.length}
                      </Badge>
                    </div>
                    {isPendingInTransitOpen ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-6">
                  {renderShipmentTable(pendingInTransitShipments)}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Received & Completed Shipments Collapsible Section */}
          <Collapsible open={isReceivedCompletedOpen} onOpenChange={setIsReceivedCompletedOpen}>
            <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700/30 transition-colors">
                  <CardTitle className="text-lg flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <div className="bg-emerald-500/20 p-1 rounded-md mr-2">
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      </div>
                      Received & Completed Shipments
                      <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {receivedCompletedShipments.length}
                      </Badge>
                    </div>
                    {isReceivedCompletedOpen ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-6">
                  {renderShipmentTable(receivedCompletedShipments)}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>

        <TabsContent value="outgoing">
          <OutgoingShipments />
        </TabsContent>

        <TabsContent value="settings">
          <ShippingSettings />
        </TabsContent>
      </Tabs>

      {/* Shipment Details Dialog */}
      {selectedShipment && (
        <ShipmentDetailsDialog
          shipment={selectedShipment}
          open={isShipmentDialogOpen}
          onOpenChange={setIsShipmentDialogOpen}
          onUpdate={() => {
            refetch();
            setIsShipmentDialogOpen(false);
          }}
        />
      )}

      {/* New Shipment Modal */}
      <OutgoingShipmentModal
        order={selectedOrderForShipment}
        open={isOutgoingShipmentModalOpen}
        onOpenChange={handleOutgoingShipmentModalChange}
        onUpdate={handleOutgoingShipmentUpdate}
      />

      {/* Incoming Shipment Modal */}
      <CreateIncomingShipmentModal
        open={isIncomingShipmentModalOpen}
        onOpenChange={setIsIncomingShipmentModalOpen}
        onUpdate={() => {
          refetch();
          setIsIncomingShipmentModalOpen(false);
        }}
      />
    </div>
  );
};

export default ShipmentsPage;
