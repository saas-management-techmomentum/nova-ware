import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';

export interface SalesAnalyticsItem {
  id: string;
  name: string;
  sku: string;
  totalSold: number;
  totalRevenue: number;
  currentStock: number;
  category?: string;
}

export interface SalesAnalytics {
  bestSellers: SalesAnalyticsItem[];
  slowMovingItems: SalesAnalyticsItem[];
  totalItemsSold: number;
  totalRevenue: number;
  hasData: boolean;
}

export const useSalesAnalytics = () => {
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const [analytics, setAnalytics] = useState<SalesAnalytics>({
    bestSellers: [],
    slowMovingItems: [],
    totalItemsSold: 0,
    totalRevenue: 0,
    hasData: false
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalesAnalytics = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get sales data from order items (real sales transactions)
      let orderItemsQuery = supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          sku,
          orders!inner(
            user_id,
            warehouse_id,
            status
          ),
          products(
            id,
            name,
            sku,
            quantity,
            category
          )
        `)
        .eq('orders.user_id', user.id)
        .in('orders.status', ['order-ready', 'order-shipped']); // Only completed orders

      // Filter by warehouse if selected
      if (selectedWarehouse) {
        orderItemsQuery = orderItemsQuery.eq('orders.warehouse_id', selectedWarehouse);
      }

      const { data: orderItems, error } = await orderItemsQuery;

      if (error) {
        console.error('Error fetching sales analytics:', error);
        return;
      }

   

      if (!orderItems || orderItems.length === 0) {
        setAnalytics({
          bestSellers: [],
          slowMovingItems: [],
          totalItemsSold: 0,
          totalRevenue: 0,
          hasData: false
        });
        return;
      }

      // Group by product and calculate totals
      const productSales = new Map<string, {
        id: string;
        name: string;
        sku: string;
        totalSold: number;
        totalRevenue: number;
        currentStock: number;
        category?: string;
      }>();

      let totalItemsSold = 0;
      let totalRevenue = 0;

      orderItems.forEach(item => {
        if (!item.products || !item.product_id) return;

        const productId = item.product_id;
        const quantity = item.quantity || 0;
        const unitPrice = item.unit_price || 0;
        const revenue = quantity * unitPrice;

        totalItemsSold += quantity;
        totalRevenue += revenue;

        const existing = productSales.get(productId);
        if (existing) {
          existing.totalSold += quantity;
          existing.totalRevenue += revenue;
        } else {
          productSales.set(productId, {
            id: item.products.id,
            name: item.products.name,
            sku: item.products.sku,
            totalSold: quantity,
            totalRevenue: revenue,
            currentStock: item.products.quantity || 0,
            category: item.products.category
          });
        }
      });

      const salesArray = Array.from(productSales.values());

      // Best sellers: sorted by total quantity sold
      const bestSellers = [...salesArray]
        .filter(item => item.totalSold > 0)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 10);

      // Get all products to find slow-moving items
      let productsQuery = supabase
        .from('products')
        .select('id, name, sku, quantity, category')
        .eq('user_id', user.id);

      if (selectedWarehouse) {
        productsQuery = productsQuery.eq('warehouse_id', selectedWarehouse);
      }

      const { data: allProducts } = await productsQuery;

      // Slow moving items: products with stock but low/no sales
      const slowMovingItems = (allProducts || [])
        .map(product => {
          const salesData = productSales.get(product.id);
          return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            totalSold: salesData?.totalSold || 0,
            totalRevenue: salesData?.totalRevenue || 0,
            currentStock: product.quantity || 0,
            category: product.category
          };
        })
        .filter(item => item.currentStock > 0) // Only items in stock
        .sort((a, b) => {
          // Sort by sales velocity (sold per stock ratio), then by stock level
          const aVelocity = a.currentStock > 0 ? a.totalSold / a.currentStock : 0;
          const bVelocity = b.currentStock > 0 ? b.totalSold / b.currentStock : 0;
          
          if (aVelocity !== bVelocity) {
            return aVelocity - bVelocity; // Lower velocity first
          }
          return b.currentStock - a.currentStock; // Higher stock first
        })
        .slice(0, 10);

      setAnalytics({
        bestSellers,
        slowMovingItems,
        totalItemsSold,
        totalRevenue,
        hasData: salesArray.length > 0
      });

    } catch (error) {
      console.error('Error calculating sales analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSalesAnalytics();
    }
  }, [user, selectedWarehouse]);

  return {
    analytics,
    isLoading,
    refetch: fetchSalesAnalytics
  };
};