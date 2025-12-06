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
  // Must have user and permissions loaded
  if (!user || permissionsLoading) return false;
  
  // Admins need companyId for corporate view
  if (isAdmin && !!companyId) return true;
  
  // Non-admins need employees to be loaded
  if (!employeesLoading && employeesLength > 0) return true;
  
  // If employees finished loading but empty, allow query (fallback to user_id filter)
  if (!employeesLoading) return true;
  
  return false;
};

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  sku: string;
  name: string;
  expected_qty: number;
  received_qty?: number;
  damaged_qty?: number;
  notes?: string;
}

export interface Shipment {
  id: string;
  supplier: string;
  order_reference: string;
  expected_date: string;
  received_date?: string;
  status: 'pending' | 'partially-received' | 'received' | 'inspected';
  user_id: string;
  warehouse_id?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
  source_po_id?: string;
  shipment_type?: 'incoming' | 'outgoing';
  items: ShipmentItem[];
}

interface UseShipmentsQueryProps {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

const mapOrderStatusToShipmentStatus = (status: string): 'pending' | 'partially-received' | 'received' | 'inspected' => {
  if (!status) return 'pending';
  
  switch (status.toLowerCase()) {
    case 'shipped':
    case 'in-transit':
    case 'pending':
      return 'pending';
    case 'partially-received':
      return 'partially-received';
    case 'delivered':
    case 'completed':
    case 'received':
      return 'received';
    case 'inspected':
      return 'inspected';
    default:
      return 'pending';
  }
};

export const useShipmentsQuery = ({ 
  page = 1, 
  limit = 50, 
  status, 
  search 
}: UseShipmentsQueryProps = {}) => {
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
    queryKey: ['shipments', selectedWarehouse, user?.id, page, limit, status, search, employeesLoading, permissionsLoading],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');


      const assignedWarehouse = getEmployeeAssignedWarehouse();
      const currentEmployee = employees.find(emp => emp.user_id_auth === user.id);
      const isAssignedEmployee = currentEmployee?.assigned_warehouse_id; // Prioritize warehouse assignment over admin status

      // Query shipments with their related items
      let query = supabase
        .from('shipments')
        .select(`
          id, 
          supplier, 
          order_reference, 
          expected_date, 
          received_date, 
          status, 
          created_at, 
          updated_at, 
          user_id, 
          warehouse_id, 
          company_id,
          source_po_id,
          shipment_type,
          shipment_items(
            id,
            sku,
            name,
            expected_qty,
            received_qty,
            damaged_qty,
            notes
          )
        `)
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
        query = query.or(`supplier.ilike.%${search}%,order_reference.ilike.%${search}%,id.ilike.%${search}%`);
      }

      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;



      if (error) {

        throw error;
      }
      
      // Use shipment data directly - no transformation needed
      const transformedData: Shipment[] = (data || []).map((shipment: any) => {

        
        return {
          id: shipment.id,
          supplier: shipment.supplier,
          order_reference: shipment.order_reference,
          expected_date: shipment.expected_date,
          received_date: shipment.received_date,
          status: shipment.status,
          user_id: shipment.user_id,
          warehouse_id: shipment.warehouse_id,
          company_id: shipment.company_id,
          created_at: shipment.created_at,
          updated_at: shipment.updated_at,
          source_po_id: shipment.source_po_id,
          shipment_type: shipment.shipment_type || 'incoming',
          items: shipment.shipment_items || [],
        };
      });
      
 
      return {
        data: transformedData,
        count: count || 0,
        hasMore: (count || 0) > page * limit
      };
    },
    enabled: isDataReady(user, isAdmin, companyId, employeesLoading, permissionsLoading, employees.length),
  });
};

export const useShipmentDetailsQuery = (shipmentId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shipment-details', shipmentId],
    queryFn: async () => {
      if (!user || !shipmentId) throw new Error('Missing user or shipment ID');



      const { data, error } = await supabase
        .from('shipment_items')
        .select(`
          id,
          sku,
          name,
          expected_qty,
          received_qty,
          damaged_qty,
          notes
        `)
        .eq('shipment_id', shipmentId);

      if (error) {
        throw error;
      }



      // Use shipment item data directly
      const transformedItems: ShipmentItem[] = (data || []).map((item: any) => ({
        id: item.id,
        shipment_id: shipmentId,
        sku: item.sku,
        name: item.name,
        expected_qty: item.expected_qty,
        received_qty: item.received_qty,
        damaged_qty: item.damaged_qty,
        notes: item.notes,
      }));
      
      return transformedItems;
    },
    enabled: !!user && !!shipmentId,
  });
};
