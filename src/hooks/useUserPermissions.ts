import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserRole {
  company_id: string;
  role: 'admin' | 'manager' | 'employee';
}

export interface WarehouseAssignment {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  role: 'admin' | 'manager' | 'employee';
}

// Type definitions for RPC function responses
interface SafeAssignResponse {
  success: boolean;
  error?: string;
  message?: string;
}

interface DataConsistencyIssue {
  issue_type: string;
  issue_count: number;
  details: string;
}

interface CompanyIsolationResult {
  validation_passed: boolean;
  issues_found: string[];
}

export const useUserPermissions = () => {
  const { user, session, isAuthReady } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [warehouseAssignments, setWarehouseAssignments] = useState<WarehouseAssignment[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCompanyIds, setUserCompanyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPermissions = async () => {
    if (!isAuthReady || !user?.id || !session?.access_token) {
      console.log('Skipping permissions fetch - auth not ready');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching permissions for user:', user.id);
      
      const { data: companyRoles, error } = await supabase
        .from('company_users')
        .select('company_id, role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching company roles:', error);
        throw error;
      }
      
      const typedCompanyRoles: UserRole[] = (companyRoles || []).map(role => ({
        company_id: role.company_id,
        role: role.role as 'admin' | 'manager' | 'employee'
      }));
      
      setUserRoles(typedCompanyRoles);
      const adminStatus = typedCompanyRoles.some(role => role.role === 'admin');
      setIsAdmin(adminStatus);
      const companyIds = typedCompanyRoles.map(role => role.company_id);
      setUserCompanyIds(companyIds);

      // Fetch warehouse assignments
      const { data: warehouseData, error: warehouseError } = await supabase
        .from('warehouse_users')
        .select(`
          warehouse_id,
          role,
          warehouses!inner (
            name,
            code,
            company_id
          )
        `)
        .eq('user_id', user.id);

      if (!warehouseError && warehouseData) {
        const filteredWarehouseData = warehouseData.filter(item => 
          companyIds.includes(item.warehouses.company_id)
        );

        const assignments = filteredWarehouseData.map(item => ({
          warehouse_id: item.warehouse_id,
          warehouse_name: item.warehouses.name,
          warehouse_code: item.warehouses.code,
          role: item.role as 'admin' | 'manager' | 'employee'
        }));

        setWarehouseAssignments(assignments);
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setUserRoles([]);
      setIsAdmin(false);
      setUserCompanyIds([]);
      setWarehouseAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const canAccessWarehouse = (warehouseId: string) => {
    return isAdmin || warehouseAssignments.some(w => w.warehouse_id === warehouseId);
  };

  const canManageWarehouse = (warehouseId: string) => {
    return isAdmin || warehouseAssignments.some(w => w.warehouse_id === warehouseId && (w.role === 'manager' || w.role === 'admin'));
  };

  const isCompanyAdmin = (companyId?: string) => {
    if (!companyId) return isAdmin;
    return userRoles.some(role => role.company_id === companyId && role.role === 'admin');
  };

  const getPrimaryCompanyId = (): string | null => {
    console.log('Getting primary company ID. User roles:', userRoles);
    
    const adminCompany = userRoles.find(role => role.role === 'admin');
    if (adminCompany) {
      console.log('Found admin company:', adminCompany.company_id);
      return adminCompany.company_id;
    }
    
    const fallbackId = userCompanyIds[0] || null;
    console.log('Using fallback company ID:', fallbackId);
    
    return fallbackId;
  };

  const validateCompanyAccess = (companyId: string): boolean => {
    return userCompanyIds.includes(companyId) && 
           userRoles.some(role => role.company_id === companyId && role.role === 'admin');
  };

  const refreshPermissions = async () => {
    console.log('Manual permissions refresh triggered');
    setLoading(true);
    await fetchUserPermissions();
  };

  // Enhanced user assignment functions with better error handling
  const assignUserToCompany = async (userId: string, companyId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('company_users')
        .insert([{
          user_id: userId,
          company_id: companyId,
          role: role
        }]);

      if (error) {
        // Handle unique constraint violations gracefully
        if (error.code === '23505') {
          throw new Error('User is already assigned to this company');
        }
        throw new Error(`Failed to assign user to company: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in assignUserToCompany:', error);
      throw error;
    }
  };

  const assignUserToWarehouse = async (userId: string, warehouseId: string, role: string) => {
    try {
      // Use the new safe assignment function with better validation
      const { data, error } = await supabase
        .rpc('safe_assign_user_to_warehouse', {
          target_user_id: userId,
          target_warehouse_id: warehouseId,
          warehouse_role: role
        });

      if (error) {
        throw new Error(`Failed to assign user to warehouse: ${error.message}`);
      }

      // Proper type assertion through unknown first
      const response = data as unknown as SafeAssignResponse;
      if (response && !response.success) {
        throw new Error(response.error || 'Assignment failed');
      }

      return response;
    } catch (error) {
      console.error('Error in assignUserToWarehouse:', error);
      throw error;
    }
  };

  // New function to audit data consistency
  const auditDataConsistency = async () => {
    try {
      const { data, error } = await supabase
        .rpc('audit_data_consistency');

      if (error) {
        console.error('Error auditing data consistency:', error);
        return null;
      }

      // Proper type assertion through unknown first
      return data as unknown as DataConsistencyIssue[];
    } catch (error) {
      console.error('Error in auditDataConsistency:', error);
      return null;
    }
  };

  // New function to validate company isolation
  const validateCompanyIsolation = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('validate_company_isolation', {
          target_company_id: companyId
        });

      if (error) {
        console.error('Error validating company isolation:', error);
        return null;
      }

      // The RPC function returns a single row, but Supabase wraps it in an array
      const resultArray = data as unknown as CompanyIsolationResult[];
      return resultArray && resultArray.length > 0 ? resultArray[0] : null;
    } catch (error) {
      console.error('Error in validateCompanyIsolation:', error);
      return null;
    }
  };

  // Enhanced function to check if user can manage time tracking with warehouse context
  const canManageTimeTracking = (warehouseId?: string): boolean => {
    // Company admins can always manage time tracking
    if (isAdmin || userRoles.some(role => role.role === 'admin' || role.role === 'manager')) {
      return true;
    }
    
    // If warehouse is specified, check warehouse-specific role
    if (warehouseId) {
      return warehouseAssignments.some(w => 
        w.warehouse_id === warehouseId && (w.role === 'manager' || w.role === 'admin')
      );
    }
    
    return false;
  };

  // Enhanced function to check if user is a regular employee with warehouse context
  const isRegularEmployee = (warehouseId?: string): boolean => {
    // If user is company admin/manager, they're not a regular employee
    if (isAdmin || userRoles.some(role => role.role === 'admin' || role.role === 'manager')) {
      return false;
    }
    
    // If warehouse is specified, check warehouse-specific role
    if (warehouseId) {
      const warehouseRole = warehouseAssignments.find(w => w.warehouse_id === warehouseId)?.role;
      return warehouseRole === 'employee';
    }
    
    // Default to checking company role
    return userRoles.every(role => role.role === 'employee');
  };

  // New function to get effective role in warehouse context
  const getEffectiveWarehouseRole = (warehouseId: string): 'admin' | 'manager' | 'employee' | null => {
    // Company admin always gets admin role
    if (isAdmin || userRoles.some(role => role.role === 'admin')) {
      return 'admin';
    }
    
    // Check warehouse-specific assignment
    const warehouseAssignment = warehouseAssignments.find(w => w.warehouse_id === warehouseId);
    if (warehouseAssignment) {
      return warehouseAssignment.role;
    }
    
    // Check if user is company manager
    if (userRoles.some(role => role.role === 'manager')) {
      return 'manager';
    }
    
    // Default to employee if user has company access
    if (userRoles.some(role => role.role === 'employee')) {
      return 'employee';
    }
    
    return null;
  };

  // New function to check if user can update a specific task's status
  // This function checks if the current user is the assignee of the task
  const canUpdateTaskStatus = (task: any, currentEmployeeId: string | null): boolean => {
    if (!task || !currentEmployeeId) return false;
    
    // User can update task status only if they are the assigned employee
    return task.assigned_to === currentEmployeeId;
  };

  useEffect(() => {
    if (isAuthReady) {
      if (user?.id && session?.access_token) {
        console.log('Auth ready with valid session, fetching permissions');
        fetchUserPermissions();
      } else {
        console.log('Auth ready but no valid session, resetting permissions');
        setUserRoles([]);
        setIsAdmin(false);
        setUserCompanyIds([]);
        setWarehouseAssignments([]);
        setLoading(false);
      }
    }
  }, [isAuthReady, user?.id, session?.access_token]);

  return {
    userRoles,
    warehouseAssignments,
    userCompanyIds,
    isAdmin,
    loading,
    canAccessWarehouse,
    canManageWarehouse,
    isCompanyAdmin,
    getPrimaryCompanyId,
    validateCompanyAccess,
    refreshPermissions,
    assignUserToCompany,
    assignUserToWarehouse,
    auditDataConsistency,
    validateCompanyIsolation,
    canManageTimeTracking,
    isRegularEmployee,
    getEffectiveWarehouseRole,
    canUpdateTaskStatus
  };
};
