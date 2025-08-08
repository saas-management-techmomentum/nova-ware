
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { defaultPagePermissions, PagePermissions } from '@/hooks/usePagePermissions';
import PageAccessPermissions from './PageAccessPermissions';
import { Building2, MapPin } from 'lucide-react';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPermissions: {
    isAdmin: boolean;
    canManageEmployees: boolean;
  };
}

const AddEmployeeDialog = ({ open, onOpenChange, userPermissions }: AddEmployeeDialogProps) => {
  const { addEmployee } = useEmployees();
  const { toast } = useToast();
  const { warehouses, selectedWarehouse } = useWarehouse();
  const { userRoles, getPrimaryCompanyId } = useUserPermissions();
  
  // Get company name from user roles
  const primaryCompanyId = getPrimaryCompanyId();
  const companyName = userRoles.find(role => role.company_id === primaryCompanyId)?.company_id || 'Company';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    role: 'employee',
    department: '',
    assignedWarehouseId: 'unassigned',
    hourlyRate: '',
    annualSalary: '',
    payType: 'hourly',
    federalWithholding: '',
    stateWithholding: '',
    socialSecurityRate: '',
    medicareRate: '',
    healthInsuranceAmount: '',
    dentalInsuranceAmount: '',
    phone: '',
    createAccount: false
  });

  const [pagePermissions, setPagePermissions] = useState<PagePermissions>({ ...defaultPagePermissions });

  // Auto-select current warehouse when dialog opens
  useEffect(() => {
    if (open && selectedWarehouse) {
      setFormData(prev => ({
        ...prev,
        assignedWarehouseId: selectedWarehouse
      }));
    }
  }, [open, selectedWarehouse]);

  // Get current warehouse info for display
  const currentWarehouse = warehouses.find(w => w.warehouse_id === selectedWarehouse);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permission: keyof PagePermissions, value: boolean) => {
    setPagePermissions(prev => ({
      ...prev,
      [permission]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      position: '',
      role: 'employee',
      department: '',
      assignedWarehouseId: selectedWarehouse || 'unassigned',
      hourlyRate: '',
      annualSalary: '',
      payType: 'hourly',
      federalWithholding: '',
      stateWithholding: '',
      socialSecurityRate: '',
      medicareRate: '',
      healthInsuranceAmount: '',
      dentalInsuranceAmount: '',
      phone: '',
      createAccount: false
    });
    setPagePermissions({ ...defaultPagePermissions });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.position) {
      toast({
        title: "Error",
        description: "Please fill in Name, Email, and Position",
        variant: "destructive",
      });
      return;
    }

    try {
      await addEmployee({
        name: formData.name,
        email: formData.email,
        position: formData.position,
        role: formData.role,
        department: formData.department,
        assigned_warehouse_id: formData.assignedWarehouseId === 'unassigned' ? null : formData.assignedWarehouseId,
        hourly_rate: Number(formData.hourlyRate) || 0,
        annual_salary: Number(formData.annualSalary) || 0,
        pay_type: formData.payType as 'hourly' | 'salary',
        federal_withholding: Number(formData.federalWithholding) || 0,
        state_withholding: Number(formData.stateWithholding) || 0,
        social_security_rate: Number(formData.socialSecurityRate) || 0,
        medicare_rate: Number(formData.medicareRate) || 0,
        health_insurance_amount: Number(formData.healthInsuranceAmount) || 0,
        dental_insurance_amount: Number(formData.dentalInsuranceAmount) || 0,
        phone: formData.phone,
        page_permissions: pagePermissions,
        createAccount: formData.createAccount
      });

      toast({
        title: "Success",
        description: `Employee added successfully${formData.createAccount ? ' and invitation sent' : ''}`,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error", 
        description: "Failed to add employee",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Add New Employee</DialogTitle>
          
          {/* Context Information */}
          <div className="flex flex-col gap-2 mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Building2 className="h-4 w-4" />
              <span>Company:</span>
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {companyName || 'Default Company'}
              </Badge>
            </div>
            
            {currentWarehouse && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MapPin className="h-4 w-4" />
                <span>Default Warehouse:</span>
                <Badge variant="secondary" className="bg-green-600 text-white">
                  {currentWarehouse.warehouse_name} ({currentWarehouse.warehouse_code})
                </Badge>
              </div>
            )}
            
            <p className="text-xs text-slate-400 mt-2">
              Employee will be automatically assigned to the above company and warehouse.
            </p>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
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
                  className="bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-slate-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position" className="text-slate-300">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                  placeholder="Enter job position"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department" className="text-slate-300">Department</Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-blue-500">
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
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-blue-500">
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

            {/* Account Creation Toggle */}
            <div className="flex items-center space-x-2 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <Checkbox
                id="createAccount"
                checked={formData.createAccount}
                onCheckedChange={(checked) => handleInputChange('createAccount', !!checked)}
                className="border-slate-600"
              />
              <Label htmlFor="createAccount" className="text-slate-300 font-medium">
                Create User Account & Send Login Invitation
              </Label>
            </div>
            {formData.createAccount && (
              <p className="text-sm text-slate-400 ml-6">
                This will create a login account and send an email with login credentials to quantrawms.com/auth.
              </p>
            )}
          </div>

          {/* Warehouse Assignment */}
          {warehouses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Warehouse Assignment</h3>
              <div>
                <Label htmlFor="assignedWarehouseId" className="text-slate-300">Assigned Warehouse</Label>
                <Select value={formData.assignedWarehouseId} onValueChange={(value) => handleInputChange('assignedWarehouseId', value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-blue-500">
                    <SelectValue placeholder="Select warehouse..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="unassigned">No specific warehouse</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                        {warehouse.warehouse_name} ({warehouse.warehouse_code})
                        {warehouse.warehouse_id === selectedWarehouse && (
                          <Badge className="ml-2 bg-blue-600 text-white text-xs">Current</Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Payroll Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Payroll Information</h3>
            
            <div>
              <Label htmlFor="payType" className="text-slate-300">Pay Type</Label>
              <Select value={formData.payType} onValueChange={(value) => handleInputChange('payType', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {formData.payType === 'hourly' ? (
                <div>
                  <Label htmlFor="hourlyRate" className="text-slate-300">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="annualSalary" className="text-slate-300">Annual Salary ($)</Label>
                  <Input
                    id="annualSalary"
                    type="number"
                    step="0.01"
                    value={formData.annualSalary}
                    onChange={(e) => handleInputChange('annualSalary', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {/* Tax Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="federalWithholding" className="text-slate-300">Federal Withholding (%)</Label>
                <Input
                  id="federalWithholding"
                  type="number"
                  step="0.01"
                  value={formData.federalWithholding}
                  onChange={(e) => handleInputChange('federalWithholding', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="stateWithholding" className="text-slate-300">State Withholding (%)</Label>
                <Input
                  id="stateWithholding"
                  type="number"
                  step="0.01"
                  value={formData.stateWithholding}
                  onChange={(e) => handleInputChange('stateWithholding', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Insurance Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="healthInsuranceAmount" className="text-slate-300">Health Insurance ($)</Label>
                <Input
                  id="healthInsuranceAmount"
                  type="number"
                  step="0.01"
                  value={formData.healthInsuranceAmount}
                  onChange={(e) => handleInputChange('healthInsuranceAmount', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="dentalInsuranceAmount" className="text-slate-300">Dental Insurance ($)</Label>
                <Input
                  id="dentalInsuranceAmount"
                  type="number"
                  step="0.01"
                  value={formData.dentalInsuranceAmount}
                  onChange={(e) => handleInputChange('dentalInsuranceAmount', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Page Access Permissions */}
          <PageAccessPermissions
            permissions={pagePermissions}
            onPermissionChange={handlePermissionChange}
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Add Employee
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
