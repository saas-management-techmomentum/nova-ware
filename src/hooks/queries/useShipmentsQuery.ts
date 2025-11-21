import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';

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
  tracking_number?: string;
  source_po_id?: string;
  source_order_id?: string;
  customer_name?: string;
  shipping_address?: string;
  shipment_type?: 'incoming' | 'outgoing';
  carrier?: string;
  shipping_method?: string;
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
  const { selectedWarehouse } = useWarehouse();
  const { employees } = useEmployees();
  const { userRoles } = useUserPermissions();

  const getEmployeeAssignedWarehouse = (): string | null => {
    if (!user || !employees.length) return null;
    
    const employee = employees.find(emp => emp.user_id_auth === user.id);
    return employee?.assigned_warehouse_id || null;
  };

  const isAdmin = userRoles.some(role => role.role === 'admin');

  return useQuery({
    queryKey: ['shipments', selectedWarehouse, user?.id, page, limit, status, search],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');

      console.log('🚚 Fetching shipments for user:', user.id);

      const assignedWarehouse = getEmployeeAssignedWarehouse();
      const currentEmployee = employees.find(emp => emp.user_id_auth === user.id);
      const isAssignedEmployee = currentEmployee?.assigned_warehouse_id; // Prioritize warehouse assignment over admin status

      console.log('🏪 Employee assignment check:', { isAssignedEmployee, assignedWarehouse: currentEmployee?.assigned_warehouse_id });

      // Query shipments with their related items and new fields
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
          source_order_id,
          customer_name,
          shipping_address,
          shipment_type,
          carrier,
          shipping_method,
          tracking_number,
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

      // Rely on RLS for company / warehouse scoping.
      // Previously we added additional client-side filters based on
      // selectedWarehouse, assigned warehouse, and admin status.
      // This caused some valid shipments to be filtered out when the
      // local warehouse selection didn’t perfectly match the row data.
      //
      // To ensure all accessible shipments are returned, we now avoid
      // adding extra filters here and let the database policies enforce
      // visibility.
      
      // NOTE: If you need stricter scoping in the future, prefer
      // adding it to the RLS policies or a dedicated RPC instead of
      // duplicating that logic in the client.

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

      console.log('📦 Raw shipment data with items:', data);
      console.log('📊 Query count:', count);

      if (error) {
        console.error('❌ Shipments query error:', error);
        throw error;
      }
      
      // Use shipment data directly - no transformation needed
      const transformedData: Shipment[] = (data || []).map((shipment: any) => {
        console.log('✅ Using shipment data directly:', shipment);
        
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
          source_order_id: shipment.source_order_id,
          customer_name: shipment.customer_name,
          shipping_address: shipment.shipping_address,
          shipment_type: shipment.shipment_type || 'incoming',
          carrier: shipment.carrier,
          shipping_method: shipment.shipping_method,
          tracking_number: shipment.tracking_number,
          items: shipment.shipment_items || [],
        };
      });
      
      console.log('🎯 Final transformed data with items:', transformedData);
      
      return {
        data: transformedData,
        count: count || 0,
        hasMore: (count || 0) > page * limit
      };
    },
    enabled: !!user,
  });
};

export const useShipmentDetailsQuery = (shipmentId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shipment-details', shipmentId],
    queryFn: async () => {
      if (!user || !shipmentId) throw new Error('Missing user or shipment ID');

      console.log('🔍 Fetching shipment details for:', shipmentId);

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
        console.error('❌ Shipment details query error:', error);
        throw error;
      }

      console.log('📋 Raw shipment details:', data);

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

      console.log('✅ Transformed shipment details:', transformedItems);
      
      return transformedItems;
    },
    enabled: !!user && !!shipmentId,
  });
};
