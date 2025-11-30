
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useEmployees } from '@/hooks/useEmployees';

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  upc: string;
  quantity: number;
  currentStock: number;
  minThreshold: number;
  reorder_point?: number;
  category?: string;
  image_url?: string;
  warehouse_id?: string;
  restockDate: string;
  restockQuantity: number;
  lastRestockDate?: string;
  avgWeeklyUsage?: number;
  estimatedStockoutDays?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface IncomingShipment {
  id: string;
  supplier: string;
  expected_date: string;
  items: {
    sku: string;
    name: string;
    expected_qty: number;
  }[];
}

export const useLowStockItems = () => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [incomingShipments, setIncomingShipments] = useState<IncomingShipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const { employees } = useEmployees();

  useEffect(() => {
    const fetchLowStockItems = async () => {
      if (!user || employees.length === 0) return; // Wait for employees to load

      setIsLoading(true);
      try {
        
        // Get employee info to check for warehouse assignment
        const { data: employees } = await supabase
          .from('employees')
          .select('assigned_warehouse_id')
          .eq('user_id_auth', user.id)
          .maybeSingle();

        const { data: userRoles } = await supabase
          .from('company_users')
          .select('role')
          .eq('user_id', user.id);

        const isAdmin = userRoles?.some(role => role.role === 'admin') || false;
        const isAssignedEmployee = employees?.assigned_warehouse_id; // Prioritize warehouse assignment over admin status
        
        // Build the query with warehouse filtering
        let query = supabase
          .from('products')
          .select('*');

        // Apply filtering logic based on user type
        if (isAssignedEmployee) {
          // Warehouse-assigned employees see ALL products for their assigned warehouse
          query = query.eq('warehouse_id', employees.assigned_warehouse_id);
        } else if (isAdmin && selectedWarehouse) {
          // Admin with warehouse selected - show all products for that warehouse
          query = query.eq('warehouse_id', selectedWarehouse);
        } else if (isAdmin && !selectedWarehouse) {
          // Admin with "All Warehouses" - show all products for user
          query = query.eq('user_id', user.id);
        } else {
          // Unassigned employee - show only their own products
          query = query.eq('user_id', user.id);
          if (selectedWarehouse) {
            query = query.eq('warehouse_id', selectedWarehouse);
          }
        }

        const { data: products, error: productsError } = await query;

        if (productsError) {
          console.error('Error fetching low stock items:', productsError);
          return;
        }

        // Fetch incoming shipments
        let shipmentsQuery = supabase
          .from('shipments')
          .select(`
            id,
            supplier,
            expected_date,
            shipment_items (
              sku,
              name,
              expected_qty
            )
          `)
          .eq('status', 'pending');

        // Apply filtering logic based on user type
        if (isAssignedEmployee) {
          // Warehouse-assigned employees see ALL shipments for their assigned warehouse
          shipmentsQuery = shipmentsQuery.eq('warehouse_id', employees.assigned_warehouse_id);
        } else if (isAdmin && selectedWarehouse) {
          // Admin with warehouse selected - show all shipments for that warehouse
          shipmentsQuery = shipmentsQuery.eq('warehouse_id', selectedWarehouse);
        } else if (isAdmin && !selectedWarehouse) {
          // Admin with "All Warehouses" - show all shipments for user
          shipmentsQuery = shipmentsQuery.eq('user_id', user.id);
        } else {
          // Unassigned employee - show only their own shipments
          shipmentsQuery = shipmentsQuery.eq('user_id', user.id);
          if (selectedWarehouse) {
            shipmentsQuery = shipmentsQuery.eq('warehouse_id', selectedWarehouse);
          }
        }

        const { data: shipments, error: shipmentsError } = await shipmentsQuery;

        if (shipmentsError) {
          console.error('Error fetching shipments:', shipmentsError);
        }

        // Transform shipments data
        const transformedShipments: IncomingShipment[] = (shipments || []).map(shipment => ({
          ...shipment,
          items: shipment.shipment_items || []
        }));

        // Filter and transform products that are actually low stock based on their individual thresholds
        const lowStockProducts = (products || []).filter(product => {
          const threshold = product.low_stock_threshold || 10;
          const quantity = product.quantity || 0;
          return quantity > 0 && quantity <= threshold;
        });

        // Transform and enrich product data
        const enrichedItems: LowStockItem[] = lowStockProducts.map(product => {
          const threshold = product.low_stock_threshold || 10;
          const quantity = product.quantity || 0;
          
          // Calculate priority based on quantity vs threshold
          let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
          if (quantity === 0) {
            priority = 'critical';
          } else if (quantity <= Math.floor(threshold * 0.2)) {
            priority = 'critical';
          } else if (quantity <= Math.floor(threshold * 0.5)) {
            priority = 'high';
          } else if (quantity <= threshold) {
            priority = 'medium';
          }

          // Simulate some analytics data
          const avgWeeklyUsage = Math.max(1, Math.floor(Math.random() * 5) + 1);
          const estimatedStockoutDays = quantity > 0 ? Math.floor((quantity / avgWeeklyUsage) * 7) : 0;

          // Find if there's an incoming shipment for this product
          const incomingShipment = transformedShipments.find(shipment =>
            shipment.items.some(item => item.sku === product.sku)
          );
          
          const shipmentItem = incomingShipment?.items.find(item => item.sku === product.sku);

          return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            upc: product.upc || '',
            quantity: quantity,
            currentStock: quantity, // Same as quantity for consistency
            minThreshold: threshold,
            reorder_point: threshold,
            category: product.category,
            image_url: product.image_url,
            warehouse_id: product.warehouse_id,
            restockDate: incomingShipment?.expected_date || '',
            restockQuantity: shipmentItem?.expected_qty || 0,
            lastRestockDate: product.updated_at,
            avgWeeklyUsage,
            estimatedStockoutDays,
            priority
          };
        });

        // Sort by priority (critical first, then by quantity ascending)
        const sortedItems = enrichedItems.sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return a.quantity - b.quantity;
        });

        setLowStockItems(sortedItems);
        setIncomingShipments(transformedShipments);
      } catch (error) {
        console.error('Exception fetching low stock items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLowStockItems();
  }, [user, selectedWarehouse, employees.length]);

  return {
    lowStockItems,
    incomingShipments,
    isLoading
  };
};
