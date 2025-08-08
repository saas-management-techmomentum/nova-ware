
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Shield, Users } from 'lucide-react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/contexts/AuthContext';

const WarehouseContextIndicator: React.FC = () => {
  const { selectedWarehouse, warehouses, isUserAdmin } = useWarehouse();
  const { employees } = useEmployees();
  const { user } = useAuth();
  
  // Get current employee assignment
  const currentEmployee = employees.find(emp => emp.user_id_auth === user?.id);
  const isAssignedEmployee = currentEmployee?.assigned_warehouse_id;

  // Show assignment status for employees
  if (isAssignedEmployee && !isUserAdmin) {
    const assignedWarehouse = warehouses.find(w => w.warehouse_id === isAssignedEmployee);
    return (
      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 border flex items-center gap-2">
          <Users className="h-3 w-3" />
          <Building2 className="h-3 w-3" />
          Assigned Warehouse: {assignedWarehouse ? `${assignedWarehouse.warehouse_code} - ${assignedWarehouse.warehouse_name}` : 'Unknown'}
        </Badge>
      </div>
    );
  }

  if (!selectedWarehouse && isUserAdmin) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-indigo-600/20 text-indigo-300 border-indigo-500/30 border flex items-center gap-2">
          <Globe className="h-3 w-3" />
          <Shield className="h-3 w-3" />
          Corporate Overview - All Warehouses
        </Badge>
      </div>
    );
  }

  if (!selectedWarehouse) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-500/30 border flex items-center gap-2">
          <Building2 className="h-3 w-3" />
          All Locations - Combined View
        </Badge>
      </div>
    );
  }

  const warehouse = warehouses.find(w => w.warehouse_id === selectedWarehouse);
  
  return (
    <div className="flex items-center gap-2 mb-4">
      <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 border flex items-center gap-2">
        <Building2 className="h-3 w-3" />
        {warehouse ? `${warehouse.warehouse_code} - ${warehouse.warehouse_name}` : 'Selected Warehouse'}
      </Badge>
      {isUserAdmin && (
        <Badge className="bg-green-600/20 text-green-300 border-green-500/30 border flex items-center gap-2">
          <Shield className="h-3 w-3" />
          Admin Access
        </Badge>
      )}
    </div>
  );
};

export default WarehouseContextIndicator;
