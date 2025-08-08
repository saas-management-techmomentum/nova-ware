import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useEmployees } from '@/hooks/useEmployees';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface MonthlyOrderData {
  month: string;
  processedOrders: number;
  backlogOrders: number;
  totalOrders: number;
  revenue: number;
}

export interface OrderVolumeData {
  monthlyData: MonthlyOrderData[];
  totalOrders: number;
  totalRevenue: number;
  hasData: boolean;
}

export const useOrderVolumeData = () => {
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const { employees } = useEmployees();
  const [orderVolumeData, setOrderVolumeData] = useState<OrderVolumeData>({
    monthlyData: [],
    totalOrders: 0,
    totalRevenue: 0,
    hasData: false
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrderVolumeData = async () => {
    if (!user?.id) return;

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

      // Generate the last 12 months of data
      const months: MonthlyOrderData[] = [];
      const today = new Date();

      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        // Get orders for this month
        let ordersQuery = supabase
          .from('orders')
          .select('id, status, created_at')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        // Apply filtering logic based on user type
        if (isAssignedEmployee) {
          // Warehouse-assigned employees see ALL orders for their assigned warehouse
          ordersQuery = ordersQuery.eq('warehouse_id', employees.assigned_warehouse_id);
        } else if (isAdmin && selectedWarehouse) {
          // Admin with warehouse selected - show all orders for that warehouse
          ordersQuery = ordersQuery.eq('warehouse_id', selectedWarehouse);
        } else if (isAdmin && !selectedWarehouse) {
          // Admin with "All Warehouses" - show all orders for user
          ordersQuery = ordersQuery.eq('user_id', user.id);
        } else {
          // Unassigned employee - show only their own orders
          ordersQuery = ordersQuery.eq('user_id', user.id);
          if (selectedWarehouse) {
            ordersQuery = ordersQuery.eq('warehouse_id', selectedWarehouse);
          }
        }

        const { data: orders, error } = await ordersQuery;

        if (error) {
          console.error('Error fetching orders for month:', format(monthDate, 'MMM yyyy'), error);
          continue;
        }

        // Calculate metrics for this month
        const totalOrders = orders?.length || 0;
        const processedOrders = orders?.filter(order => 
          ['order-ready', 'order-shipped'].includes(order.status)
        ).length || 0;
        const backlogOrders = totalOrders - processedOrders;

        // Calculate revenue for completed orders by fetching order items separately
        let revenue = 0;
        if (orders && orders.length > 0) {
          const completedOrderIds = orders
            .filter(order => ['order-ready', 'order-shipped'].includes(order.status))
            .map(order => order.id);

          if (completedOrderIds.length > 0) {
            const { data: orderItems } = await supabase
              .from('order_items')
              .select('quantity, unit_price')
              .in('order_id', completedOrderIds);

            if (orderItems) {
              revenue = orderItems.reduce((sum, item) => {
                return sum + ((item.quantity || 0) * (item.unit_price || 0));
              }, 0);
            }
          }
        }

        months.push({
          month: format(monthDate, 'MMM yyyy'),
          processedOrders,
          backlogOrders,
          totalOrders,
          revenue
        });
      }

      // Calculate totals
      const totalOrders = months.reduce((sum, month) => sum + month.totalOrders, 0);
      const totalRevenue = months.reduce((sum, month) => sum + month.revenue, 0);
      const hasData = totalOrders > 0;

      console.log('Order volume data calculated:', {
        monthsWithData: months.filter(m => m.totalOrders > 0).length,
        totalOrders,
        totalRevenue,
        hasData
      });

      setOrderVolumeData({
        monthlyData: months,
        totalOrders,
        totalRevenue,
        hasData
      });

    } catch (error) {
      console.error('Error fetching order volume data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && employees.length > 0) { // Wait for employees to load
      fetchOrderVolumeData();
    }
  }, [user, selectedWarehouse, employees.length]);

  return {
    orderVolumeData,
    isLoading,
    refetch: fetchOrderVolumeData
  };
};