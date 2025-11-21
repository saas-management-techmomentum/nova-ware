import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Package, 
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const OrderImpactSummary: React.FC = () => {
  const { data: orderImpact, isLoading } = useQuery({
    queryKey: ['orderImpactSummary'],
    queryFn: async () => {
      // Get recent completed orders first
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, created_at, customer_name')
        .in('status', ['order-ready', 'order-shipped'])
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        return {
          totalRevenue: 0,
          totalCOGS: 0,
          grossProfit: 0,
          grossMargin: 0,
          orderCount: 0,
          avgOrderValue: 0
        };
      }

      // Get order items for these orders
      const orderIds = orders.map(order => order.id);
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          order_id,
          quantity,
          unit_price,
          product_id,
          products (
            cost_price,
            name
          )
        `)
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      // Calculate totals
      let totalRevenue = 0;
      let totalCOGS = 0;
      const orderCount = orders.length;

      orderItems?.forEach(item => {
        const revenue = (item.unit_price || item.products?.cost_price || 0) * item.quantity;
        const cogs = (item.products?.cost_price || 0) * item.quantity;
        totalRevenue += revenue;
        totalCOGS += cogs;
      });

      return {
        totalRevenue,
        totalCOGS,
        grossProfit: totalRevenue - totalCOGS,
        grossMargin: totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0,
        orderCount,
        avgOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0
      };
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return null;
  }

  const data = orderImpact || {
    totalRevenue: 0,
    totalCOGS: 0,
    grossProfit: 0,
    grossMargin: 0,
    orderCount: 0,
    avgOrderValue: 0
  };

  // Grid element removed - component now returns null
  return null;
};
