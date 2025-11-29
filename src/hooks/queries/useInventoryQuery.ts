
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  stock: number; // Changed from quantity to stock for component compatibility
  quantity: number; // Keep original for database compatibility
  unit_price: number | null;
  cost_price: number | null;
  warehouse_id: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  warehouse_sources?: Array<{
    warehouse_id: string | null;
    quantity: number;
    location: string | null;
  }>;
  batches?: Array<{
    id: string;
    batch_number: string;
    quantity: number;
    expiration_date: string | null;
    production_date: string | null;
  }>;
}

interface UseInventoryQueryProps {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
  ignoreWarehouseFilter?: boolean;
}

export const useInventoryQuery = ({ 
  page = 1, 
  limit = 50, 
  search, 
  category,
  lowStock,
  ignoreWarehouseFilter = false
}: UseInventoryQueryProps = {}) => {
  const { user } = useAuth();
  const { selectedWarehouse, companyId } = useWarehouse();
  const { employees } = useEmployees();
  const { userRoles } = useUserPermissions();

  const getEmployeeAssignedWarehouse = (): string | null => {
    if (!user || !employees.length) return null;
    
    const employee = employees.find(emp => emp.user_id_auth === user.id);
    return employee?.assigned_warehouse_id || null;
  };

  const isAdmin = userRoles.some(role => role.role === 'admin');
  const currentEmployee = employees.find(emp => emp.user_id_auth === user?.id);
  const isAssignedEmployee = currentEmployee?.assigned_warehouse_id; // Prioritize warehouse assignment over admin status

  return useQuery({
    queryKey: ['inventory', selectedWarehouse, user?.id, page, limit, search, category, lowStock, ignoreWarehouseFilter, employees.length],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');

      const assignedWarehouse = getEmployeeAssignedWarehouse();
      const warehouseFilter = isAdmin ? selectedWarehouse : assignedWarehouse;
      
      console.log('🔍 Inventory Query Debug:', {
        user: user?.id,
        userShort: user?.id?.slice(-8),
        isAdmin,
        isAssignedEmployee: !!isAssignedEmployee,
        selectedWarehouse: selectedWarehouse?.slice(-8) || 'null',
        assignedWarehouse: assignedWarehouse?.slice(-8) || 'null',
        warehouseFilter: warehouseFilter?.slice(-8) || 'null',
        employees: employees.length,
        ignoreWarehouseFilter,
        filteringStrategy: isAssignedEmployee ? 'assigned-employee' : 
                          isAdmin && selectedWarehouse ? 'admin-with-selection' :
                          isAdmin && !selectedWarehouse ? 'admin-corporate' : 'unassigned-employee'
      });

      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          category,
          quantity,
          unit_price,
          cost_price,
          case_price,
          case_cost,
          description,
          image_url,
          upc,
          asin,
          casesize,
          dimensions,
          weight,
          expiration,
          low_stock_threshold,
          location,
          warehouse_id,
          user_id,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      // Apply filtering logic based on user type
      if (isAssignedEmployee) {
        // Warehouse-assigned employees see ALL data for their assigned warehouse
        query = query.eq('warehouse_id', currentEmployee.assigned_warehouse_id);
      } else if (isAdmin && selectedWarehouse) {
        // Admin with warehouse selected - show all data for that warehouse
        query = query.eq('warehouse_id', selectedWarehouse);
      } else if (isAdmin && !selectedWarehouse && companyId) {
        // Admin with "All Warehouses" (Corporate View) - show all data for company
        query = query.eq('company_id', companyId);
      } else {
        // Unassigned employee - show only their own data
        query = query.eq('user_id', user.id);
        if (!ignoreWarehouseFilter && warehouseFilter) {
          query = query.eq('warehouse_id', warehouseFilter);
        }
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (lowStock) {
        query = query.lte('quantity', 10);
      }

      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      
      // Map the data to include stock field for backward compatibility and fix types
      let mappedData = (data || []).map(item => ({
        ...item,
        stock: item.quantity || 0, // Map quantity to stock with null safety
        quantity: item.quantity || 0, // Ensure quantity is never null
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
        expiration: item.expiration ? new Date(item.expiration) : null,
        has_batches: false, // Default value
        batches: [], // Default empty array
        warehouse_sources: undefined, // Initialize for type safety
      }));

      // Handle Corporate Overview aggregation (when admin has no warehouse selected)
      const isCorporateOverview = isAdmin && !selectedWarehouse && !ignoreWarehouseFilter;
      
      if (isCorporateOverview && mappedData.length > 0) {
        // Group products by SKU and aggregate quantities
        const productMap = new Map();
        
        mappedData.forEach(item => {
          const key = item.sku;
          if (productMap.has(key)) {
            const existing = productMap.get(key);
            // Aggregate quantities
            existing.quantity += item.quantity;
            existing.stock += item.stock;
            // Track warehouse sources
            if (!existing.warehouse_sources) {
              existing.warehouse_sources = [];
            }
            existing.warehouse_sources.push({
              warehouse_id: item.warehouse_id,
              quantity: item.quantity,
              location: item.location
            });
            // Update timestamps to latest
            if (new Date(item.updated_at) > new Date(existing.updated_at)) {
              existing.updated_at = item.updated_at;
            }
          } else {
            // First occurrence of this SKU
            const consolidatedItem = {
              ...item,
              warehouse_sources: [{
                warehouse_id: item.warehouse_id,
                quantity: item.quantity,
                location: item.location
              }],
              location: `1 warehouse`
            };
            productMap.set(key, consolidatedItem);
          }
        });
        
        mappedData = Array.from(productMap.values());
      }
      
      return {
        data: mappedData,
        count: isCorporateOverview ? mappedData.length : (count || 0),
        hasMore: isCorporateOverview ? false : (count || 0) > page * limit
      };
    },
    enabled: !!user && (
      // Admins: wait until we know companyId for corporate view
      (isAdmin && !!companyId) || 
      // Employees: wait until employee data loads
      employees.length > 0
    ),
  });
};

export const useProductBatchesQuery = (productId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['product-batches', productId],
    queryFn: async () => {
      if (!user || !productId) throw new Error('Missing user or product ID');

      const { data, error } = await supabase
        .from('product_batches')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .order('expiration_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!productId,
  });
};
