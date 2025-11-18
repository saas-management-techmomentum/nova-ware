
import { supabase } from '@/integrations/supabase/client';

export interface AccessibleWarehouse {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  access_level: 'admin' | 'manager' | 'staff' | 'viewer';
  company_id: string;
}

export interface UserDataScope {
  user_id: string;
  company_ids: string[];
  admin_company_ids: string[];
  warehouse_ids: string[];
  is_multi_company_admin: boolean;
  total_companies: number;
  total_warehouses: number;
}

export interface CompanyMetrics {
  company_id: string;
  total_products: number;
  total_orders: number;
  total_warehouses: number;
  total_clients: number;
  generated_at: string;
  error?: string;
}

// Get accessible warehouses with RLS enforcement
export const getAccessibleWarehouses = async (): Promise<AccessibleWarehouse[]> => {
  try {
    const { data, error } = await supabase.rpc('get_accessible_warehouses');
    
    if (error) {
      console.error('Error fetching accessible warehouses:', error);
      return [];
    }
    
    // Type cast and validate the data
    const warehouses = (data || []).map((item: any) => ({
      warehouse_id: item.warehouse_id,
      warehouse_name: item.warehouse_name,
      warehouse_code: item.warehouse_code,
      access_level: item.access_level as 'admin' | 'manager' | 'staff' | 'viewer',
      company_id: item.company_id
    }));
    
    return warehouses;
  } catch (error) {
    console.error('Exception in getAccessibleWarehouses:', error);
    return [];
  }
};

// Get user's data access scope
export const getUserDataScope = async (): Promise<UserDataScope | null> => {
  try {
    // Disabled: RPC function not available
    console.warn('getUserDataScope: RPC function not available');
    return null;
  } catch (error) {
    console.error('Exception in getUserDataScope:', error);
    return null;
  }
};

// Get company metrics with access control
export const getCompanyMetrics = async (companyId: string): Promise<CompanyMetrics | null> => {
  try {
    // Disabled: RPC function not available
    console.warn('getCompanyMetrics: RPC function not available');
    return null;
  } catch (error) {
    console.error('Exception in getCompanyMetrics:', error);
    return null;
  }
};

// Test RLS policies for current user
export const testRLSPolicies = async () => {
  try {
    // Disabled: RPC function not available
    console.warn('testRLSPolicies: RPC function not available');
    return null;
  } catch (error) {
    console.error('Exception in testRLSPolicies:', error);
    return null;
  }
};

// Utility to check if user has admin access to a company
export const hasCompanyAdminAccess = async (companyId: string): Promise<boolean> => {
  try {
    const scope = await getUserDataScope();
    return scope?.admin_company_ids.includes(companyId) || false;
  } catch (error) {
    console.error('Error checking company admin access:', error);
    return false;
  }
};

// Utility to check warehouse access level
export const getWarehouseAccessLevel = async (warehouseId: string): Promise<string | null> => {
  try {
    const warehouses = await getAccessibleWarehouses();
    const warehouse = warehouses.find(w => w.warehouse_id === warehouseId);
    return warehouse?.access_level || null;
  } catch (error) {
    console.error('Error checking warehouse access level:', error);
    return null;
  }
};

/**
 * Assigns an employee to a specific warehouse
 * Note: Functions will be available once Supabase types are regenerated
 */
export const assignEmployeeToWarehouse = async (
  employeeId: string, 
  warehouseId: string
): Promise<boolean> => {
  try {
    // Use direct SQL call until types are updated
    const { data, error } = await supabase
      .rpc('assign_employee_to_warehouse' as any, {
        employee_uuid: employeeId,
        warehouse_uuid: warehouseId
      });

    if (error) {
      console.error('Error assigning employee to warehouse:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in assignEmployeeToWarehouse:', error);
    return false;
  }
};

/**
 * Gets the employee's assigned warehouse ID
 * Note: Functions will be available once Supabase types are regenerated
 */
export const getEmployeeAssignedWarehouse = async (): Promise<string | null> => {
  try {
    // Use direct SQL call until types are updated
    const { data, error } = await supabase
      .rpc('get_employee_assigned_warehouse' as any);

    if (error) {
      console.error('Error getting employee assigned warehouse:', error);
      return null;
    }

    return data as string | null;
  } catch (error) {
    console.error('Error in getEmployeeAssignedWarehouse:', error);
    return null;
  }
};
