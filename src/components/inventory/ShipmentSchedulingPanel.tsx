
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrders } from '@/contexts/OrdersContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Truck, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Settings,
  Filter,
  Plus
} from 'lucide-react';
import { format, addDays, isAfter, isBefore, parseISO, startOfWeek, endOfWeek } from 'date-fns';

interface ShipmentSchedulingPanelProps {
  onScheduleUpdate?: () => void;
}

const ShipmentSchedulingPanel: React.FC<ShipmentSchedulingPanelProps> = ({ onScheduleUpdate }) => {
  const { shipments, updateShipment } = useOrders();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline' | 'list'>('calendar');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showRescheduling, setShowRescheduling] = useState<string | null>(null);
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('');

  // Auto-scheduling suggestions
  const getSchedulingSuggestions = () => {
    const suggestions = [];
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    // Find overdue shipments
    const overdueShipments = shipments.filter(s => 
      s.status === 'pending' && parseISO(s.expected_date) < today
    );
    
    if (overdueShipments.length > 0) {
      suggestions.push({
        type: 'overdue',
        message: `${overdueShipments.length} shipments are overdue`,
        action: 'Reschedule overdue shipments',
        severity: 'high'
      });
    }

    // Find shipments arriving soon
    const soonShipments = shipments.filter(s => 
      s.status === 'pending' && 
      isAfter(parseISO(s.expected_date), today) && 
      isBefore(parseISO(s.expected_date), nextWeek)
    );
    
    if (soonShipments.length > 0) {
      suggestions.push({
        type: 'upcoming',
        message: `${soonShipments.length} shipments arriving this week`,
        action: 'Review capacity planning',
        severity: 'medium'
      });
    }

    return suggestions;
  };

  const handleRescheduleShipment = (shipmentId: string) => {
    if (!newDeliveryDate) {
      toast({
        title: "Validation Error",
        description: "Please select a new delivery date",
        variant: "destructive",
      });
      return;
    }

    const shipment = shipments.find(s => s.id === shipmentId);
    if (shipment) {
      const updatedShipment = {
        ...shipment,
        expected_date: newDeliveryDate,
        estimatedDeliveryTime: estimatedDeliveryTime || undefined
      };
      
      updateShipment(updatedShipment);
      
      toast({
        title: "Shipment Rescheduled",
        description: `${shipmentId} has been rescheduled to ${format(parseISO(newDeliveryDate), 'PPP')}`,
      });
      
      setShowRescheduling(null);
      setNewDeliveryDate('');
      setEstimatedDeliveryTime('');
      onScheduleUpdate?.();
    }
  };

  const getFilteredShipments = () => {
    let filtered = shipments;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }
    
    if (selectedDate && viewMode === 'calendar') {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      
      filtered = filtered.filter(s => {
        const shipmentDate = parseISO(s.expected_date);
        return shipmentDate >= weekStart && shipmentDate <= weekEnd;
      });
    }
    
    return filtered;
  };

  const getShipmentsByDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shipments.filter(s => s.expected_date === dateStr);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'partially-received':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'received':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const suggestions = getSchedulingSuggestions();
  const filteredShipments = getFilteredShipments();

  return (
    <div className="space-y-6">
      {/* Scheduling Suggestions */}
      {suggestions.length > 0 && (
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center text-white">
              <Settings className="h-4 w-4 mr-2 text-indigo-400" />
              Scheduling Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={`h-4 w-4 ${
                    suggestion.severity === 'high' ? 'text-red-400' : 'text-amber-400'
                  }`} />
                  <div>
                    <p className="text-sm text-white">{suggestion.message}</p>
                    <p className="text-xs text-slate-400">{suggestion.action}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-slate-600">
                  Action
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label className="text-slate-300">View:</Label>
                <Select value={viewMode} onValueChange={(value: 'calendar' | 'timeline' | 'list') => setViewMode(value)}>
                  <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calendar">Calendar</SelectItem>
                    <SelectItem value="timeline">Timeline</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partially-received">On Route</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border border-slate-600 bg-slate-700/30 p-3 pointer-events-auto"
                  modifiers={{
                    hasShipments: (date) => getShipmentsByDate(date).length > 0
                  }}
                  modifiersStyles={{
                    hasShipments: { backgroundColor: 'rgba(99, 102, 241, 0.3)' }
                  }}
                />
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">
                  {selectedDate ? `Shipments for ${format(selectedDate, 'PPP')}` : 'Select a date'}
                </h4>
                {selectedDate && getShipmentsByDate(selectedDate).map((shipment) => (
                  <div key={shipment.id} className="p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(shipment.status)}
                        <div>
                          <p className="text-sm font-medium text-white">{shipment.id}</p>
                          <p className="text-xs text-slate-400">{shipment.supplier}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600"
                        onClick={() => setShowRescheduling(shipment.id)}
                      >
                        Reschedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="space-y-4">
              {filteredShipments
                .sort((a, b) => parseISO(a.expected_date).getTime() - parseISO(b.expected_date).getTime())
                .map((shipment, index) => {
                  const shipmentDate = parseISO(shipment.expected_date);
                  const isOverdue = shipmentDate < new Date() && shipment.status === 'pending';
                  
                  return (
                    <div key={shipment.id} className="relative">
                      {index > 0 && (
                        <div className="absolute left-4 -top-2 w-0.5 h-4 bg-slate-600"></div>
                      )}
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isOverdue ? 'bg-red-500/20 border-red-500' : 'bg-indigo-500/20 border-indigo-500'
                        } border-2`}>
                          {getStatusIcon(shipment.status)}
                        </div>
                        <div className="flex-1 p-3 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">{shipment.id}</p>
                              <p className="text-xs text-slate-400">{shipment.supplier}</p>
                              <p className="text-xs text-slate-300 mt-1">
                                {format(shipmentDate, 'PPP')}
                                {isOverdue && <span className="text-red-400 ml-2">(Overdue)</span>}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${
                                shipment.status === 'pending' ? 'bg-amber-500' :
                                shipment.status === 'partially-received' ? 'bg-blue-500' :
                                'bg-emerald-500'
                              }`}>
                                {shipment.status.replace('-', ' ')}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-600"
                                onClick={() => setShowRescheduling(shipment.id)}
                              >
                                Reschedule
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {filteredShipments.map((shipment) => {
                const shipmentDate = parseISO(shipment.expected_date);
                const isOverdue = shipmentDate < new Date() && shipment.status === 'pending';
                
                return (
                  <div key={shipment.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(shipment.status)}
                      <div>
                        <p className="text-sm font-medium text-white">{shipment.id}</p>
                        <p className="text-xs text-slate-400">{shipment.supplier}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-white">{format(shipmentDate, 'MMM dd, yyyy')}</p>
                        {isOverdue && <p className="text-xs text-red-400">Overdue</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${
                        shipment.status === 'pending' ? 'bg-amber-500' :
                        shipment.status === 'partially-received' ? 'bg-blue-500' :
                        'bg-emerald-500'
                      }`}>
                        {shipment.status.replace('-', ' ')}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600"
                        onClick={() => setShowRescheduling(shipment.id)}
                      >
                        Reschedule
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reschedule Dialog */}
      {showRescheduling && (
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Reschedule Shipment {showRescheduling}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">New Delivery Date</Label>
                <Input
                  type="date"
                  value={newDeliveryDate}
                  onChange={(e) => setNewDeliveryDate(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Estimated Time (Optional)</Label>
                <Select value={estimatedDeliveryTime} onValueChange={setEstimatedDeliveryTime}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600">
                    <SelectValue placeholder="Select time window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                    <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                    <SelectItem value="all-day">All Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRescheduling(null)}
                className="border-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRescheduleShipment(showRescheduling)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Reschedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShipmentSchedulingPanel;
