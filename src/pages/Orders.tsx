import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Package,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  Filter,
  Calendar,
  User,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Check,
  X
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useOrders } from "@/contexts/OrdersContext";
import { useWarehouseScopedOrders } from "@/hooks/useWarehouseScopedOrders";
import { useWorkflow } from "@/contexts/WorkflowContext";
import NewOrderDialog from "@/components/orders/NewOrderDialog";
import OrderStatusManager from "@/components/orders/OrderStatusManager";
import OrderActions from "@/components/orders/OrderActions";
// COMMENTED OUT: OrderWorkflowPanel component depends on order_workflows table
// import OrderWorkflowPanel from "@/components/workflow/OrderWorkflowPanel";
import CompactDocumentManagement from "@/components/orders/CompactDocumentManagement";
import WarehouseContextIndicator from "@/components/warehouse/WarehouseContextIndicator";
import EditOrderDialog from "@/components/orders/EditOrderDialog";
import { WorkflowShipmentIntegration } from "@/components/workflow/WorkflowShipmentIntegration";

const Orders = () => {
  const { orders, isLoading, refetch } = useWarehouseScopedOrders();
  const { orderStatuses, updateOrder, deleteOrder } = useOrders();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [isReadySectionCollapsed, setIsReadySectionCollapsed] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Separate orders by status
  const readyShippedStatuses = ['order-ready', 'order-shipped'];
  
  const inProgressOrders = useMemo(() => {
    return orders.filter(order => 
      !readyShippedStatuses.includes(order.status) && 
      (order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
       order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [orders, searchTerm]);

  const readyOrders = useMemo(() => {
    return orders.filter(order => 
      readyShippedStatuses.includes(order.status) &&
      (order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
       order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [orders, searchTerm]);

  const getStatusBadge = (status: string) => {
    // Map database statuses to UI statuses for display
    const statusMap: { [key: string]: string } = {
      'order-shipped': 'shipped',
      'order-ready': 'ready-to-ship',
      // Keep other statuses as-is
    };
    
    const mappedStatus = statusMap[status] || status;
    const statusConfig = orderStatuses.find(s => s.name.toLowerCase().replace(/\s+/g, '-') === mappedStatus);
    
    if (statusConfig) {
      return (
        <Badge className={`${statusConfig.color} text-white`}>
          {statusConfig.name}
        </Badge>
      );
    }

    // Fallback badges with database status mapping
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-gray-700">Processing</Badge>;
      case 'ready-to-ship':
      case 'order-ready':
        return <Badge className="bg-green-500">Ready to Ship</Badge>;
      case 'shipped':
      case 'order-shipped':
        return <Badge className="bg-emerald-500">Shipped</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-amber-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-gray-500" />;
      case 'ready-to-ship':
      case 'order-ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'shipped':
      case 'order-shipped':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-neutral-400" />;
    }
  };

  // Calculate progress based on status
  const getProgressPercentage = (status: string) => {
    // Map database statuses to UI statuses for progress calculation
    const statusMap: { [key: string]: string } = {
      'order-shipped': 'shipped',
      'order-ready': 'ready-to-ship',
      // Keep other statuses as-is
    };
    
    const mappedStatus = statusMap[status] || status;
    
    const statusProgress = {
      'pending': 25,
      'processing': 50,
      'ready-to-ship': 75,
      'shipped': 100
    };
    return statusProgress[mappedStatus as keyof typeof statusProgress] || 0;
  };


  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    await updateOrder(orderId, { status: newStatus });
    // refetch is already called in updateOrder, no need to call it again
  };

  const handleLabelsUpdate = (orderId: string, labels: any) => {
    // Handle labels update if needed
    console.log('Labels updated for order:', orderId, labels);
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrder = async (orderId: string, updates: any) => {
    await updateOrder(orderId, updates);
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Calculate order total
  const calculateOrderTotal = (items: any[]) => {
    return items.reduce((total, item) => {
      return total + (item.quantity * (item.unit_price || item.products?.unit_price || 0));
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading orders...</div>
      </div>
    );
  }

  // Helper function to render orders table
  const renderOrdersTable = (ordersList: any[]) => {
    if (ordersList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <ClipboardList className="h-12 w-12 text-neutral-600 opacity-30 mb-2" />
          <h3 className="text-lg font-medium text-white">No orders found</h3>
          <p className="text-sm text-neutral-400">
            Try adjusting your search criteria
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-900/90">
            <TableRow className="border-neutral-800">
              <TableHead className="font-medium text-neutral-300 w-[50px]"></TableHead>
              <TableHead className="font-medium text-neutral-300">Invoice #</TableHead>
              <TableHead className="font-medium text-neutral-300">Client</TableHead>
              <TableHead className="font-medium text-neutral-300">Date</TableHead>
              <TableHead className="font-medium text-neutral-300">Total</TableHead>
              <TableHead className="font-medium text-neutral-300 w-[250px]">Status</TableHead>
              <TableHead className="font-medium text-neutral-300">Progress</TableHead>
              <TableHead className="font-medium text-neutral-300">Documents</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersList.map((order) => {
              const orderTotal = calculateOrderTotal(order.items || []);
              
              return (
                <React.Fragment key={order.id}>
                  <TableRow className="border-neutral-700 hover:bg-neutral-700/30 transition-colors">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-neutral-600"
                        onClick={() => toggleOrderExpansion(order.id)}
                      >
                        <ChevronRight 
                          className={`h-4 w-4 text-neutral-400 transition-transform ${
                            expandedOrders.has(order.id) ? 'rotate-90' : ''
                          }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium text-white">{order.id}</TableCell>
                    <TableCell className="text-neutral-300">{order.customer_name}</TableCell>
                    <TableCell className="text-neutral-300">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-neutral-300 font-medium">
                      ${orderTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="w-[250px]">
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <div className="w-full flex items-center gap-2">
                        <Progress 
                          value={getProgressPercentage(order.status)} 
                          className="h-2 bg-neutral-700" 
                          indicatorClassName={getProgressPercentage(order.status) === 100 ? "bg-gradient-to-r from-emerald-500 to-sky-500" : "bg-gradient-to-r from-gray-600 to-gray-700"} 
                        />
                        <span className="text-sm text-neutral-400 w-8">{getProgressPercentage(order.status)}%</span>
                      </div>
                    </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-1">
                         {order.documents && order.documents.length > 0 ? (
                           <Badge variant="outline" className="text-xs bg-emerald-600/20 text-emerald-300 border-emerald-500/30">
                             {order.documents.length} docs
                           </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-neutral-600/20 text-neutral-400 border-neutral-500/30">
                              No docs
                            </Badge>
                          )}
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-1">
                         <OrderActions 
                           order={order}
                           onRefresh={refetch}
                         />
                       </div>
                     </TableCell>
                  </TableRow>
                  {expandedOrders.has(order.id) && (
                    <TableRow className="border-neutral-700">
                      <TableCell colSpan={9} className="p-0">
                        <div className="bg-neutral-700/20 border-l-2 border-gray-700/50 p-6 ml-6 space-y-6">
                          {/* Order Items Section */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-white">Order Items</span>
                              <Badge variant="outline" className="text-xs bg-neutral-600/50 text-neutral-300 border-neutral-500">
                                {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-emerald-600/20 text-emerald-300 border-emerald-500/30">
                                Total: ${orderTotal.toFixed(2)}
                              </Badge>
                            </div>
                            {order.items && order.items.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {order.items.map((item: any, index: number) => (
                                <div 
                                    key={index} 
                                    className="bg-neutral-600/30 rounded-lg p-3 border border-neutral-600/50 hover:border-gray-700/30 transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <span className="text-sm font-medium text-white">
                                          {item.products?.name || item.sku}
                                        </span>
                                      </div>
                                      <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30">
                                        Qty: {item.quantity}
                                      </Badge>
                                    </div>
                                    {item.products?.name && (
                                      <div className="text-xs text-neutral-400">SKU: {item.sku}</div>
                                    )}
                                    {(item.unit_price || item.products?.unit_price) && (
                                      <div className="text-xs text-emerald-400 mt-1">
                                        ${(item.unit_price || item.products?.unit_price || 0).toFixed(2)} × {item.quantity} = ${((item.unit_price || item.products?.unit_price || 0) * item.quantity).toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-neutral-400 italic">No items specified for this order</div>
                            )}
                          </div>

                          {/* Workflow panel disabled - order_workflows table not available */}
                          <div className="text-sm text-neutral-400 p-4">
                            Workflow features temporarily disabled
                          </div>
                          
                          {/* Shipment Integration */}
                          <div>
                            <WorkflowShipmentIntegration 
                              orderId={order.id} 
                              orderStatus={order.status}
                              className="mt-4"
                            />
                          </div>
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
          Order Management
        </h1>
        <div className="flex gap-2">
          <OrderStatusManager />
          <NewOrderDialog />
        </div>
      </div>

      <WarehouseContextIndicator />

      {/* Orders Section */}
      <Card className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b border-neutral-800">
          <CardTitle className="text-lg flex items-center justify-between text-white">
            <div className="flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-gray-400" />
              Order Management
              <span className="ml-2 text-xs bg-gray-800/30 text-gray-200 py-0.5 px-2 rounded-full border border-gray-700/50">
                {inProgressOrders.length + readyOrders.length} Orders
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4 py-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by invoice # or client..."
                className="pl-9 bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-gray-700/50 focus:ring-1 focus:ring-gray-700/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* In Progress Orders Section */}
          <div className="mb-6">
            <div className="text-lg font-semibold text-white mb-3 flex items-center">
              <div className="bg-gray-700/20 p-1 rounded-md mr-2">
                <ClipboardList className="h-5 w-5 text-gray-400" />
              </div>
              Orders In Progress
              <span className="ml-2 text-xs bg-gray-700/30 text-gray-200 py-0.5 px-2 rounded-full border border-gray-600/50">
                {inProgressOrders.length}
              </span>
            </div>
            {renderOrdersTable(inProgressOrders)}
          </div>

          {/* Ready Orders Section */}
          {readyOrders.length > 0 && (
            <div className="mt-8 border-t border-neutral-700 pt-6">
              <div 
                className="text-lg font-semibold text-white mb-3 flex items-center cursor-pointer"
                onClick={() => setIsReadySectionCollapsed(!isReadySectionCollapsed)}
              >
                <div className="bg-emerald-500/20 p-1 rounded-md mr-2">
                  <Check className="h-5 w-5 text-emerald-400" />
                </div>
                Ready and Shipped Orders
                <span className="ml-2 text-xs bg-emerald-500/30 text-emerald-200 py-0.5 px-2 rounded-full border border-emerald-500/50">
                  {readyOrders.length}
                </span>
                {isReadySectionCollapsed ? (
                  <ChevronDown className="ml-2 h-5 w-5 text-neutral-400" />
                ) : (
                  <ChevronUp className="ml-2 h-5 w-5 text-neutral-400" />
                )}
              </div>
              
              {!isReadySectionCollapsed && renderOrdersTable(readyOrders)}
            </div>
          )}
          
          {inProgressOrders.length === 0 && readyOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <ClipboardList className="h-12 w-12 text-neutral-600 opacity-30 mb-2" />
              <h3 className="text-lg font-medium text-white">No orders found</h3>
              <p className="text-sm text-neutral-400">
                Try adjusting your search criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditOrderDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingOrder(null);
        }}
        order={editingOrder}
        onUpdate={handleUpdateOrder}
      />
    </div>
  );
};

export default Orders;
