
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { defaultPagePermissions, PagePermissions } from '@/hooks/usePagePermissions';
import PageAccessPermissions from './PageAccessPermissions';

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPermissions: {
    isAdmin: boolean;
    canManageEmployees: boolean;
  };
}

const EditEmployeeDialog = ({ open, onOpenChange, userPermissions }: EditEmployeeDialogProps) => {
  const { employees, updateEmployee } = useEmployees();  // COMMENTED OUT: promoteEmployeeToManager, demoteManagerToEmployee, getEffectiveRole - RPC functions unavailable
  const { toast } = useToast();
  const { warehouses } = useWarehouse();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    role: 'employee',
    department: '',
    assignedWarehouseId: 'unassigned'
  });
  const [pagePermissions, setPagePermissions] = useState<PagePermissions>({ ...defaultPagePermissions });
  const [effectiveRole, setEffectiveRole] = useState<string>('employee');
  const [isLoading, setIsLoading] = useState(false);

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  // Main effect for loading employee data
  useEffect(() => {
    if (selectedEmployee) {
      console.log('Loading employee data:', selectedEmployee);
      setFormData({
        name: selectedEmployee.name || '',
        position: selectedEmployee.position || '',
        role: selectedEmployee.role || 'employee',
        department: selectedEmployee.department || '',
        assignedWarehouseId: selectedEmployee.assigned_warehouse_id || 'unassigned'
      });
      
      // Load employee's current page permissions or use defaults
      const currentPermissions = {
        ...defaultPagePermissions,
        ...(selectedEmployee.page_permissions || {})
      };
      console.log('Loading permissions:', currentPermissions);
      setPagePermissions(currentPermissions);
    }
  }, [selectedEmployee]);

  // Role management removed - RPC functions not available

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permission: keyof PagePermissions, value: boolean) => {
    console.log('Permission change received in dialog:', permission, value);
    setPagePermissions(prev => {
      const newPermissions = {
        ...prev,
        [permission]: value
      };
      console.log('Updated permissions state:', newPermissions);
      return newPermissions;
    });
  };

  const handleSubmit = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select an employee to edit",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.position) {
      toast({
        title: "Error",
        description: "Please fill in Employee Name and Position",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Saving employee with permissions:', pagePermissions);
      await updateEmployee(selectedEmployeeId, {
        name: formData.name,
        position: formData.position,
        role: formData.role,
        department: formData.department,
        assigned_warehouse_id: formData.assignedWarehouseId === 'unassigned' ? null : formData.assignedWarehouseId,
        page_permissions: pagePermissions
      });

      toast({
        title: "Success",
        description: "Employee updated successfully",
      });

      setSelectedEmployeeId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Role management functions removed - RPCs not available

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Edit Employee</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Employee Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Select Employee</h3>
            
            <div>
              <Label htmlFor="employeeSelect" className="text-slate-300">Choose Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-gray-600">
                  <SelectValue placeholder="Select an employee..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedEmployee && (
            <>
              {/* Role Management */}
              {userPermissions.isAdmin && selectedEmployee?.assigned_warehouse_id && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Role Management</h3>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Current Role: {effectiveRole}</p>
                        <p className="text-slate-400 text-sm">
                          {effectiveRole === 'manager' 
                            ? 'This employee manages the assigned warehouse' 
                            : 'This employee works in the assigned warehouse'
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {/* Role management disabled - missing RPC functions */}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeName" className="text-slate-300">Employee Name *</Label>
                    <Input
                      id="employeeName"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white focus:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position" className="text-slate-300">Position *</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white focus:border-gray-600"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department" className="text-slate-300">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-gray-600">
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="shipping">Shipping</SelectItem>
                        <SelectItem value="receiving">Receiving</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="quality">Quality Control</SelectItem>
                        <SelectItem value="administration">Administration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-slate-300">Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => handleInputChange('role', value)}
                      disabled={!userPermissions.isAdmin}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="employee">Employee</SelectItem>
                        {userPermissions.isAdmin && (
                          <SelectItem value="manager">Manager</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Warehouse Assignment */}
              {warehouses.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Warehouse Assignment</h3>
                  <div>
                    <Label htmlFor="assignedWarehouseId" className="text-slate-300">Assigned Warehouse</Label>
                    <Select value={formData.assignedWarehouseId} onValueChange={(value) => handleInputChange('assignedWarehouseId', value)}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-gray-600">
                        <SelectValue placeholder="Select warehouse..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="unassigned">No specific warehouse</SelectItem>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                            {warehouse.warehouse_name} ({warehouse.warehouse_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Page Access Permissions */}
              <div className="space-y-4">
                <PageAccessPermissions
                  permissions={pagePermissions}
                  onPermissionChange={handlePermissionChange}
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedEmployeeId || isLoading}
              className="bg-gray-700 hover:bg-gray-800 text-white disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Employee'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeDialog;
