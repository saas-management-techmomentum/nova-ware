
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBilling } from '@/contexts/BillingContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useOrders } from '@/contexts/OrdersContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { DollarSign, FileText, AlertCircle, TrendingUp, Users, Calendar, Package, Building } from 'lucide-react';

interface BillingDashboardProps {
  totalStockValue?: number;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({ totalStockValue = 0 }) => {
  const { invoices, billingRates, isLoading } = useBilling();
  const { inventoryItems } = useInventory();
  const { orders } = useOrders();
  const { selectedWarehouse, canViewAllWarehouses } = useWarehouse();
  
  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;
  
  // Calculate metrics
  const totalRevenue = useMemo(() => {
    return invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  }, [invoices]);

  const pendingInvoices = useMemo(() => {
    return invoices.filter(i => i.status === 'sent').length;
  }, [invoices]);

  const overdueInvoices = useMemo(() => {
    return invoices.filter(i => i.status === 'overdue').length;
  }, [invoices]);

  const paidInvoices = useMemo(() => {
    return invoices.filter(i => i.status === 'paid').length;
  }, [invoices]);

  const collectionRate = useMemo(() => {
    return invoices.length > 0 ? (paidInvoices / invoices.length) * 100 : 0;
  }, [invoices, paidInvoices]);

  // Calculate order profitability metrics
  const orderProfitMetrics = useMemo(() => {
    let totalOrderRevenue = 0;
    let totalOrderCost = 0;
    let profitableOrdersCount = 0;
    let totalOrdersCount = 0;

    orders.forEach(order => {
      let orderRevenue = 0;
      let orderCost = 0;

      order.items?.forEach(item => {
        const inventoryItem = inventoryItems.find(inv => inv.sku === item.sku);
        if (inventoryItem) {
          const revenue = (item.unit_price || inventoryItem.unit_price) * item.qty;
          const cost = (inventoryItem.cost_price || 0) * item.qty;
          
          orderRevenue += revenue;
          orderCost += cost;
        }
      });

      if (orderRevenue > 0) {
        totalOrderRevenue += orderRevenue;
        totalOrderCost += orderCost;
        totalOrdersCount++;
        
        if (orderRevenue > orderCost) {
          profitableOrdersCount++;
        }
      }
    });

    const totalProfit = totalOrderRevenue - totalOrderCost;
    const avgMargin = totalOrderRevenue > 0 ? (totalProfit / totalOrderRevenue) * 100 : 0;
    const profitableRate = totalOrdersCount > 0 ? (profitableOrdersCount / totalOrdersCount) * 100 : 0;

    return {
      totalOrderRevenue,
      totalOrderCost,
      totalProfit,
      avgMargin,
      profitableRate,
      totalOrdersCount
    };
  }, [orders, inventoryItems]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return <div className="text-white">Loading billing data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Corporate Overview Banner */}
      {isInCorporateOverview && (
        <Card className="bg-indigo-900/20 border-indigo-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-indigo-400" />
              <span className="text-indigo-300 font-medium">Corporate Overview</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">Consolidated billing data across all warehouses</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Profitability Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${orderProfitMetrics.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(orderProfitMetrics.totalProfit)}
            </div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {orderProfitMetrics.avgMargin.toFixed(1)}% avg margin
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-400">
              {formatCurrency(orderProfitMetrics.totalOrderRevenue)}
            </div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <DollarSign className="h-3 w-3 mr-1" />
              From {orderProfitMetrics.totalOrdersCount} orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">
              {formatCurrency(orderProfitMetrics.totalOrderCost)}
            </div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <Package className="h-3 w-3 mr-1" />
              Cost of goods sold
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Profitable Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {orderProfitMetrics.profitableRate.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {Math.round((orderProfitMetrics.profitableRate / 100) * orderProfitMetrics.totalOrdersCount)} of {orderProfitMetrics.totalOrdersCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Billing Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-slate-400">From {invoices.length} invoices</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Stock Value</CardTitle>
            <Package className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalStockValue)}</div>
            <p className="text-xs text-slate-400">Current inventory value</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingInvoices}</div>
            <p className="text-xs text-slate-400">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{collectionRate.toFixed(1)}%</div>
            <Progress value={collectionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <FileText className="h-5 w-5 mr-2 text-indigo-400" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <FileText className="h-12 w-12 mb-3 text-slate-500" />
                <p className="text-sm">No invoices found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {isInCorporateOverview 
                    ? "No invoices found across all warehouses"
                    : "Create your first invoice to get started"
                  }
                </p>
              </div>
            ) : (
              invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{invoice.invoice_number}</p>
                    <p className="text-xs text-slate-400">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                    {isInCorporateOverview && invoice.warehouse_id && (
                      <p className="text-xs text-slate-500">WH: {invoice.warehouse_id.slice(0, 8)}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={
                      invoice.status === 'paid' ? 'bg-emerald-500' :
                      invoice.status === 'overdue' ? 'bg-red-500' :
                      'bg-amber-500'
                    }>
                      {invoice.status}
                    </Badge>
                    <span className="text-sm font-medium text-white">{formatCurrency(invoice.total_amount)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-emerald-400" />
              Billing Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {billingRates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <DollarSign className="h-12 w-12 mb-3 text-slate-500" />
                <p className="text-sm">No billing rates found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {isInCorporateOverview 
                    ? "No billing rates found across all warehouses"
                    : "Set up billing rates to track pricing"
                  }
                </p>
              </div>
            ) : (
              billingRates.slice(0, 5).map((rate) => (
                <div key={rate.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{rate.service_type}</p>
                    <p className="text-xs text-slate-400">{rate.rate_type.replace('_', ' ')}</p>
                    {isInCorporateOverview && rate.warehouse_id && (
                      <p className="text-xs text-slate-500">WH: {rate.warehouse_id.slice(0, 8)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-white">{formatCurrency(rate.rate_amount)}</span>
                    {rate.unit && <p className="text-xs text-slate-400">per {rate.unit}</p>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
