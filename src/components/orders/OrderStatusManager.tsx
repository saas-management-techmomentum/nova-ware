import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus } from 'lucide-react';
import { useOrders } from '@/contexts/OrdersContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import SortableOrderStatus from './SortableOrderStatus';
import { OrderStatus } from '@/hooks/useOrderStatuses';

const colorOptions = [
  { value: 'bg-slate-500', label: 'Gray', class: 'bg-slate-500' },
  { value: 'bg-red-500', label: 'Red', class: 'bg-red-500' },
  { value: 'bg-orange-500', label: 'Orange', class: 'bg-orange-500' },
  { value: 'bg-amber-500/80', label: 'Amber', class: 'bg-amber-500' },
  { value: 'bg-yellow-500', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'bg-lime-500', label: 'Lime', class: 'bg-lime-500' },
  { value: 'bg-green-500', label: 'Green', class: 'bg-green-500' },
  { value: 'bg-emerald-500/80', label: 'Emerald', class: 'bg-emerald-500' },
  { value: 'bg-teal-500', label: 'Teal', class: 'bg-teal-500' },
  { value: 'bg-cyan-500', label: 'Cyan', class: 'bg-cyan-500' },
  { value: 'bg-sky-600/80', label: 'Sky', class: 'bg-sky-600' },
  { value: 'bg-blue-500', label: 'Blue', class: 'bg-blue-500' },
  { value: 'bg-indigo-500/80', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'bg-violet-500', label: 'Violet', class: 'bg-violet-500' },
  { value: 'bg-purple-500', label: 'Purple', class: 'bg-purple-500' },
  { value: 'bg-fuchsia-500', label: 'Fuchsia', class: 'bg-fuchsia-500' },
  { value: 'bg-pink-500', label: 'Pink', class: 'bg-pink-500' },
  { value: 'bg-rose-500', label: 'Rose', class: 'bg-rose-500' },
];

const OrderStatusManager = () => {
  const { orderStatuses, addOrderStatus, updateOrderStatusesOrder, deleteOrderStatus } = useOrders();
  const { user } = useAuth();
  const { selectedWarehouse, warehouses } = useWarehouse();
  
  // Get company_id from first warehouse or null
  const companyId = warehouses[0]?.company_id || null;
  
  const [isOpen, setIsOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-slate-500');
  const [activeStatus, setActiveStatus] = useState<OrderStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Separate draggable statuses from "Ready to Ship" status
  const { draggableStatuses, readyToShipStatus } = useMemo(() => {
    const sorted = [...orderStatuses].sort((a, b) => a.order_index - b.order_index);
    const readyToShip = sorted.find(status => status.name === 'Ready to Ship');
    const draggable = sorted.filter(status => status.name !== 'Ready to Ship');
    
    return {
      draggableStatuses: draggable,
      readyToShipStatus: readyToShip,
    };
  }, [orderStatuses]);

  const handleAddStatus = async () => {
    if (!newStatusName.trim() || !user || !companyId) return;

    // Find the maximum order index from draggable statuses
    const maxOrderIndex = Math.max(...draggableStatuses.map(s => s.order_index), 0);
    
    await addOrderStatus({
      name: newStatusName.trim(),
      order_index: maxOrderIndex + 1,
      color: selectedColor,
      company_id: companyId,
      warehouse_id: selectedWarehouse || undefined
    });

    setNewStatusName('');
    setSelectedColor('bg-slate-500');
  };

  const handleDeleteStatus = async (statusId: string, statusName: string) => {
    if (statusName === 'Ready to Ship') {
      // This should not happen due to database constraints, but add UI protection
      return;
    }
    await deleteOrderStatus(statusId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeStatus = draggableStatuses.find(status => status.id === active.id);
    setActiveStatus(activeStatus || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStatus(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = draggableStatuses.findIndex(status => status.id === active.id);
    const newIndex = draggableStatuses.findIndex(status => status.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedStatuses = arrayMove(draggableStatuses, oldIndex, newIndex);
    
    // Update order indices based on new positions
    const statusUpdates = reorderedStatuses.map((status, index) => ({
      id: status.id,
      order_index: index + 1, // Start from 1
    }));

    updateOrderStatusesOrder(statusUpdates);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Manage Statuses
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Order Statuses</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Status */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-sm font-medium">Add New Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status-name">Status Name</Label>
                <Input
                  id="status-name"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="Enter status name"
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded ${color.class} border-2 ${
                        selectedColor === color.value ? 'border-white' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedColor(color.value)}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={handleAddStatus} className="gap-2" disabled={!newStatusName.trim()}>
              <Plus className="h-4 w-4" />
              Add Status
            </Button>
          </div>

          {/* Existing Statuses */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Current Statuses</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={draggableStatuses.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {draggableStatuses.map((status) => (
                    <SortableOrderStatus
                      key={status.id}
                      status={status}
                      onDelete={handleDeleteStatus}
                    />
                  ))}
                </SortableContext>
                
                <DragOverlay>
                  {activeStatus ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-background shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground">#{activeStatus.order_index}</div>
                        <Badge className={`${activeStatus.color} shadow-sm`}>
                          {activeStatus.name}
                        </Badge>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Ready to Ship Status - Always Last and Not Draggable */}
              {readyToShipStatus && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {/* Empty space where grip would be */}
                    </div>
                    <div className="text-sm text-muted-foreground">#{readyToShipStatus.order_index}</div>
                    <Badge className={`${readyToShipStatus.color} shadow-sm`}>
                      {readyToShipStatus.name}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Universal Status
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderStatusManager;
