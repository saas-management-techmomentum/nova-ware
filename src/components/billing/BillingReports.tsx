
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useBilling } from '@/contexts/BillingContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, Download, Calendar, AlertCircle, Building } from 'lucide-react';

export const BillingReports = () => {
  const { invoices, isLoading } = useBilling();
  const { selectedWarehouse, canViewAllWarehouses } = useWarehouse();
  const [reportType, setReportType] = useState('revenue');
  const [timeRange, setTimeRange] = useState('30');

  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;

  // Prepare revenue data from invoices
  const revenueData = invoices.reduce((acc, invoice) => {
    const month = new Date(invoice.invoice_date).toLocaleString('default', { month: 'short' });
    const existingMonth = acc.find(item => item.month === month);
    
    if (existingMonth) {
      existingMonth.revenue += invoice.total_amount;
    } else {
      acc.push({ month, revenue: invoice.total_amount });
    }
    
    return acc;
  }, [] as { month: string; revenue: number }[]);

  // Prepare service breakdown data from invoices
  const serviceData = [
    { service: 'Storage', value: invoices.filter(i => i.notes?.includes('storage')).reduce((sum, i) => sum + i.total_amount, 0) || 500 },
    { service: 'Handling', value: invoices.filter(i => i.notes?.includes('handling')).reduce((sum, i) => sum + i.total_amount, 0) || 300 },
    { service: 'Shipping', value: invoices.filter(i => i.notes?.includes('shipping')).reduce((sum, i) => sum + i.total_amount, 0) || 200 },
    { service: 'Receiving', value: invoices.filter(i => i.notes?.includes('receiving')).reduce((sum, i) => sum + i.total_amount, 0) || 150 }
  ].filter(item => item.value > 0);

  const COLORS = ['#6b7280', '#9ca3af', '#ec4899', '#f59e0b', '#10b981'];

  if (isLoading) {
    return <div className="text-white">Loading billing reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Corporate Overview Banner */}
      {isInCorporateOverview && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-slate-400" />
              <span className="text-slate-300 font-medium">Corporate Overview</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">Consolidated billing reports across all warehouses</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Billing Reports</h2>
          {isInCorporateOverview && (
            <p className="text-slate-400 mt-1">Showing consolidated reports from all warehouses</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-slate-600">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-gray-400" />
              Monthly Revenue
              {isInCorporateOverview && (
                <span className="ml-2 text-sm text-slate-400">(All Warehouses)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="revenue" fill="#6b7280" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <BarChart3 className="h-12 w-12 mb-3 text-slate-500" />
                <p className="text-sm">No revenue data available</p>
                <p className="text-xs text-slate-500 mt-1">
                  {isInCorporateOverview 
                    ? "No invoices found across all warehouses"
                    : "Create invoices to see revenue trends"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Breakdown */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-emerald-400" />
              Revenue by Service
              {isInCorporateOverview && (
                <span className="ml-2 text-sm text-slate-400">(All Warehouses)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serviceData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {serviceData.map((item, index) => (
                    <div key={item.service} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-slate-300 capitalize">{item.service}</span>
                      </div>
                      <span className="text-white">${item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <PieChartIcon className="h-12 w-12 mb-3 text-slate-500" />
                <p className="text-sm">No service data available</p>
                <p className="text-xs text-slate-500 mt-1">
                  {isInCorporateOverview 
                    ? "Add service details to invoices across warehouses to see breakdown"
                    : "Add service details to invoices to see breakdown"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              ${invoices.reduce((sum, inv) => sum + inv.total_amount, 0).toLocaleString()}
            </div>
            <p className="text-slate-400 text-sm">
              Total Revenue {isInCorporateOverview && "(All Warehouses)"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{invoices.length}</div>
            <p className="text-slate-400 text-sm">
              Total Invoices {isInCorporateOverview && "(All Warehouses)"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              ${invoices.length > 0 ? (invoices.reduce((sum, inv) => sum + inv.total_amount, 0) / invoices.length).toFixed(0) : '0'}
            </div>
            <p className="text-slate-400 text-sm">Avg Invoice</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {invoices.length > 0 ? ((invoices.filter(i => i.status === 'paid').length / invoices.length) * 100).toFixed(1) : '0.0'}%
            </div>
            <p className="text-slate-400 text-sm">Collection Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
