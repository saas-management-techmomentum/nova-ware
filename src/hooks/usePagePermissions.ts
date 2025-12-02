
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';

export interface PagePermissions {
  // Core Pages
  dashboard: boolean;
  inventory: boolean;
  
  // Operations
  orders: boolean;
  shipments: boolean;
  locations: boolean;
  'predictive-inventory': boolean;
  
  // Management
  todos: boolean;
  clients: boolean;
  vendors: boolean;
  financial: boolean;
  
  // Advanced
  integrations: boolean;
}

export const defaultPagePermissions: PagePermissions = {
  // Core Pages - only inventory by default
  dashboard: false,
  inventory: true,
  
  // Operations - all off by default
  orders: false,
  shipments: false,
  locations: false,
  'predictive-inventory': false,
  
  // Management - todos enabled by default so employees can see assigned tasks
  todos: true,
  clients: false,
  vendors: false,
  financial: false,
  
  // Advanced - all off by default
  integrations: false,
};

export const pagePermissionCategories = {
  'Core Pages': ['dashboard', 'inventory'],
  'Operations': ['orders', 'shipments', 'locations', 'predictive-inventory'],
  'Management': ['todos', 'clients', 'vendors', 'financial'],
  'Advanced': ['integrations']
};

export const pagePermissionLabels: Record<keyof PagePermissions, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventory',
  orders: 'Order Management',
  shipments: 'Shipments',
  locations: 'Product Locations',
  'predictive-inventory': 'Predictive Inventory',
  todos: 'Employee Management',
  clients: 'Client Database',
  vendors: 'Vendor Database',
  financial: 'Financial Management',
  integrations: 'Integrations',
};

export const usePagePermissions = () => {
  const { user } = useAuth();
  const { employees, loading: employeesLoading } = useEmployees();
  const { isAdmin, userRoles, warehouseAssignments } = useUserPermissions();
  
  const canManageEmployees = userRoles.some(role => role.role === 'admin' || role.role === 'manager');

  const getCurrentUserEmployee = () => {
    if (!user?.id || employeesLoading) {
      return null;
    }

    const employee = employees.find(emp => emp.user_id_auth === user.id);
    
    return employee;
  };

  // Check if user is a warehouse employee with an assigned warehouse
  const isWarehouseEmployee = () => {
    const currentEmployee = getCurrentUserEmployee();
    const result = currentEmployee?.assigned_warehouse_id != null;
    return result;
  };

  const hasPageAccess = (page: keyof PagePermissions): boolean => {
  
    
    // Admins always have full access
    if (isAdmin) {
      return true;
    }

    // If employees are still loading, provide more permissive access to prevent flickering
    if (employeesLoading) {
      // During loading, allow access to commonly needed pages to prevent sidebar flickering
      const loadingPermissions: PagePermissions = {
        dashboard: true,
        inventory: true,
        orders: true,
        shipments: true,
        locations: true,
        'predictive-inventory': true,
        todos: canManageEmployees,
        clients: true,
        vendors: canManageEmployees,
        financial: true,
        integrations: false,
      };
      return loadingPermissions[page];
    }

    const currentEmployee = getCurrentUserEmployee();
    
    // **PRIORITY 1: Check custom page permissions first**
    if (currentEmployee?.page_permissions && typeof currentEmployee.page_permissions === 'object') {
      const customPermission = currentEmployee.page_permissions[page];
      if (customPermission !== undefined && customPermission !== null) {
     
        return customPermission;
      }
    }



    // **PRIORITY 2: Role-based defaults (only if no custom permissions exist)**
    // Managers have access to most pages by default
    if (canManageEmployees) {
      const managerDefaults: PagePermissions = {
        dashboard: true,
        inventory: true,
        orders: true,
        clients: true,
        locations: true,
        shipments: true,
        todos: true,
        financial: true,
        integrations: false,
        'predictive-inventory': true,
        vendors: true,
      };
      
    
      return managerDefaults[page];
    }

    // Warehouse employees with assigned warehouse get manager-like permissions for their warehouse
    if (isWarehouseEmployee()) {
      const warehouseEmployeeDefaults: PagePermissions = {
        dashboard: true,
        inventory: true,
        orders: true,
        clients: true,
        locations: true,
        shipments: true,
        todos: false, // Employee management only for managers/admins
        financial: true,
        integrations: false,
        'predictive-inventory': true,
        vendors: false, // Vendor management only for managers/admins
      };
      
    
      return warehouseEmployeeDefaults[page];
    }

    // **PRIORITY 3: Default fallback for employees - only inventory access**
    return defaultPagePermissions[page];
  };

  const getFilteredMenuItems = (menuItems: any[]) => {
    return menuItems.filter(item => {
      // Map routes to permission keys
      const routeMapping: Record<string, keyof PagePermissions> = {
        '/app': 'dashboard',
        '/app/': 'dashboard',
        '/app/inventory': 'inventory',
        '/app/orders': 'orders',
        '/app/clients': 'clients',
        '/app/vendors': 'vendors',
        '/app/locations': 'locations',
        '/app/shipments': 'shipments',
        '/app/todos': 'todos',
        '/app/financial': 'financial',
        '/app/integrations': 'integrations',
        '/app/predictive-inventory': 'predictive-inventory',
      };
      
      const pageKey = routeMapping[item.path];
      if (!pageKey) {
        // If route not mapped, default to allow access
        return true;
      }
      
      const hasAccess = hasPageAccess(pageKey);
      return hasAccess;
    });
  };

  return {
    hasPageAccess,
    getFilteredMenuItems,
    getCurrentUserEmployee,
    pagePermissionCategories,
    pagePermissionLabels,
    defaultPagePermissions,
    isLoading: employeesLoading, // Expose loading state
  };
};
