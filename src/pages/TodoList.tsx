import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Clock, User, AlertCircle, CheckCircle2, XCircle, Pause } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTasks } from '@/contexts/TasksContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import WarehouseContextIndicator from '@/components/warehouse/WarehouseContextIndicator';

const TodoList = () => {
  const { tasks, isLoading, addTask, updateTask, deleteTask } = useTasks();
  const { selectedWarehouse } = useWarehouse();
  
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'general',
    due_date: undefined as Date | undefined,
    assigned_to: 'unassigned'
  });

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !selectedWarehouse) return;

    try {
      await addTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: 'pending',
        due_date: newTask.due_date?.toISOString(),
        assigned_to: newTask.assigned_to === 'unassigned' ? undefined : newTask.assigned_to,
        assigned_by: undefined,
        warehouse_id: selectedWarehouse,
        company_id: undefined
      });

      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
        due_date: undefined,
        assigned_to: 'unassigned'
      });
      setIsFormExpanded(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleCancel = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      category: 'general',
      due_date: undefined,
      assigned_to: 'unassigned'
    });
    setIsFormExpanded(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Pause className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!selectedWarehouse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Task Management</h1>
        </div>
        
        <WarehouseContextIndicator />
        
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 mb-4 text-neutral-500" />
            <p className="text-lg font-medium mb-2 text-white">Select a Warehouse</p>
            <p className="text-sm text-neutral-400 text-center max-w-md">
              Please select a warehouse from the header to view and manage tasks for that location.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Task Management</h1>
      </div>

      <WarehouseContextIndicator />

      {/* Inline Add Task Form */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardContent className="p-4">
          {!isFormExpanded ? (
            <Button 
              onClick={() => setIsFormExpanded(true)}
              className="w-full bg-gray-800 hover:bg-gray-900 justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Task
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Add New Task</h3>
              </div>
              
              <div>
                <Label htmlFor="title" className="text-white">Task Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white mt-1"
                  placeholder="Enter task title..."
                />
              </div>
              
              <div>
                <Label className="text-white">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-neutral-700 border-neutral-600 text-white mt-1",
                        !newTask.due_date && "text-neutral-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.due_date ? format(newTask.due_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-800 z-50">
                    <Calendar
                      mode="single"
                      selected={newTask.due_date}
                      onSelect={(date) => setNewTask({ ...newTask, due_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority" className="text-white">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 z-50">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category" className="text-white">Category</Label>
                  <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white mt-1">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 z-50">
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="shipping">Shipping</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="quality">Quality Control</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="assigned_to" className="text-white">Assign To</Label>
                  <Select value={newTask.assigned_to} onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white mt-1">
                      <SelectValue placeholder="Select employee..." />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 z-50">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="bg-neutral-700 border-neutral-600 text-white mt-1"
                  placeholder="Enter task description..."
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddTask} className="bg-gray-800 hover:bg-gray-900">
                  Add Task
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-white">Loading tasks...</div>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="h-16 w-16 mb-4 text-neutral-500" />
            <p className="text-lg font-medium mb-2 text-white">No Tasks Yet</p>
            <p className="text-sm text-neutral-400 text-center max-w-md">
              Create your first task to get started with task management for this warehouse.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="bg-neutral-900 border-neutral-800 hover:bg-neutral-850 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                      <Badge className={`${getPriorityColor(task.priority)} text-white capitalize`}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-neutral-300 mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-400">
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Due: {format(new Date(task.due_date), "MMM dd, yyyy")}</span>
                        </div>
                      )}
                      
                      {task.assigned_to && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Assigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Select
                      value={task.status}
                      onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'cancelled') => 
                        handleStatusChange(task.id, value)
                      }
                    >
                      <SelectTrigger className="w-32 bg-neutral-800 border-neutral-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-800">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoList;
