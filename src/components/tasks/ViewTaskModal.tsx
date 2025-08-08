import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, User, Clock, CheckCircle2, XCircle, Pause } from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

interface ViewTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  getEmployeeName: (employeeId: string) => string;
}

const ViewTaskModal: React.FC<ViewTaskModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  getEmployeeName 
}) => {
  if (!task) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Pause className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
            {getStatusIcon(task.status)}
            {task.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Priority Badges */}
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(task.status)} capitalize`}
            >
              {task.status.replace('_', ' ')}
            </Badge>
            <Badge className={`${getPriorityColor(task.priority)} capitalize`}>
              {task.priority}
            </Badge>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Description</h3>
              <p className="text-slate-300 bg-slate-900/50 p-3 rounded-lg">
                {task.description}
              </p>
            </div>
          )}

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date */}
            {task.due_date && (
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Due Date</span>
                </div>
                <p className="text-white">
                  {format(new Date(task.due_date), "PPP")}
                </p>
              </div>
            )}

            {/* Assigned To */}
            <div className="bg-slate-900/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Assigned To</span>
              </div>
              <p className="text-white">
                {task.assigned_to ? getEmployeeName(task.assigned_to) : 'Unassigned'}
              </p>
            </div>

            {/* Created */}
            <div className="bg-slate-900/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Created</span>
              </div>
              <p className="text-white">
                {format(new Date(task.created_at), "PPP")}
              </p>
            </div>

            {/* Last Updated */}
            <div className="bg-slate-900/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Last Updated</span>
              </div>
              <p className="text-white">
                {format(new Date(task.updated_at), "PPP")}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTaskModal;