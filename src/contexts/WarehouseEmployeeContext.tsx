import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface WarehouseEmployeeContextType {
  isWarehouseEmployee: boolean;
  assignedWarehouseId: string | null;
  effectiveWarehouseId: string | null; // Warehouse to show data for
  isViewingAssignedWarehouse: boolean;
  warehouseScopedView: boolean; // True when employee should see scoped data
}

const WarehouseEmployeeContext = createContext<WarehouseEmployeeContextType>({
  isWarehouseEmployee: false,
  assignedWarehouseId: null,
  effectiveWarehouseId: null,
  isViewingAssignedWarehouse: false,
  warehouseScopedView: false,
});

export const useWarehouseEmployee = () => {
  const context = useContext(WarehouseEmployeeContext);
  if (!context) {
    throw new Error('useWarehouseEmployee must be used within a WarehouseEmployeeProvider');
  }
  return context;
};

export const WarehouseEmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const { employees } = useEmployees();
  const { isAdmin, userRoles } = useUserPermissions();
  
  const [isWarehouseEmployee, setIsWarehouseEmployee] = useState(false);
  const [assignedWarehouseId, setAssignedWarehouseId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsWarehouseEmployee(false);
      setAssignedWarehouseId(null);
      return;
    }

    console.log('🔍 WarehouseEmployee: Evaluating user:', user.id);
    console.log('📊 Current employees data:', employees);
    console.log('🏷️ User roles:', userRoles);
    console.log('👑 Is admin:', isAdmin);

    // Check if user is admin or manager - regardless of approval status
    const canManageEmployees = userRoles.some(role => 
      (role.role === 'admin' || role.role === 'manager')
      // Note: We don't check approval_status here - data access should work regardless
    );
    
    if (isAdmin || canManageEmployees) {
      console.log('🎭 User is admin/manager - not warehouse employee');
      setIsWarehouseEmployee(false);
      setAssignedWarehouseId(null);
      return;
    }

    // Find current employee record - this should work regardless of approval status
    const currentEmployee = employees.find(emp => emp.user_id_auth === user.id);
    console.log('👷 Found employee record:', currentEmployee);
    
    if (currentEmployee?.assigned_warehouse_id) {
      console.log('✅ Employee has assigned warehouse:', currentEmployee.assigned_warehouse_id);
      setIsWarehouseEmployee(true);
      setAssignedWarehouseId(currentEmployee.assigned_warehouse_id);
    } else {
      console.log('❌ No assigned warehouse found for employee');
      setIsWarehouseEmployee(false);
      setAssignedWarehouseId(null);
    }
  }, [user?.id, employees, isAdmin, userRoles]);

  // Determine effective warehouse ID for data filtering
  const effectiveWarehouseId = isWarehouseEmployee ? assignedWarehouseId : selectedWarehouse;
  
  // Check if employee is viewing their assigned warehouse
  const isViewingAssignedWarehouse = isWarehouseEmployee && selectedWarehouse === assignedWarehouseId;
  
  // Determine if scoped view should be used
  const warehouseScopedView = isWarehouseEmployee && assignedWarehouseId !== null;

  const value: WarehouseEmployeeContextType = {
    isWarehouseEmployee,
    assignedWarehouseId,
    effectiveWarehouseId,
    isViewingAssignedWarehouse,
    warehouseScopedView,
  };

  return (
    <WarehouseEmployeeContext.Provider value={value}>
      {children}
    </WarehouseEmployeeContext.Provider>
  );
};