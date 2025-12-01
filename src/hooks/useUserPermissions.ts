import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRolesQuery } from '@/hooks/queries/useUserRolesQuery';
import { useWarehousesQuery } from '@/hooks/queries/useWarehousesQuery';

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
  const { user, isAuthReady } = useAuth();
  
  // Use cached React Query hooks for user roles and warehouses
  const { data: userRolesData, isLoading: rolesLoading } = useUserRolesQuery();
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehousesQuery();
  
  // Derive state from cached queries
  const userRoles = useMemo(() => {
    return (userRolesData || []).map(role => ({
      company_id: role.company_id,
      role: role.role as 'admin' | 'manager' | 'employee'
    }));
  }, [userRolesData]);
  
  const isAdmin = useMemo(() => {
    return userRoles.some(role => role.role === 'admin');
  }, [userRoles]);
  
  const userCompanyIds = useMemo(() => {
    return userRoles.map(role => role.company_id);
  }, [userRoles]);
  
  const warehouseAssignments = useMemo(() => {
    if (!warehousesData) return [];
    
    return warehousesData
      .filter(item => userCompanyIds.includes(item.company_id))
      .map(item => ({
        warehouse_id: item.warehouse_id,
        warehouse_name: item.warehouse_name,
        warehouse_code: item.warehouse_code,
        role: item.access_level as 'admin' | 'manager' | 'employee'
      }));
  }, [warehousesData, userCompanyIds]);
  
  const loading = rolesLoading || warehousesLoading;

  // Removed: fetchUserPermissions is now handled by React Query hooks

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
 
    
    const adminCompany = userRoles.find(role => role.role === 'admin');
    if (adminCompany) {

      return adminCompany.company_id;
    }
    
    const fallbackId = userCompanyIds[0] || null;

    
    return fallbackId;
  };

  const validateCompanyAccess = (companyId: string): boolean => {
    return userCompanyIds.includes(companyId) && 
           userRoles.some(role => role.company_id === companyId && role.role === 'admin');
  };

  const refreshPermissions = async () => {
    console.log('Manual permissions refresh triggered - React Query will handle cache invalidation');
    // React Query automatically handles refetching via invalidation
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

  const assignUserToWarehouse = async () => {
    console.warn('assignUserToWarehouse: RPC not available');
    return null;
  };

  const auditDataConsistency = async () => {
    console.warn('auditDataConsistency: RPC not available');
    return null;
  };

  const validateCompanyIsolation = async () => {
    console.warn('validateCompanyIsolation: RPC not available');
    return null;
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

  // Removed: useEffect is no longer needed as React Query handles data fetching

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
