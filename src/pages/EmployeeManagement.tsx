import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle,
  Percent,
  Factory,
  UserPlus,
  UserMinus,
  UserPen
} from 'lucide-react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useTasks } from '@/contexts/TasksContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import WarehouseContextIndicator from '@/components/warehouse/WarehouseContextIndicator';
import EmployeeTasksTab from '@/components/employees/EmployeeTasksTab';
import AddEmployeeDialog from '@/components/employees/AddEmployeeDialog';
import RemoveEmployeeDialog from '@/components/employees/RemoveEmployeeDialog';
import EditEmployeeDialog from '@/components/employees/EditEmployeeDialog';

const EmployeeManagement = () => {
  const { selectedWarehouse, isUserAdmin } = useWarehouse();
  const { tasks } = useTasks();
  const { employees, resendInvitation } = useEmployees();
  const { warehouseAssignments, isAdmin } = useUserPermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Check if user can manage employees (admin or manager)
  const canManageEmployees = isAdmin || warehouseAssignments.some(w => 
    w.warehouse_id === selectedWarehouse && w.role === 'manager'
  );

  // Calculate task metrics
  const taskMetrics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const overdueTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      return new Date(task.due_date) < new Date() && task.status !== 'completed';
    }).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate
    };
  }, [tasks]);

  // Show warehouse selection prompt for non-admin users without warehouse
  if (!selectedWarehouse && !isUserAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">My Tasks</h1>
        </div>
        
        <WarehouseContextIndicator />
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Factory className="h-16 w-16 mb-4 text-slate-500" />
            <p className="text-lg font-medium mb-2 text-white">Select a Warehouse</p>
            <p className="text-sm text-slate-400 text-center max-w-md">
              Please select a warehouse from the header to view and manage employees for that location.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">
            {canManageEmployees ? 'Employee Management' : 'My Tasks'}
          </h1>
          <Badge className="bg-gray-700 text-white">
            {selectedWarehouse ? 'Warehouse Scoped' : 'Corporate Overview'}
          </Badge>
        </div>
        
        {selectedWarehouse && canManageEmployees && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
            
            <Button
              onClick={() => setIsEditDialogOpen(true)}
              className="bg-gray-800 hover:bg-gray-900 text-white"
            >
              <UserPen className="h-4 w-4 mr-2" />
              Edit Employee
            </Button>
            
            <Button
              onClick={() => setIsRemoveDialogOpen(true)}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600/10"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Remove Employee
            </Button>
          </div>
        )}
      </div>

      <WarehouseContextIndicator />

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Task Metrics */}
        <Card className="bg-slate-800 border-slate-700 border-l-4 border-l-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-800/10">
                  <ClipboardList className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-slate-300 text-sm font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold text-white">{taskMetrics.totalTasks}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-slate-300 text-sm font-medium">Completed Tasks</p>
                  <p className="text-2xl font-bold text-white">{taskMetrics.completedTasks}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-slate-300 text-sm font-medium">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-white">{taskMetrics.overdueTasks}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Percent className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-slate-300 text-sm font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold text-white">{taskMetrics.completionRate}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Tasks */}
      <EmployeeTasksTab 
        canManageEmployees={canManageEmployees} 
        onResendInvitation={resendInvitation}
      />

      {/* Dialogs */}
      <AddEmployeeDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        userPermissions={{
          isAdmin: isAdmin,
          canManageEmployees: canManageEmployees
        }}
      />
      
      <EditEmployeeDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        userPermissions={{
          isAdmin: isAdmin,
          canManageEmployees: canManageEmployees
        }}
      />
      
      <RemoveEmployeeDialog 
        open={isRemoveDialogOpen} 
        onOpenChange={setIsRemoveDialogOpen} 
      />
    </div>
  );
};

export default EmployeeManagement;
