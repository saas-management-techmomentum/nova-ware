
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';
import { useOrders } from '@/contexts/OrdersContext';

interface OrderProfitData {
  orderId: string;
  customerName: string;
  orderDate: Date;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  itemCount: number;
  status: string;
}

interface ProductProfitData {
  sku: string;
  name: string;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgMargin: number;
}

export const OrderProfitabilityReport = () => {
  const { inventoryItems } = useInventory();
  const { orders } = useOrders();
  const [timeFilter, setTimeFilter] = useState('30');
  const [sortBy, setSortBy] = useState<'profit' | 'margin' | 'revenue'>('profit');

  // Calculate order profitability
  const orderProfitData = useMemo(() => {
    const filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - parseInt(timeFilter));

    return orders
      .filter(order => new Date(order.date) >= filterDate)
      .map(order => {
        let totalRevenue = 0;
        let totalCost = 0;
        let itemCount = 0;

        // Calculate totals for each order item
        order.items?.forEach(item => {
          const inventoryItem = inventoryItems.find(inv => inv.sku === item.sku);
          if (inventoryItem) {
            const revenue = (item.unit_price || inventoryItem.unit_price) * item.qty;
            const cost = (inventoryItem.cost_price || 0) * item.qty;
            
            totalRevenue += revenue;
            totalCost += cost;
            itemCount += item.qty;
          }
        });

        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
          orderId: order.id,
          customerName: order.client,
          orderDate: new Date(order.date),
          totalRevenue,
          totalCost,
          totalProfit,
          profitMargin,
          itemCount,
          status: order.status
        } as OrderProfitData;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'margin':
            return b.profitMargin - a.profitMargin;
          case 'revenue':
            return b.totalRevenue - a.totalRevenue;
          default:
            return b.totalProfit - a.totalProfit;
        }
      });
  }, [orders, inventoryItems, timeFilter, sortBy]);

  // Calculate product profitability
  const productProfitData = useMemo(() => {
    const productMap = new Map<string, ProductProfitData>();

    orders.forEach(order => {
      order.items?.forEach(item => {
        const inventoryItem = inventoryItems.find(inv => inv.sku === item.sku);
        if (inventoryItem) {
          const revenue = (item.unit_price || inventoryItem.unit_price) * item.qty;
          const cost = (inventoryItem.cost_price || 0) * item.qty;
          const profit = revenue - cost;

          if (productMap.has(item.sku)) {
            const existing = productMap.get(item.sku)!;
            existing.unitsSold += item.qty;
            existing.totalRevenue += revenue;
            existing.totalCost += cost;
            existing.totalProfit += profit;
            existing.avgMargin = existing.totalRevenue > 0 ? (existing.totalProfit / existing.totalRevenue) * 100 : 0;
          } else {
            productMap.set(item.sku, {
              sku: item.sku,
              name: inventoryItem.name,
              unitsSold: item.qty,
              totalRevenue: revenue,
              totalCost: cost,
              totalProfit: profit,
              avgMargin: revenue > 0 ? (profit / revenue) * 100 : 0
            });
          }
        }
      });
    });

    return Array.from(productMap.values()).sort((a, b) => b.totalProfit - a.totalProfit);
  }, [orders, inventoryItems]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (percent: number) => {
    return `${percent.toFixed(1)}%`;
  };

  const getProfitBadgeVariant = (margin: number) => {
    if (margin >= 20) return 'default'; // Green for high margin
    if (margin >= 10) return 'secondary'; // Blue for medium margin
    if (margin >= 0) return 'outline'; // Gray for low margin
    return 'destructive'; // Red for loss
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="profit">Total Profit</SelectItem>
            <SelectItem value="margin">Profit Margin %</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Order Profitability Table */}
      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Order Profitability Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-800/90">
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Order ID</TableHead>
                <TableHead className="text-slate-300">Customer</TableHead>
                <TableHead className="text-slate-300">Date</TableHead>
                <TableHead className="text-slate-300 text-right">Revenue</TableHead>
                <TableHead className="text-slate-300 text-right">Cost</TableHead>
                <TableHead className="text-slate-300 text-right">Profit</TableHead>
                <TableHead className="text-slate-300 text-right">Margin</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderProfitData.slice(0, 10).map((order) => (
                <TableRow key={order.orderId} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell className="text-slate-300 font-mono text-sm">
                    {order.orderId.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-slate-300">{order.customerName}</TableCell>
                  <TableCell className="text-slate-400">
                    {order.orderDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right text-indigo-300">
                    {formatCurrency(order.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right text-rose-300">
                    {formatCurrency(order.totalCost)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    order.totalProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}>
                    {formatCurrency(order.totalProfit)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getProfitBadgeVariant(order.profitMargin)}>
                      {formatPercentage(order.profitMargin)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Profitability Table */}
      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Product Profitability Ranking</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-800/90">
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Product</TableHead>
                <TableHead className="text-slate-300">SKU</TableHead>
                <TableHead className="text-slate-300 text-right">Units Sold</TableHead>
                <TableHead className="text-slate-300 text-right">Revenue</TableHead>
                <TableHead className="text-slate-300 text-right">Cost</TableHead>
                <TableHead className="text-slate-300 text-right">Profit</TableHead>
                <TableHead className="text-slate-300 text-right">Avg Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productProfitData.slice(0, 10).map((product) => (
                <TableRow key={product.sku} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell className="text-slate-300 font-medium">{product.name}</TableCell>
                  <TableCell className="text-slate-400 font-mono text-sm">{product.sku}</TableCell>
                  <TableCell className="text-right text-slate-300">{product.unitsSold}</TableCell>
                  <TableCell className="text-right text-indigo-300">
                    {formatCurrency(product.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right text-rose-300">
                    {formatCurrency(product.totalCost)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    product.totalProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}>
                    {formatCurrency(product.totalProfit)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getProfitBadgeVariant(product.avgMargin)}>
                      {formatPercentage(product.avgMargin)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Low Margin Alert */}
      {orderProfitData.some(order => order.profitMargin < 10) && (
        <Card className="bg-amber-950/30 border-amber-700/30">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Margin Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-200">
              You have {orderProfitData.filter(order => order.profitMargin < 10).length} orders with profit margins below 10%. 
              Consider reviewing your pricing strategy or supplier costs for these orders.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
