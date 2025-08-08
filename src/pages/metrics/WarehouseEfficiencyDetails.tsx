import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Factory, TrendingUp, ArrowLeft, RefreshCw, Building2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWarehouseMetrics } from '@/hooks/useWarehouseMetrics';
import { useWarehouseMetricsRealtime } from '@/hooks/useWarehouseMetricsRealtime';
import { getRelativeTimeString } from '@/utils/warehouseMetrics';
import { useWarehouse } from '@/contexts/WarehouseContext';

const WarehouseEfficiencyDetails = () => {
  const { selectedWarehouse } = useWarehouse();
  const { data: metrics, isLoading, refetch, dataUpdatedAt } = useWarehouseMetrics();
  const [lastUpdated, setLastUpdated] = useState<string>("just now");

  // Set up real-time updates
  useWarehouseMetricsRealtime(selectedWarehouse);

  // Format historical data for the chart
  const historicalData = metrics?.historical_data || [];

  const factors = [
    { 
      title: 'Order Processing', 
      value: `${metrics?.order_processing_speed || 0}%`, 
      change: metrics?.processing_speed_change || 0,
      description: `${metrics?.completed_orders || 0} of ${metrics?.total_orders || 0} orders completed successfully.`,
      details: `${(metrics?.total_orders || 0) - (metrics?.completed_orders || 0)} orders still in progress`
    },
    { 
      title: 'Inventory Health', 
      value: `${metrics?.inventory_accuracy || 0}%`, 
      change: metrics?.accuracy_change || 0,
      description: `${metrics?.healthy_stock_items || 0} of ${metrics?.total_products || 0} items at optimal stock levels.`,
      details: `${metrics?.critical_stock_items || 0} critical, ${metrics?.warning_stock_items || 0} warning items`
    },
    { 
      title: 'Task Completion', 
      value: `${metrics?.task_completion_rate || 0}%`, 
      change: metrics?.completion_rate_change || 0,
      description: 'Operational tasks completed on schedule based on order flow.',
      details: 'Calculated from inventory transactions and order processing'
    }
  ];

  useEffect(() => {
    if (!dataUpdatedAt) return;
    
    const updateTime = () => {
      setLastUpdated(getRelativeTimeString(new Date(dataUpdatedAt)));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 30000);
    
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  const handleManualRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in text-white">
        <div className="flex items-center gap-4 mb-2">
          <Button asChild variant="outline" size="icon" className="h-8 w-8 border-slate-700 bg-slate-800/50">
            <Link to="/app">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Real-Time Warehouse Efficiency
          </h1>
        </div>
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-3"></div>
              <p className="text-slate-400">Loading efficiency metrics...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Header with Warehouse Context */}
      <div className="flex items-center gap-4 mb-2">
        <Button asChild variant="outline" size="icon" className="h-8 w-8 border-slate-700 bg-slate-800/50">
          <Link to="/app">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Real-Time Warehouse Efficiency
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">
              {metrics?.warehouse_context === 'corporate_overview' 
                ? `Corporate Overview${metrics?.company_name ? ` - ${metrics.company_name}` : ''}`
                : `${metrics?.warehouse_name || 'Unknown Warehouse'}${metrics?.warehouse_code ? ` (${metrics.warehouse_code})` : ''}`
              }
            </span>
            <Badge variant="outline" className="text-xs">
              {metrics?.warehouse_context === 'corporate_overview' ? 'All Warehouses' : 'Single Warehouse'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Efficiency Card */}
      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 overflow-hidden">
        <CardHeader className="pb-2 relative z-10 border-b border-slate-700">
          <CardTitle className="text-xl flex items-center text-white gap-2">
            <Factory className="h-6 w-6 text-indigo-400" />
            Current Efficiency: {metrics?.warehouse_efficiency || 0}%
            <div className="flex items-center gap-1 ml-2">
              {(metrics?.efficiency_change || 0) >= 0 ? (
                <ArrowUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                (metrics?.efficiency_change || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {Math.abs(metrics?.efficiency_change || 0)}%
              </span>
            </div>
            <span className="ml-auto text-sm flex items-center gap-1 text-emerald-400 font-normal">
              <TrendingUp className="h-4 w-4" />
              Live Data
            </span>
            <Button 
              variant="ghost"
              size="sm"
              className="ml-2 h-8 w-8 p-0"
              onClick={handleManualRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh data</span>
            </Button>
          </CardTitle>
          <div className="text-xs text-slate-400 mt-1">
            Calculated from {metrics?.total_orders || 0} orders, {metrics?.total_products || 0} inventory items
            • Last updated: {lastUpdated}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Progress 
            value={metrics?.warehouse_efficiency || 0} 
            className="h-2.5 mb-8 bg-slate-700"
            indicatorClassName="bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]"
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200">Live Performance Metrics</h3>
              <p className="text-slate-300">
                Efficiency metrics calculated from real-time data across{' '}
                {metrics?.warehouse_context === 'corporate_overview' ? 'all warehouses' : 'this warehouse'}.
              </p>
              
              <div className="space-y-4 mt-4">
                {factors.map((factor, index) => (
                  <Card key={index} className="bg-slate-800/70 border-slate-700/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white">{factor.title}</h4>
                        <div className="flex items-center gap-2">
                          <div className="text-xl font-semibold text-indigo-400">{factor.value}</div>
                          <div className="flex items-center gap-1">
                            {factor.change >= 0 ? (
                              <ArrowUp className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-red-400" />
                            )}
                            <span className={`text-xs ${
                              factor.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {Math.abs(factor.change)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-1">{factor.description}</p>
                      <p className="text-xs text-slate-500">{factor.details}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Historical Trends */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200">12-Month Efficiency Trend</h3>
              <div className="h-80 bg-slate-800/70 rounded-lg border border-slate-700 p-4">
                {historicalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={historicalData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" tick={{ fill: '#94a3b8' }} />
                      <YAxis domain={[70, 100]} tick={{ fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                        labelStyle={{ color: '#f8fafc' }}
                        formatter={(value: any, name: string) => [
                          `${value}%`,
                          name === 'efficiency' ? 'Efficiency' : name
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="efficiency" 
                        stroke="#6366f1" 
                        fill="url(#colorEfficiency)" 
                        fillOpacity={0.3} 
                        activeDot={{ r: 8, fill: '#6366f1' }} 
                      />
                      <defs>
                        <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Factory className="h-12 w-12 mb-3 text-slate-500" />
                    <p className="text-sm">No historical data available</p>
                    <p className="text-xs text-slate-500 mt-1">Data will appear as operations are recorded</p>
                  </div>
                )}
              </div>
              
              {/* Current System Status */}
              <h3 className="text-lg font-medium text-slate-200 mt-6">Current System Status</h3>
              <div className="space-y-3">
                <div className="p-4 bg-slate-800/70 rounded-lg border border-slate-700/50">
                  <h4 className="font-medium text-white">Order Processing Pipeline</h4>
                  <p className="text-sm text-slate-400">
                    {metrics?.completed_orders || 0} completed, {metrics?.active_orders || 0} active orders
                  </p>
                </div>
                <div className="p-4 bg-slate-800/70 rounded-lg border border-slate-700/50">
                  <h4 className="font-medium text-white">Inventory Status</h4>
                  <p className="text-sm text-slate-400">
                    {metrics?.critical_stock_items || 0} critical alerts, {metrics?.healthy_stock_items || 0} optimal items
                  </p>
                </div>
                <div className="p-4 bg-slate-800/70 rounded-lg border border-slate-700/50">
                  <h4 className="font-medium text-white">Real-time Updates</h4>
                  <p className="text-sm text-slate-400">
                    Metrics refresh every 30 seconds with live operational data
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarehouseEfficiencyDetails;