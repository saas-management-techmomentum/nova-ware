import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, MoreHorizontal, FileText, Edit, Upload, Trash2, Tag, Package, Box } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { OrderDocumentUpload } from './OrderDocumentUpload';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';
import { useOrders } from '@/contexts/OrdersContext';
import { Order, OrderDocument } from '@/hooks/useWarehouseScopedOrders';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OrderActionsProps {
  order: Order;
  onRefresh?: () => void;
}

const OrderActions: React.FC<OrderActionsProps> = ({ order, onRefresh }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateOrder, deleteOrder } = useOrders();
  const { orderStatuses } = useOrderStatuses();
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);

  // Create a combined status list (custom + defaults for backward compatibility)
  const getAllStatuses = () => {
    const defaultStatuses = [
      { id: 'pending', name: 'Pending', color: 'bg-amber-500' },
      { id: 'processing', name: 'Processing', color: 'bg-blue-500' },
      { id: 'ready-to-ship', name: 'Ready to Ship', color: 'bg-green-500' },
      { id: 'shipped', name: 'Shipped', color: 'bg-emerald-500' },
      { id: 'order-ready', name: 'Order Ready', color: 'bg-emerald-500/80' },
      { id: 'order-shipped', name: 'Order Shipped', color: 'bg-sky-600/80' },
    ];

    // Always use custom statuses if available, with fallback to defaults
    if (orderStatuses.length > 0) {
      return orderStatuses.map(status => ({
        id: status.name.toLowerCase().replace(/\s+/g, '-'),
        name: status.name,
        color: status.color || 'bg-slate-500'
      }));
    }

    return defaultStatuses;
  };

  const getStatusColor = (status: string) => {
    const allStatuses = getAllStatuses();
    const statusObj = allStatuses.find(s => s.id === status || s.name.toLowerCase().replace(/\s+/g, '-') === status);
    return statusObj?.color || 'bg-slate-500';
  };

  const getStatusName = (status: string) => {
    const allStatuses = getAllStatuses();
    const statusObj = allStatuses.find(s => s.id === status || s.name.toLowerCase().replace(/\s+/g, '-') === status);
    return statusObj?.name || status;
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await updateOrder(order.id, { status: newStatus });
      setCurrentStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Order ${order.id} status updated to ${getStatusName(newStatus)}`,
      });
      setIsStatusDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCancelOrder = async () => {
    try {
      await deleteOrder(order.id);
      toast({
        title: "Order Cancelled",
        description: `Order ${order.id} has been cancelled and inventory restored`,
        variant: "destructive",
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('order_documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Error deleting document:', error);
        toast({
          title: "Error",
          description: "Failed to delete document",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Document Deleted",
        description: "Document has been removed successfully",
      });

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Exception deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const downloadDocument = (document: OrderDocument) => {
    window.open(document.file_url, '_blank');
  };

  return (
    <>
      <Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                View details
              </DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuItem onClick={() => setIsStatusDialogOpen(true)}>
              Update status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsDocumentUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload document
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={handleCancelOrder}>
              Cancel order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details - {order.id}</DialogTitle>
            <DialogDescription>
              Customer: {order.customer_name} | Created: {new Date(order.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Status</h3>
              <Badge className={getStatusColor(currentStatus)}>
                {getStatusName(currentStatus)}
              </Badge>
            </div>

            <h3 className="font-medium mb-2">Items</h3>
            <div className="border rounded-md mb-4">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">SKU</th>
                    <th className="text-right p-2">Quantity</th>
                    <th className="text-right p-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{item.sku}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">
                          {item.unit_price ? `$${item.unit_price.toFixed(2)}` : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted-foreground">
                        No items found for this order
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="font-medium mb-2">Documents</h3>
            <div className="space-y-2">
              {order.documents && order.documents.length > 0 ? (
                order.documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-sky-400" />
                      <span className="text-sm">{document.file_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(document.file_size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => downloadDocument(document)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No documents uploaded yet
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(true)}>
              Update Status
            </Button>
            <Button variant="outline" onClick={() => setIsDocumentUploadOpen(true)}>
              Upload Document
            </Button>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status for order {order.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Current Status:</h3>
                <Badge className={getStatusColor(currentStatus)}>
                  {getStatusName(currentStatus)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">
                  New Status:
                </label>
                <Select 
                  onValueChange={(value) => handleUpdateStatus(value)}
                  defaultValue={currentStatus}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select a new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllStatuses().map((status) => (
                      <SelectItem 
                        key={status.id} 
                        value={status.id}
                        disabled={status.id === currentStatus}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OrderDocumentUpload
        orderId={order.id}
        isOpen={isDocumentUploadOpen}
        onOpenChange={setIsDocumentUploadOpen}
        onDocumentUploaded={onRefresh}
      />
    </>
  );
};

export default OrderActions;