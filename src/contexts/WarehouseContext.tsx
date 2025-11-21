
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { getAccessibleWarehouses, type AccessibleWarehouse } from '@/utils/rlsUtils';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  manager_id?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  company_id?: string;
}

export interface UserWarehouse {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  user_role: string;
  is_manager: boolean;
  access_level: string;
  company_id: string;
}

interface WarehouseContextType {
  warehouses: UserWarehouse[];
  selectedWarehouse: string | null;
  setSelectedWarehouse: (warehouseId: string | null) => void;
  isLoading: boolean;
  canViewAllWarehouses: boolean;
  refreshWarehouses: () => Promise<void>;
  isUserAdmin: boolean;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};

interface WarehouseProviderProps {
  children: ReactNode;
}

// Storage functions for persistence
const WAREHOUSE_STORAGE_KEY = 'selectedWarehouse';

const saveWarehouseSelection = (warehouseId: string | null) => {
  try {
    if (warehouseId) {
      localStorage.setItem(WAREHOUSE_STORAGE_KEY, warehouseId);
    } else {
      localStorage.removeItem(WAREHOUSE_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to save warehouse selection to localStorage:', error);
  }
};

const loadWarehouseSelection = (): string | null => {
  try {
    return localStorage.getItem(WAREHOUSE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to load warehouse selection from localStorage:', error);
    return null;
  }
};

const clearWarehouseSelection = () => {
  try {
    localStorage.removeItem(WAREHOUSE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear warehouse selection from localStorage:', error);
  }
};

export const WarehouseProvider: React.FC<WarehouseProviderProps> = ({ children }) => {
  const [warehouses, setWarehouses] = useState<UserWarehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouseState] = useState<string | null>(() => {
    // Initialize with persisted selection on mount
    const persisted = loadWarehouseSelection();
    console.log('🚀 Initial load - persisted selection:', persisted);
    return persisted;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [canViewAllWarehouses, setCanViewAllWarehouses] = useState(false);
  const { user } = useAuth();
  const { isAdmin, loading: permissionsLoading } = useUserPermissions();

  // Enhanced setSelectedWarehouse with persistence
  const setSelectedWarehouse = (warehouseId: string | null) => {
    console.log('🔄 Setting warehouse selection:', warehouseId);
    setSelectedWarehouseState(warehouseId);
    saveWarehouseSelection(warehouseId);
    console.log('💾 Warehouse selection saved to localStorage');
  };

  const fetchUserWarehouses = async () => {
    if (!user || permissionsLoading) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('🏭 Fetching user warehouses for user:', user.id, 'isAdmin:', isAdmin);

      // Check if user is an employee with an assigned warehouse
      let assignedWarehouseId = user.user_metadata?.['warehouse_id'];
      
      // If not in metadata, check the employees table
      if (!assignedWarehouseId) {
        try {
          const { data: employeeData } = await supabase
            .from('employees')
            .select('assigned_warehouse_id')
            .eq('user_id_auth', user.id)
            .single();
          
          assignedWarehouseId = employeeData?.assigned_warehouse_id;
          console.log('🎯 Employee assigned warehouse from employees table:', assignedWarehouseId);
        } catch (error) {
          console.log('No employee record found for user:', user.id);
        }
      } else {
        console.log('🎯 Employee assigned warehouse from metadata:', assignedWarehouseId);
      }

      // Use the new RLS-enforced function
      const accessibleWarehouses = await getAccessibleWarehouses();
      
      const typedData = accessibleWarehouses.map(item => ({
        warehouse_id: item.warehouse_id,
        warehouse_name: item.warehouse_name,
        warehouse_code: item.warehouse_code,
        user_role: item.access_level,
        is_manager: ['admin', 'manager'].includes(item.access_level),
        access_level: item.access_level,
        company_id: item.company_id
      }));

      console.log('📦 Accessible warehouses loaded:', typedData);
      setWarehouses(typedData);
      
      // Set permissions based on user role
      const hasAdminAccess = isAdmin;
      const hasMultipleWarehouses = typedData.length > 1;
      setCanViewAllWarehouses(hasAdminAccess || hasMultipleWarehouses);
      
      // Check for persisted selection first
      const persistedSelection = loadWarehouseSelection();
      console.log('💾 Loaded persisted selection:', persistedSelection);
      
      let shouldUsePersistedSelection = false;
      
      if (persistedSelection) {
        // Validate that the persisted warehouse is still accessible
        const isValidSelection = typedData.some(warehouse => warehouse.warehouse_id === persistedSelection);
        console.log('✅ Persisted selection valid:', isValidSelection);
        
        if (isValidSelection) {
          console.log('🎯 Using persisted selection:', persistedSelection);
          setSelectedWarehouseState(persistedSelection);
          shouldUsePersistedSelection = true;
        } else {
          console.log('❌ Clearing invalid persisted selection');
          clearWarehouseSelection();
        }
      }
      
      // Apply warehouse selection logic based on user role
      if (!shouldUsePersistedSelection) {
        console.log('🤖 Applying role-based warehouse selection...');
        
        if (hasAdminAccess) {
          console.log('👑 Admin user: setting to Corporate Overview');
          setSelectedWarehouse(null); // Corporate overview for admins
        } else if (assignedWarehouseId && typedData.some(w => w.warehouse_id === assignedWarehouseId)) {
          // Force employees to their assigned warehouse
          console.log('👷 Employee forced to assigned warehouse:', assignedWarehouseId);
          setSelectedWarehouse(assignedWarehouseId);
        } else if (typedData.length === 1) {
          // Single warehouse access
          console.log('🏠 Single warehouse: auto-selecting');
          setSelectedWarehouse(typedData[0].warehouse_id);
        } else if (typedData.length > 0) {
          // Fallback to first available warehouse
          console.log('🏢 Multiple warehouses: selecting first available');
          setSelectedWarehouse(typedData[0].warehouse_id);
        }
      } else {
        console.log('✨ Skipping smart defaults - using persisted selection');
      }
      
    } catch (error) {
      console.error('Error in fetchUserWarehouses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWarehouses = async () => {
    console.log('Refreshing warehouses with RLS enforcement...');
    setIsLoading(true);
    await fetchUserWarehouses();
  };

  useEffect(() => {
    if (!permissionsLoading) {
      fetchUserWarehouses();
    }
  }, [user, isAdmin, permissionsLoading]);

  const value = {
    warehouses,
    selectedWarehouse,
    setSelectedWarehouse,
    isLoading: isLoading || permissionsLoading,
    canViewAllWarehouses,
    refreshWarehouses,
    isUserAdmin: isAdmin
  };

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  );
};
