
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useWarehousesQuery } from '@/hooks/queries/useWarehousesQuery';
import { useCurrentEmployeeQuery } from '@/hooks/queries/useCurrentEmployeeQuery';
import { useUserRolesQuery } from '@/hooks/queries/useUserRolesQuery';

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
  const { user } = useAuth();
  
  // Use cached React Query hooks for faster loading
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehousesQuery();
  const { data: currentEmployee, isLoading: employeeLoading } = useCurrentEmployeeQuery();
  const { data: userRolesData, isLoading: rolesLoading } = useUserRolesQuery();
  
  const [selectedWarehouse, setSelectedWarehouseState] = useState<string | null>(() => {
    // Initialize with persisted selection on mount
    const persisted = loadWarehouseSelection();
    console.log('🚀 Initial load - persisted selection:', persisted);
    return persisted;
  });
  
  // Derive isAdmin from cached user roles data
  const isAdmin = useMemo(() => {
    return userRolesData?.some(role => role.role === 'admin') || false;
  }, [userRolesData]);
  
  // Transform warehouses data from cached query
  const warehouses = useMemo(() => {
    if (!warehousesData) return [];
    
    return warehousesData.map(item => ({
      warehouse_id: item.warehouse_id,
      warehouse_name: item.warehouse_name,
      warehouse_code: item.warehouse_code,
      user_role: item.access_level,
      is_manager: ['admin', 'manager'].includes(item.access_level),
      access_level: item.access_level,
      company_id: item.company_id
    }));
  }, [warehousesData]);
  
  // Determine if user can view all warehouses
  const canViewAllWarehouses = useMemo(() => {
    return isAdmin || warehouses.length > 1;
  }, [isAdmin, warehouses.length]);
  
  const isLoading = warehousesLoading || employeeLoading || rolesLoading;

  // Enhanced setSelectedWarehouse with persistence
  const setSelectedWarehouse = (warehouseId: string | null) => {
    console.log('🔄 Setting warehouse selection:', warehouseId);
    setSelectedWarehouseState(warehouseId);
    saveWarehouseSelection(warehouseId);
    console.log('💾 Warehouse selection saved to localStorage');
  };

  // Handle warehouse selection logic when data changes
  useEffect(() => {
    if (warehousesLoading || !warehouses.length) return;

    console.log('🏭 Processing warehouse selection logic');
    
    const assignedWarehouseId = currentEmployee?.assigned_warehouse_id;
    
    // Check for persisted selection first
    const persistedSelection = loadWarehouseSelection();
    console.log('💾 Loaded persisted selection:', persistedSelection);
    
    let shouldUsePersistedSelection = false;
    
    if (persistedSelection) {
      // Validate that the persisted warehouse is still accessible
      const isValidSelection = warehouses.some(warehouse => warehouse.warehouse_id === persistedSelection);
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
      
      if (isAdmin) {
        console.log('👑 Admin user: setting to Corporate Overview');
        setSelectedWarehouse(null); // Corporate overview for admins
      } else if (assignedWarehouseId && warehouses.some(w => w.warehouse_id === assignedWarehouseId)) {
        // Force employees to their assigned warehouse
        console.log('👷 Employee forced to assigned warehouse:', assignedWarehouseId);
        setSelectedWarehouse(assignedWarehouseId);
      } else if (warehouses.length === 1) {
        // Single warehouse access
        console.log('🏠 Single warehouse: auto-selecting');
        setSelectedWarehouse(warehouses[0].warehouse_id);
      } else if (warehouses.length > 0) {
        // Fallback to first available warehouse
        console.log('🏢 Multiple warehouses: selecting first available');
        setSelectedWarehouse(warehouses[0].warehouse_id);
      }
    } else {
      console.log('✨ Skipping smart defaults - using persisted selection');
    }
  }, [warehousesData, currentEmployee, isAdmin, warehousesLoading]);

  const refreshWarehouses = async () => {
    console.log('Refreshing warehouses - React Query will handle cache invalidation');
    // React Query automatically handles refetching via invalidation
  };

  const value = {
    warehouses,
    selectedWarehouse,
    setSelectedWarehouse,
    isLoading,
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
