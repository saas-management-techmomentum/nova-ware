
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clipboard, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Truck,
  Factory,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  Box,
  BarChart3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { useWarehouseMetrics } from "@/hooks/useWarehouseMetrics";
import { useUserTaskMetrics } from "@/hooks/useUserTaskMetrics";
import { useWarehouseScopedOrders } from "@/hooks/useWarehouseScopedOrders";
import { useWarehouseScopedInventory } from "@/hooks/useWarehouseScopedInventory";
import { useInventory } from "@/contexts/InventoryContext";
import { useLastActivity } from "@/hooks/useLastActivity";
import { useWarehouse } from "@/contexts/WarehouseContext";
import { checkDataSufficiency, mapTransactionsForPrediction, getBestSellersFromPredictions, getSlowMoversFromPredictions } from "@/utils/inventoryPrediction";
import { useOrderVolumeData } from "@/hooks/useOrderVolumeData";
import SetupCompletionBanner from "@/components/auth/SetupCompletionBanner";
import WarehouseContextIndicator from "@/components/warehouse/WarehouseContextIndicator";
import { OnboardingTrigger } from "@/components/onboarding/OnboardingTrigger";

const Dashboard = () => {
  const { user } = useAuth();
  const { selectedWarehouse, isUserAdmin } = useWarehouse();
  const { data: metrics, isLoading: metricsLoading } = useWarehouseMetrics();
  const { data: userTaskMetrics, isLoading: userTaskMetricsLoading } = useUserTaskMetrics();
  const { orders } = useWarehouseScopedOrders();
  const { inventoryItems } = useWarehouseScopedInventory();
  const { generatePredictions } = useInventory();
  const { lastActivity, isLoading: activityLoading } = useLastActivity();
  const { transactions, isLoading: transactionsLoading } = useInventory();
  const { orderVolumeData, isLoading: volumeLoading } = useOrderVolumeData();

  // Calculate real dashboard stats from warehouse-scoped data
  const activeOrders = orders.filter(order => order.status !== 'order-shipped').length;
  const pendingShipments = orders.filter(order => order.status === 'ready-to-ship').length;
  const predictions = generatePredictions();
  const lowStockAlerts = predictions.filter(item => item.restockUrgency === 'critical').length;

  // Use user-specific task metrics for employees, warehouse metrics for admins
  const shouldUseUserSpecificTasks = userTaskMetrics?.is_user_specific || false;

  // Check data sufficiency for predictive analytics
  const mappedTransactions = mapTransactionsForPrediction(transactions);
  const dataSufficiency = checkDataSufficiency(mappedTransactions);
  
  // Generate predictive analytics only if we have sufficient data
  const bestSellers = dataSufficiency.hasSufficientData ? 
    getBestSellersFromPredictions(predictions, mappedTransactions, inventoryItems) : [];
  const slowMovers = dataSufficiency.hasSufficientData ? 
    getSlowMoversFromPredictions(predictions, mappedTransactions, inventoryItems) : [];
  
  const hasAnalyticsData = dataSufficiency.hasSufficientData && (bestSellers.length > 0 || slowMovers.length > 0);

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-slate-300 text-sm">Processed Orders: </span>
              <span className="text-white font-medium">{data.processedOrders}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-slate-300 text-sm">Backlog Orders: </span>
              <span className="text-white font-medium">{data.backlogOrders}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const topStats = [
    shouldUseUserSpecificTasks ? {
      title: "Total Tasks",
      value: userTaskMetrics?.total_tasks?.toString() || "0",
      icon: Clipboard,
      color: "bg-indigo-500/10 text-indigo-500",
      route: "/app/todos"
    } : {
      title: "Active Orders",
      value: activeOrders.toString(),
      icon: Clipboard,
      color: "bg-indigo-500/10 text-indigo-500",
      route: "/app/orders"
    },
    shouldUseUserSpecificTasks ? {
      title: "Completed Tasks",
      value: userTaskMetrics?.completed_tasks?.toString() || "0",
      icon: CheckCircle,
      color: "bg-emerald-500/10 text-emerald-500",
      route: "/app/todos"
    } : {
      title: "Pending Shipments", 
      value: pendingShipments.toString(),
      icon: Truck,
      color: "bg-emerald-500/10 text-emerald-500",
      route: "/app/shipments"
    },
    shouldUseUserSpecificTasks ? {
      title: "Pending Tasks",
      value: userTaskMetrics?.pending_tasks?.toString() || "0",
      icon: AlertTriangle,
      color: "bg-amber-500/10 text-amber-500",
      route: "/app/todos"
    } : {
      title: "Low Stock Alerts",
      value: lowStockAlerts.toString(),
      icon: AlertTriangle,
      color: "bg-amber-500/10 text-amber-500",
      route: "/app/inventory"
    }
  ];

  // Type-safe metrics access with clickable navigation - using real data only
  const metricsData = metrics as any;
  const warehouseMetrics = [
    {
      title: "Warehouse Efficiency",
      value: metricsData?.warehouse_efficiency || 0,
      change: metricsData?.efficiency_change || 0,
      icon: Factory,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-l-blue-500",
      route: "/app/metrics/warehouse-efficiency"
    },
    {
      title: "Task Completion Rate",
      value: shouldUseUserSpecificTasks 
        ? userTaskMetrics?.completion_rate || 0
        : metricsData?.task_completion_rate || 0,
      change: metricsData?.completion_rate_change || 0,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-l-emerald-500",
      route: shouldUseUserSpecificTasks ? "/app/todos" : "/app/metrics/task-completion"
    },
    {
      title: "Order Processing Speed",
      value: metricsData?.order_processing_speed || 0,
      change: metricsData?.processing_speed_change || 0,
      icon: Zap,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-l-purple-500",
      route: "/app/metrics/order-processing"
    },
    {
      title: "Inventory Accuracy",
      value: metricsData?.inventory_accuracy || 0,
      change: metricsData?.accuracy_change || 0,
      icon: Target,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-l-indigo-500",
      route: "/app/metrics/inventory-accuracy"
    }
  ];

  // Format the last updated text
  const getLastUpdatedText = () => {
    if (activityLoading) return "Loading...";
    if (!lastActivity) return "No recent activity";
    return `Last Updated: ${lastActivity.relativeTime}`;
  };

  // Component to render top stats cards with conditional linking
  const TopStatsCard = ({ stat }: { stat: typeof topStats[0] }) => {
    const cardContent = (
      <Card className={`glass-card-enhanced hover-lift group relative overflow-hidden ${
        selectedWarehouse ? 'cursor-pointer' : ''
      }`}>
        <CardContent className="p-6 relative z-10 flex items-center space-x-4">
          <div className={`metric-icon-primary p-3 rounded-full shadow-lg transition-all duration-300 group-hover:scale-110`}>
            <stat.icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="metric-label text-sm font-medium">{stat.title}</p>
            <h3 className="metric-value text-2xl font-bold">{stat.value}</h3>
          </div>
        </CardContent>
        <div className="h-0.5 w-full bg-gradient-to-r from-logistix-orange via-logistix-blue to-logistix-green opacity-60"></div>
      </Card>
    );

    // Only wrap with Link if warehouse is selected
    if (selectedWarehouse) {
      return (
        <Link to={stat.route} className="block group">
          {cardContent}
        </Link>
      );
    }

    return cardContent;
  };

  // Show warehouse selection prompt for non-admin users without warehouse
  if (!selectedWarehouse && !isUserAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Command Center</h1>
            <Badge className="bg-amber-600 text-white">Select Warehouse</Badge>
          </div>
        </div>

        <WarehouseContextIndicator />
        <SetupCompletionBanner />

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Factory className="h-16 w-16 mb-4 text-slate-500" />
            <p className="text-lg font-medium mb-2 text-white">Select a Warehouse</p>
            <p className="text-sm text-slate-400 text-center max-w-md">
              Please select a warehouse from the header to view your dashboard data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <OnboardingTrigger triggerOn="first-visit" delay={2000} />
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-roboto font-bold text-gradient-animate animate-gradient-text">Command Center</h1>
          <span className="text-xs font-normal text-white px-2 py-0.5 rounded-full bg-logistix-orange shadow-glow-primary animate-pulse-slow">Live</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="glass-metric-card px-3 py-1.5 rounded-md">
            <span>{getLastUpdatedText()}</span>
          </div>
        </div>
      </div>

      <WarehouseContextIndicator />
      <SetupCompletionBanner />

      {/* Top Stats - 3 Cards - Conditionally Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topStats.map((stat, index) => (
          <div key={stat.title} className="animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
            <TopStatsCard stat={stat} />
          </div>
        ))}
      </div>

      {/* Warehouse Metrics - 1x4 Grid - Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {warehouseMetrics.map((metric, index) => (
          <Link key={metric.title} to={metric.route} className="block group">
            <Card className="glass-metric-card hover-lift cursor-pointer overflow-hidden animate-fade-in" style={{animationDelay: `${(index + 3) * 100}ms`}}>
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className={`metric-icon-${metric.color.includes('blue') ? 'primary' : metric.color.includes('emerald') ? 'success' : metric.color.includes('purple') ? 'primary' : 'warning'} p-2 rounded-lg transition-all duration-300 group-hover:scale-110`}>
                    <metric.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className={`text-sm flex items-center gap-1 ${
                    metric.change >= 0 ? 'text-logistix-green' : 'text-coral'
                  }`}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    {metric.change >= 0 ? '+' : ''}{metric.change}%
                  </div>
                </div>
                <p className="metric-label text-sm font-medium">{metric.title}</p>
                <h3 className="metric-value text-2xl font-bold mb-2">{metric.value}%</h3>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      metric.color.includes('blue') ? 'bg-gradient-to-r from-logistix-blue to-violet shadow-glow-primary' :
                      metric.color.includes('emerald') ? 'bg-gradient-to-r from-logistix-green to-emerald shadow-glow-success' :
                      metric.color.includes('purple') ? 'bg-gradient-to-r from-violet to-logistix-blue shadow-glow-primary' :
                      'bg-gradient-to-r from-logistix-orange to-amber shadow-glow-warning'
                    }`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Best Selling & Slow Moving Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
          <CardHeader className="relative pb-2 border-b border-slate-700">
            <CardTitle className="text-lg flex items-center text-white">
              <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
              Best Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {transactionsLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mb-3"></div>
                <p className="text-sm">Loading analytics data...</p>
              </div>
            ) : !dataSufficiency.hasSufficientData ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Box className="h-12 w-12 mb-3 text-slate-500" />
                <p className="text-sm font-medium">Collecting Data</p>
                <p className="text-xs text-slate-500 mt-1">
                  {dataSufficiency.daysWithData} / 30 days collected
                </p>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-3 max-w-xs">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${(dataSufficiency.daysWithData / 30) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  AI predictions available with 30 days of data
                </p>
              </div>
            ) : hasAnalyticsData ? (
              <div className="space-y-3">
                 {bestSellers.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-700/40 to-slate-800/40 rounded-xl border border-slate-600/30 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white w-8 h-8 p-0 flex items-center justify-center text-sm font-bold rounded-full shadow-lg">
                          {index + 1}
                        </Badge>
                        {index === 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded mt-1">{item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{item.totalSold} sold</p>
                      <p className="text-xs text-green-400 font-medium">${item.totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-600">
                  <p className="text-xs text-slate-400 text-center">
                    <span className="inline-flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      AI-Powered Analytics ({dataSufficiency.daysWithData} days)
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Box className="h-12 w-12 mb-3 text-slate-500" />
                <p className="text-sm">No sales data available</p>
                <p className="text-xs text-slate-500 mt-1">Complete orders to see sales analytics</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5" />
          <CardHeader className="relative pb-2 border-b border-slate-700">
            <CardTitle className="text-lg flex items-center text-white">
              <TrendingDown className="h-5 w-5 mr-2 text-orange-400" />
              Slow Moving Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {transactionsLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mb-3"></div>
                <p className="text-sm">Loading analytics data...</p>
              </div>
            ) : !dataSufficiency.hasSufficientData ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Box className="h-12 w-12 mb-3 text-slate-500" />
                <p className="text-sm font-medium">Collecting Data</p>
                <p className="text-xs text-slate-500 mt-1">
                  {dataSufficiency.daysWithData} / 30 days collected
                </p>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-3 max-w-xs">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${(dataSufficiency.daysWithData / 30) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  AI predictions available with 30 days of data
                </p>
              </div>
            ) : hasAnalyticsData ? (
              <div className="space-y-3">
                {slowMovers.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-700/40 to-slate-800/40 rounded-xl border border-slate-600/30 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-8 h-8 p-0 flex items-center justify-center text-sm font-bold rounded-full shadow-lg">
                          {index + 1}
                        </Badge>
                        {item.currentStock > 100 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse" />}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded mt-1">{item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{item.currentStock} in stock</p>
                      <p className="text-xs text-orange-400 font-medium">{item.totalSold} sold</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-600">
                  <p className="text-xs text-slate-400 text-center">
                    <span className="inline-flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      AI-Powered Analytics ({dataSufficiency.daysWithData} days)
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Box className="h-12 w-12 mb-3 text-slate-500" />
                <p className="text-sm">No inventory movement data</p>
                <p className="text-xs text-slate-500 mt-1">Process orders to track item movement</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Order Volume Chart - Only show in Corporate Overview */}
      {selectedWarehouse === null && (
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 overflow-hidden cursor-pointer hover:bg-slate-700/50 hover:border-indigo-500/30 hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2 relative z-10 border-b border-slate-700">
            <CardTitle className="text-lg flex items-center text-white">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-400" />
              Order Volume Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-96">
            {volumeLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mb-3"></div>
                <p className="text-sm">Loading order volume data...</p>
              </div>
            ) : orderVolumeData.hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={orderVolumeData.monthlyData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 20,
                  }}
                >
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip 
                    content={CustomTooltip}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                  />
                  <Bar 
                    dataKey="processedOrders" 
                    stackId="a" 
                    fill="#3b82f6" 
                    radius={[0, 0, 4, 4]}
                    name="Processed Orders"
                  />
                  <Bar 
                    dataKey="backlogOrders" 
                    stackId="a" 
                    fill="#ef4444" 
                    radius={[4, 4, 0, 0]}
                    name="Backlog Orders"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <BarChart3 className="h-16 w-16 mb-4 text-slate-500" />
                <p className="text-lg font-medium mb-2">No order data available</p>
                <p className="text-sm text-slate-500 text-center max-w-md">
                  Start creating and processing orders to see volume trends and analytics
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
