
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Package, 
  Send, 
  Calendar, 
  ChevronRight,
  Eye,
  ExternalLink,
  ShoppingCart,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { usePurchaseOrders, PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { useShipmentsQuery } from '@/hooks/queries/useShipmentsQuery';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const PurchaseOrdersPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { purchaseOrders, confirmPurchaseOrder, isLoading, refetch } = usePurchaseOrders();
  const shipmentsQuery = useShipmentsQuery();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set());

  // Create a map of PO ID to shipment for quick lookup
  const poToShipmentMap = useMemo(() => {
    const map = new Map();
    if (shipmentsQuery.data?.data) {
      shipmentsQuery.data.data.forEach(shipment => {
        if (shipment.source_po_id) {
          map.set(shipment.source_po_id, shipment);
        }
      });
    }
    return map;
  }, [shipmentsQuery.data]);

  // Filter purchase orders
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchesSearch = 
        po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, searchTerm, statusFilter]);

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const statusConfig = {
      draft: { 
        badge: <Badge className="bg-slate-500/20 text-slate-300 border border-slate-500/30 gap-1"><Clock className="h-3 w-3" />Draft</Badge>,
        color: 'text-slate-400'
      },
      approved: { 
        badge: <Badge className="bg-gray-700/20 text-gray-300 border border-gray-600/30 gap-1"><AlertCircle className="h-3 w-3" />Approved</Badge>,
        color: 'text-gray-400'
      },
      confirmed: { 
        badge: <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 gap-1"><CheckCircle className="h-3 w-3" />Confirmed</Badge>,
        color: 'text-emerald-400'
      },
      received: { 
        badge: <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 gap-1"><Package className="h-3 w-3" />Received</Badge>,
        color: 'text-green-400'
      },
      partially_received: { 
        badge: <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 gap-1"><Package className="h-3 w-3" />Partially Received</Badge>,
        color: 'text-orange-400'
      },
      closed: { 
        badge: <Badge className="bg-slate-600/20 text-slate-400 border border-slate-600/30 gap-1">Closed</Badge>,
        color: 'text-slate-500'
      }
    };

    return statusConfig[status] || { badge: <Badge variant="secondary">{status}</Badge>, color: 'text-slate-400' };
  };

  const getStatusWorkflowIndicator = (status: PurchaseOrder['status']) => {
    const steps = ['draft', 'approved', 'confirmed', 'received'];
    const currentIndex = steps.indexOf(status);
    
    return (
      <div className="flex items-center gap-2 text-xs">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-1">
            <div 
              className={`w-2 h-2 rounded-full ${
                index <= currentIndex ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
            <span className={`capitalize ${index <= currentIndex ? 'text-emerald-400' : 'text-slate-500'}`}>
              {step === 'draft' ? 'Draft' :
               step === 'approved' ? 'Approved' :
               step === 'confirmed' ? 'Confirmed' :
               'Received'}
            </span>
            {index < steps.length - 1 && <ChevronRight className="h-3 w-3 text-slate-600" />}
          </div>
        ))}
      </div>
    );
  };

  const handleConfirmPO = async (po: PurchaseOrder) => {
    try {
      await confirmPurchaseOrder(po);
      toast({
        title: "Purchase Order Confirmed",
        description: `PO ${po.po_number} has been confirmed and sent to incoming shipments`,
      });
      refetch();
      
      // Show success notification with navigation option
      setTimeout(() => {
        toast({
          title: "Shipment Created",
          description: "The incoming shipment has been created. Click to view in Shipments.",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/app/shipments')}
              className="gap-1"
            >
              <Truck className="h-3 w-3" />
              View Shipments
            </Button>
          ),
        });
      }, 1500);
    } catch (error) {
      console.error('Error confirming PO:', error);
      toast({
        title: "Error",
        description: "Failed to confirm purchase order",
        variant: "destructive",
      });
    }
  };

  const handleViewShipment = (shipmentId: string) => {
    navigate('/app/shipments', { state: { focusShipmentId: shipmentId } });
  };

  const togglePOExpansion = (poId: string) => {
    const newExpanded = new Set(expandedPOs);
    if (newExpanded.has(poId)) {
      newExpanded.delete(poId);
    } else {
      newExpanded.add(poId);
    }
    setExpandedPOs(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-white">Loading purchase orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Purchase Orders
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your purchase orders and track their journey to incoming shipments
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search PO number or vendor..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="partially_received">Partially Received</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-700">
          <CardTitle className="text-lg flex items-center text-white">
            <div className="bg-gray-700/20 p-1 rounded-md mr-2">
              <ShoppingCart className="h-5 w-5 text-gray-400" />
            </div>
            Purchase Orders
            <span className="ml-2 text-xs bg-gray-700/30 text-gray-200 py-0.5 px-2 rounded-full border border-gray-600/50">
              {filteredPOs.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {filteredPOs.length > 0 ? (
            <div className="rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800/90">
                  <TableRow className="border-slate-700">
                    <TableHead className="font-medium text-slate-300 w-[50px]"></TableHead>
                    <TableHead className="font-medium text-slate-300">PO Number</TableHead>
                    <TableHead className="font-medium text-slate-300">Vendor</TableHead>
                    <TableHead className="font-medium text-slate-300">Order Date</TableHead>
                    <TableHead className="font-medium text-slate-300">Expected Delivery</TableHead>
                    <TableHead className="font-medium text-slate-300">Total Amount</TableHead>
                    <TableHead className="font-medium text-slate-300">Status & Progress</TableHead>
                    <TableHead className="font-medium text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.map((po) => {
                    const relatedShipment = poToShipmentMap.get(po.id);
                    const statusConfig = getStatusBadge(po.status);
                    
                    return (
                      <React.Fragment key={po.id}>
                        <TableRow className="border-slate-700 hover:bg-slate-700/30 transition-colors">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-slate-600"
                              onClick={() => togglePOExpansion(po.id)}
                            >
                              <ChevronRight 
                                className={`h-4 w-4 text-slate-400 transition-transform ${
                                  expandedPOs.has(po.id) ? 'rotate-90' : ''
                                }`} 
                              />
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium text-white">{po.po_number}</TableCell>
                          <TableCell className="text-slate-300">{po.vendor_name}</TableCell>
                          <TableCell className="text-slate-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {new Date(po.order_date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            ${po.total_amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {statusConfig.badge}
                              {getStatusWorkflowIndicator(po.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {relatedShipment ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 h-8 bg-emerald-600/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30"
                                  onClick={() => handleViewShipment(relatedShipment.id)}
                                >
                                  <Truck className="h-4 w-4" />
                                  View Shipment
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              ) : po.status === 'approved' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 h-8 bg-gray-700/20 border-gray-600/30 text-gray-300 hover:bg-gray-700/30"
                                  onClick={() => handleConfirmPO(po)}
                                >
                                  <Send className="h-4 w-4" />
                                  Confirm & Send to Shipments
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-slate-600"
                                  >
                                    <Edit className="h-4 w-4 text-slate-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-slate-600"
                                  >
                                    <Eye className="h-4 w-4 text-slate-400" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedPOs.has(po.id) && (
                          <TableRow className="border-slate-700">
                            <TableCell colSpan={8} className="p-0">
                              <div className="bg-slate-700/20 border-l-2 border-gray-700/50 p-6 ml-6 space-y-4">
                                {/* PO Items */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Package className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium text-white">PO Items</span>
                                    <Badge variant="outline" className="text-xs bg-slate-600/50 text-slate-300 border-slate-500">
                                      {po.po_items?.length || 0} {(po.po_items?.length || 0) === 1 ? 'item' : 'items'}
                                    </Badge>
                                  </div>
                                  {po.po_items && po.po_items.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {po.po_items.map((item, index) => (
                                        <div 
                                          key={item.id || index} 
                                          className="bg-slate-600/30 rounded-lg p-3 border border-slate-600/50"
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-white">
                                              {item.item_name}
                                            </span>
                                            <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30">
                                              Qty: {item.quantity}
                                            </Badge>
                                          </div>
                                          <div className="text-xs text-slate-400">SKU: {item.item_sku}</div>
                                          <div className="text-xs text-emerald-400 mt-1">
                                            ${item.unit_price.toFixed(2)} × {item.quantity} = ${item.subtotal.toFixed(2)}
                                          </div>
                                          {item.received_quantity > 0 && (
                                            <div className="text-xs text-gray-400 mt-1">
                                              Received: {item.received_quantity}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-slate-400 italic">No items specified for this PO</div>
                                  )}
                                </div>

                                {/* Related Shipment Info */}
                                {relatedShipment && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Truck className="h-4 w-4 text-emerald-400" />
                                      <span className="text-sm font-medium text-white">Related Incoming Shipment</span>
                                    </div>
                                    <div className="bg-emerald-600/10 rounded-lg p-4 border border-emerald-500/20">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="text-sm text-white font-medium">
                                            Shipment ID: {relatedShipment.id}
                                          </div>
                                          <div className="text-xs text-slate-400">
                                            Status: {relatedShipment.status} | Expected: {new Date(relatedShipment.expected_date).toLocaleDateString()}
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="gap-2 bg-emerald-600/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30"
                                          onClick={() => handleViewShipment(relatedShipment.id)}
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                          View in Shipments
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Workflow Instructions */}
                                {po.status === 'approved' && (
                               <div className="bg-gray-700/10 rounded-lg p-4 border border-gray-600/20">
                                 <div className="flex items-center gap-2 mb-2">
                                   <AlertCircle className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm font-medium text-white">Next Step</span>
                                    </div>
                                    <p className="text-sm text-slate-300">
                                      This PO is approved and ready to be confirmed. Click "Confirm & Send to Shipments" to automatically create an incoming shipment with pending status.
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
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-slate-600 opacity-30 mb-2" />
              <h3 className="text-lg font-medium text-white">No purchase orders found</h3>
              <p className="text-sm text-slate-400 mb-4">
                Create your first purchase order to get started
              </p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Purchase Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrdersPage;
