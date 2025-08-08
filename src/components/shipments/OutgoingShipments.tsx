
import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Truck, 
  Calendar, 
  Edit,
  Package2,
  ChevronDown,
  ChevronUp,
  Plus,
  ChevronRight,
  Package,
  FileText
} from 'lucide-react';
import { useWarehouseScopedOrders, Order } from '@/hooks/useWarehouseScopedOrders';
import { useShipmentsQuery } from '@/hooks/queries/useShipmentsQuery';
import OutgoingShipmentModal from './OutgoingShipmentModal';

interface OutgoingShipmentsProps {
  className?: string;
}

const OutgoingShipments: React.FC<OutgoingShipmentsProps> = ({ className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCarrier, setSelectedCarrier] = useState('all');
  const [selectedShipDateFrom, setSelectedShipDateFrom] = useState('');
  const [selectedShipDateTo, setSelectedShipDateTo] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);
  const [selectedShipmentForEdit, setSelectedShipmentForEdit] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addShipmentModalOpen, setAddShipmentModalOpen] = useState(false);
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set());

  const { orders, isLoading, refetch } = useWarehouseScopedOrders();

  // Get outgoing shipments instead of orders
  const shipmentsQuery = useShipmentsQuery();
  const shipmentsLoading = shipmentsQuery.isLoading;
  
  const outgoingShipments = useMemo(() => {
    // Only show outgoing shipments
    return shipmentsQuery?.data?.data?.filter(shipment => 
      shipment.shipment_type === 'outgoing'
    ) || [];
  }, [shipmentsQuery.data]);

  // Apply additional filters
  const filteredShipments = useMemo(() => {
    let filtered = outgoingShipments.filter(shipment => {
      const matchesSearch = 
        shipment.order_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shipment.customer_name && shipment.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (shipment.tracking_number && shipment.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = selectedStatus === 'all' || shipment.status === selectedStatus;
      // For outgoing shipments, carrier info might be stored differently
      
      // Date filtering on expected_date for outgoing shipments
      let matchesDateRange = true;
      if (selectedShipDateFrom && shipment.expected_date) {
        matchesDateRange = matchesDateRange && shipment.expected_date >= selectedShipDateFrom;
      }
      if (selectedShipDateTo && shipment.expected_date) {
        matchesDateRange = matchesDateRange && shipment.expected_date <= selectedShipDateTo;
      }
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });

    return filtered;
  }, [outgoingShipments, searchTerm, selectedStatus, selectedCarrier, selectedShipDateFrom, selectedShipDateTo]);

  const toggleShipmentExpansion = (shipmentId: string) => {
    const newExpanded = new Set(expandedShipments);
    if (newExpanded.has(shipmentId)) {
      newExpanded.delete(shipmentId);
    } else {
      newExpanded.add(shipmentId);
    }
    setExpandedShipments(newExpanded);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrderForEdit(order);
    setEditModalOpen(true);
  };

  const handleEditShipment = (shipment: any) => {
    setSelectedShipmentForEdit(shipment);
    setEditModalOpen(true);
  };

  const handleUpdateComplete = () => {
    shipmentsQuery.refetch();
    refetch();
    setEditModalOpen(false);
    setSelectedOrderForEdit(null);
    setSelectedShipmentForEdit(null);
  };

  const handleAddShipmentComplete = () => {
    refetch();
    setAddShipmentModalOpen(false);
  };

  const getShipmentStatusBadge = (status: string) => {
    switch (status) {
      case 'ready-to-ship':
        return <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">Ready to Ship</Badge>;
      case 'order-shipped':
      case 'Shipped':
        return <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Shipped</Badge>;
      case 'Pending':
        return <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading || shipmentsLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg text-white">Loading outgoing shipments...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-700">
          <CardTitle className="text-lg flex items-center justify-between text-white">
            <div className="flex items-center">
              <div className="bg-blue-500/20 p-1 rounded-md mr-2">
                <Package2 className="h-5 w-5 text-blue-400" />
              </div>
              Outgoing Shipments
              <span className="ml-2 text-xs bg-blue-500/30 text-blue-200 py-0.5 px-2 rounded-full border border-blue-500/50">
                {filteredShipments.length}
              </span>
            </div>
            {filteredShipments.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-slate-600"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {!isCollapsed && (
            <>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by Order ID, Customer Name, or Tracking Number..."
                      className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                    <Button 
                      className="gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => setAddShipmentModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Shipment
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="ready-to-ship">Ready to Ship</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                    <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="All Carriers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Carriers</SelectItem>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="usps">USPS</SelectItem>
                      <SelectItem value="shipstation">ShipStation</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      placeholder="Ship Date From"
                      className="w-40 bg-slate-700/50 border-slate-600 text-white"
                      value={selectedShipDateFrom}
                      onChange={(e) => setSelectedShipDateFrom(e.target.value)}
                    />
                    <span className="text-slate-400">to</span>
                    <Input
                      type="date"
                      placeholder="Ship Date To"
                      className="w-40 bg-slate-700/50 border-slate-600 text-white"
                      value={selectedShipDateTo}
                      onChange={(e) => setSelectedShipDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Shipments Table */}
              {filteredShipments.length > 0 ? (
                <div className="rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-800/90">
                      <TableRow className="border-slate-700">
                        <TableHead className="font-medium text-slate-300 w-[50px]"></TableHead>
                        <TableHead className="font-medium text-slate-300">Order ID</TableHead>
                        <TableHead className="font-medium text-slate-300">Customer Name</TableHead>
                        <TableHead className="font-medium text-slate-300">Order Date</TableHead>
                        <TableHead className="font-medium text-slate-300">Shipping Method</TableHead>
                        <TableHead className="font-medium text-slate-300">Carrier</TableHead>
                        <TableHead className="font-medium text-slate-300">Tracking Number</TableHead>
                        <TableHead className="font-medium text-slate-300">Ship Date</TableHead>
                        <TableHead className="font-medium text-slate-300">Status</TableHead>
                        <TableHead className="font-medium text-slate-300">Items</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShipments.map((shipment) => (
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
                            <TableCell className="font-medium text-white">{shipment.order_reference}</TableCell>
                            <TableCell className="text-slate-300">{shipment.customer_name || '-'}</TableCell>
                            <TableCell className="text-slate-300">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                {new Date(shipment.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {shipment.shipping_method || '-'}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {shipment.carrier || '-'}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {shipment.tracking_number || '-'}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {shipment.expected_date ? new Date(shipment.expected_date).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>{getShipmentStatusBadge(shipment.status)}</TableCell>
                            <TableCell className="text-slate-300">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-slate-400" />
                                {shipment.items?.length || 0} {(shipment.items?.length || 0) === 1 ? 'item' : 'items'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                               variant="ghost"
                               size="sm"
                               className="h-8 w-8 p-0 hover:bg-slate-600"
                               onClick={() => handleEditShipment(shipment)}
                             >
                                <Edit className="h-4 w-4 text-slate-400" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedShipments.has(shipment.id) && (
                            <TableRow className="border-slate-700">
                              <TableCell colSpan={11} className="p-0">
                                <div className="bg-slate-700/20 border-l-2 border-blue-500/50 p-6 ml-6 space-y-6">
                                  {/* Shipment Items Section */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Package className="h-4 w-4 text-blue-400" />
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
                                            className="bg-slate-600/30 rounded-lg p-3 border border-slate-600/50 hover:border-blue-500/30 transition-colors"
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                               <span className="text-sm font-medium text-white">
                                                 {item.name || item.sku}
                                               </span>
                                              </div>
                                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                                Qty: {item.expected_qty}
                                              </Badge>
                                            </div>
                                            <div className="text-xs text-slate-400">SKU: {item.sku}</div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-slate-400 italic">No items specified for this shipment</div>
                                    )}
                                  </div>

                                  {/* Shipment Details Section */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <FileText className="h-4 w-4 text-blue-400" />
                                      <span className="text-sm font-medium text-white">Shipment Details</span>
                                    </div>
                                    <div className="bg-slate-600/30 rounded-lg p-4 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Order ID:</span>
                                        <span className="text-sm text-slate-300 font-medium">{shipment.order_reference}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Created Date:</span>
                                        <span className="text-sm text-slate-300">{new Date(shipment.created_at).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Expected Ship Date:</span>
                                        <span className="text-sm text-blue-300">{new Date(shipment.expected_date).toLocaleDateString()}</span>
                                      </div>
                                      {shipment.tracking_number && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-slate-400">Tracking Number:</span>
                                          <span className="text-sm text-blue-300 font-mono">{shipment.tracking_number}</span>
                                        </div>
                                      )}
                                      {shipment.customer_name && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-slate-400">Customer:</span>
                                          <span className="text-sm text-slate-300">{shipment.customer_name}</span>
                                        </div>
                                      )}
                                      {shipment.shipping_address && (
                                        <div className="flex items-start justify-between">
                                          <span className="text-sm text-slate-400">Shipping Address:</span>
                                          <span className="text-sm text-slate-300 text-right max-w-xs">{shipment.shipping_address}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Truck className="h-12 w-12 text-slate-600 opacity-30 mb-2" />
                  <h3 className="text-lg font-medium text-white">No outgoing shipments found</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Create shipments for orders that are ready to ship
                  </p>
                  <Button 
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => setAddShipmentModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Shipment
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <OutgoingShipmentModal
        order={selectedOrderForEdit}
        shipment={selectedShipmentForEdit}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onUpdate={handleUpdateComplete}
      />

      {/* Add Shipment Modal */}
      <OutgoingShipmentModal
        order={null}
        open={addShipmentModalOpen}
        onOpenChange={setAddShipmentModalOpen}
        onUpdate={handleAddShipmentComplete}
      />
    </div>
  );
};

export default OutgoingShipments;
