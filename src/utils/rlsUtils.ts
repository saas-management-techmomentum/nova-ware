
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
    const { data, error } = await supabase.rpc('get_user_data_scope');
    
    if (error) {
      console.error('Error fetching user data scope:', error);
      return null;
    }
    
    // Safe type conversion with validation
    if (!data || typeof data !== 'object') {
      return null;
    }
    
    const scope = data as any;
    return {
      user_id: scope.user_id || '',
      company_ids: Array.isArray(scope.company_ids) ? scope.company_ids : [],
      admin_company_ids: Array.isArray(scope.admin_company_ids) ? scope.admin_company_ids : [],
      warehouse_ids: Array.isArray(scope.warehouse_ids) ? scope.warehouse_ids : [],
      is_multi_company_admin: Boolean(scope.is_multi_company_admin),
      total_companies: Number(scope.total_companies) || 0,
      total_warehouses: Number(scope.total_warehouses) || 0
    };
  } catch (error) {
    console.error('Exception in getUserDataScope:', error);
    return null;
  }
};

// Get company metrics with access control
export const getCompanyMetrics = async (companyId: string): Promise<CompanyMetrics | null> => {
  try {
    const { data, error } = await supabase.rpc('get_company_metrics', {
      company_uuid: companyId
    });
    
    if (error) {
      console.error('Error fetching company metrics:', error);
      return null;
    }
    
    // Safe type conversion with validation
    if (!data || typeof data !== 'object') {
      return null;
    }
    
    const metrics = data as any;
    
    // Check for error in the response
    if (metrics.error) {
      return {
        company_id: companyId,
        total_products: 0,
        total_orders: 0,
        total_warehouses: 0,
        total_clients: 0,
        generated_at: new Date().toISOString(),
        error: metrics.error
      };
    }
    
    return {
      company_id: metrics.company_id || companyId,
      total_products: Number(metrics.total_products) || 0,
      total_orders: Number(metrics.total_orders) || 0,
      total_warehouses: Number(metrics.total_warehouses) || 0,
      total_clients: Number(metrics.total_clients) || 0,
      generated_at: metrics.generated_at || new Date().toISOString()
    };
  } catch (error) {
    console.error('Exception in getCompanyMetrics:', error);
    return null;
  }
};

// Test RLS policies for current user
export const testRLSPolicies = async () => {
  try {
    const { data, error } = await supabase.rpc('test_rls_policies');
    
    if (error) {
      console.error('Error testing RLS policies:', error);
      return null;
    }
    
    console.log('RLS Policy Test Results:', data);
    return data;
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
