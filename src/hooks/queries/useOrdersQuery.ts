
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';

// Helper to check if all data is ready for querying
const isDataReady = (
  user: any,
  isAdmin: boolean,
  companyId: string | null,
  employeesLoading: boolean,
  permissionsLoading: boolean,
  employeesLength: number
): boolean => {
  if (!user || permissionsLoading) return false;
  if (isAdmin && !!companyId) return true;
  if (!employeesLoading && employeesLength > 0) return true;
  if (!employeesLoading) return true;
  return false;
};

export interface OrderItem {
  id: string;
  order_id: string;
  sku: string;
  quantity: number;
  product_id: string | null;
  unit_price: number | null;
  products?: {
    id: string;
    name: string;
    sku: string;
  } | null;
}

export interface OrderDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  warehouse_id: string | null;
  company_id: string | null;
  shipping_address: string | null;
  shipping_method: string | null;
  carrier: string | null;
  tracking_number: string | null;
  ship_date: string | null;
  shipment_status: string | null;
  items?: OrderItem[];
  documents?: OrderDocument[];
}

interface UseOrdersQueryProps {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export const useOrdersQuery = ({ 
  page = 1, 
  limit = 50, 
  status, 
  search 
}: UseOrdersQueryProps = {}) => {
  const { user } = useAuth();
  const { selectedWarehouse, companyId } = useWarehouse();
  const { employees, loading: employeesLoading } = useEmployees();
  const { userRoles, loading: permissionsLoading } = useUserPermissions();

  const getEmployeeAssignedWarehouse = (): string | null => {
    if (!user || !employees.length) return null;
    
    const employee = employees.find(emp => emp.user_id_auth === user.id);
    return employee?.assigned_warehouse_id || null;
  };

  const isAdmin = userRoles.some(role => role.role === 'admin');

  return useQuery({
    queryKey: ['orders', selectedWarehouse, user?.id, page, limit, status, search, employeesLoading, permissionsLoading],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');

      const assignedWarehouse = getEmployeeAssignedWarehouse();
      const currentEmployee = employees.find(emp => emp.user_id_auth === user.id);
      const isAssignedEmployee = currentEmployee?.assigned_warehouse_id; // Prioritize warehouse assignment over admin status

      // First fetch orders - optimized column selection
      let query = supabase
        .from('orders')
        .select('id,customer_name,status,created_at,updated_at,user_id,warehouse_id,company_id,shipping_address,shipping_method,carrier,tracking_number,ship_date,shipment_status')
        .order('created_at', { ascending: false });

      // Apply warehouse-aware filtering logic
      if (isAssignedEmployee) {
        // Assigned employee sees ALL data for their warehouse
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
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,id.ilike.%${search}%`);
      }

      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: orders, error, count } = await query;

      if (error) throw error;

      // Then fetch order items and documents for each order
      if (orders && orders.length > 0) {
        const orderIds = orders.map(order => order.id);
        
        // Fetch order items - optimized query
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('id,order_id,sku,quantity,product_id,unit_price,products(id,name,sku)')
          .in('order_id', orderIds);

        // Fetch order documents - optimized query
        const { data: orderDocuments } = await supabase
          .from('order_documents')
          .select('id,order_id,file_name,file_url,file_type,file_size,uploaded_at')
          .in('order_id', orderIds);

        // Group order items by order_id
        const itemsByOrderId = (orderItems || []).reduce((acc, item) => {
          if (!acc[item.order_id]) {
            acc[item.order_id] = [];
          }
          acc[item.order_id].push(item);
          return acc;
        }, {} as Record<string, any[]>);

        // Group order documents by order_id
        const documentsByOrderId = (orderDocuments || []).reduce((acc, doc) => {
          if (!acc[doc.order_id]) {
            acc[doc.order_id] = [];
          }
          acc[doc.order_id].push(doc);
          return acc;
        }, {} as Record<string, any[]>);

        // Add items and documents to each order (using 'items' property for consistency)
        const ordersWithItemsAndDocs: Order[] = orders.map(order => ({
          ...order,
          items: itemsByOrderId[order.id] || [],
          documents: documentsByOrderId[order.id] || []
        }));

        return {
          data: ordersWithItemsAndDocs,
          count: count || 0,
          hasMore: (count || 0) > page * limit
        };
      }
      
      return {
        data: (orders || []).map(order => ({ ...order, items: [], documents: [] })) as Order[],
        count: count || 0,
        hasMore: (count || 0) > page * limit
      };
    },
    enabled: isDataReady(user, isAdmin, companyId, employeesLoading, permissionsLoading, employees.length),
  });
};

export const useOrderDetailsQuery = (orderId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['order-details', orderId],
    queryFn: async () => {
      if (!user || !orderId) throw new Error('Missing user or order ID');

      const [itemsResult, documentsResult] = await Promise.all([
        supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId),
        supabase
          .from('order_documents')
          .select('*')
          .eq('order_id', orderId)
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (documentsResult.error) throw documentsResult.error;

      return {
        items: itemsResult.data || [],
        documents: documentsResult.data || []
      };
    },
    enabled: !!user && !!orderId,
  });
};
